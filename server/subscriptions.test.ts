import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  PLANS,
  getPlan,
  calculateCheckoutAmounts,
  canCreateEvent,
  canCreateClass,
  canCreateCourse,
  PLAN_ORDER,
  type PlanKey,
} from "./stripe/plans";

// ─── Plan definitions ─────────────────────────────────────────────────────────

describe("PLANS definitions", () => {
  it("should have exactly 4 plans", () => {
    expect(Object.keys(PLANS)).toHaveLength(4);
    expect(Object.keys(PLANS)).toEqual(["starter", "creator", "promoter_plan", "academy"]);
  });

  it("starter plan should be free with highest commission", () => {
    const starter = PLANS.starter;
    expect(starter.priceGBP).toBe(0);
    expect(starter.commissionRate).toBe(0.08); // 8%
    expect(starter.limits.eventsPerMonth).toBe(1);  // 1 event/month
    expect(starter.limits.weeklyClasses).toBe(0);   // no weekly classes
    expect(starter.limits.courses).toBe(0);
  });

  it("creator plan should have lower commission than starter", () => {
    expect(PLANS.creator.commissionRate).toBeLessThan(PLANS.starter.commissionRate);
    expect(PLANS.creator.priceGBP).toBeGreaterThan(0);
  });

  it("promoter_plan should have more events than creator", () => {
    const creatorEvents = PLANS.creator.limits.eventsPerMonth ?? Infinity;
    const promoterEvents = PLANS.promoter_plan.limits.eventsPerMonth ?? Infinity;
    expect(promoterEvents).toBeGreaterThan(creatorEvents);
  });

  it("academy plan should have unlimited events and classes", () => {
    expect(PLANS.academy.limits.eventsPerMonth).toBeNull();
    expect(PLANS.academy.limits.weeklyClasses).toBeNull();
    expect(PLANS.academy.limits.courses).toBeNull();
  });

  it("academy plan should have the lowest commission rate", () => {
    const rates = Object.values(PLANS).map(p => p.commissionRate);
    expect(PLANS.academy.commissionRate).toBe(Math.min(...rates));
  });

  it("all plans should have required fields", () => {
    for (const [key, plan] of Object.entries(PLANS)) {
      expect(plan.name, `${key} missing name`).toBeTruthy();
      expect(plan.description, `${key} missing description`).toBeTruthy();
      expect(typeof plan.priceGBP, `${key} priceGBP should be number`).toBe("number");
      expect(typeof plan.commissionRate, `${key} commissionRate should be number`).toBe("number");
      expect(plan.features, `${key} features should be array`).toBeInstanceOf(Array);
      expect(plan.features.length, `${key} should have at least 1 feature`).toBeGreaterThan(0);
    }
  });
});

// ─── getPlan ──────────────────────────────────────────────────────────────────

describe("getPlan", () => {
  it("returns correct plan for valid key", () => {
    expect(getPlan("starter")).toBe(PLANS.starter);
    expect(getPlan("creator")).toBe(PLANS.creator);
    expect(getPlan("promoter_plan")).toBe(PLANS.promoter_plan);
    expect(getPlan("academy")).toBe(PLANS.academy);
  });

  it("returns starter plan for unknown key", () => {
    expect(getPlan("unknown" as PlanKey)).toBe(PLANS.starter);
  });

  it("returns starter plan for null/undefined", () => {
    expect(getPlan(null as any)).toBe(PLANS.starter);
    expect(getPlan(undefined as any)).toBe(PLANS.starter);
  });
});

// ─── PLAN_ORDER ───────────────────────────────────────────────────────────────

describe("PLAN_ORDER", () => {
  it("should be in ascending order of value", () => {
    expect(PLAN_ORDER).toEqual(["starter", "creator", "promoter_plan", "academy"]);
  });

  it("starter should have lowest index", () => {
    expect(PLAN_ORDER.indexOf("starter")).toBe(0);
  });

  it("academy should have highest index", () => {
    expect(PLAN_ORDER.indexOf("academy")).toBe(PLAN_ORDER.length - 1);
  });
});

// ─── calculateCheckoutAmounts ─────────────────────────────────────────────────

describe("calculateCheckoutAmounts", () => {
  it("calculates correct amounts for starter plan (8% commission)", () => {
    const result = calculateCheckoutAmounts(1000, "starter"); // £10 ticket
    expect(result.ticketPricePence).toBe(1000);
    expect(result.commissionRate).toBe(0.08);
    expect(result.platformFeePence).toBe(80); // 8% of 1000
    // Stripe fee: (1000 + 80) * 0.029 + 30 = 31.32 + 30 = 61.32 → 61 pence
    expect(result.stripeFeePence).toBeGreaterThan(0);
    expect(result.totalPence).toBe(result.ticketPricePence + result.platformFeePence + result.stripeFeePence);
  });

  it("calculates correct amounts for academy plan (lowest commission)", () => {
    const result = calculateCheckoutAmounts(1000, "academy");
    expect(result.commissionRate).toBeLessThan(0.08);
    expect(result.platformFeePence).toBeLessThan(80);
  });

  it("platform fee is lower for higher tier plans", () => {
    const starterFee = calculateCheckoutAmounts(1000, "starter").platformFeePence;
    const creatorFee = calculateCheckoutAmounts(1000, "creator").platformFeePence;
    const promoterFee = calculateCheckoutAmounts(1000, "promoter_plan").platformFeePence;
    const academyFee = calculateCheckoutAmounts(1000, "academy").platformFeePence;
    expect(starterFee).toBeGreaterThanOrEqual(creatorFee);
    expect(creatorFee).toBeGreaterThanOrEqual(promoterFee);
    expect(promoterFee).toBeGreaterThanOrEqual(academyFee);
  });

  it("total is always greater than ticket price (fees are additive)", () => {
    for (const planKey of Object.keys(PLANS) as PlanKey[]) {
      const result = calculateCheckoutAmounts(2000, planKey);
      expect(result.totalPence).toBeGreaterThan(result.ticketPricePence);
    }
  });

  it("handles zero-price ticket", () => {
    const result = calculateCheckoutAmounts(0, "starter");
    expect(result.ticketPricePence).toBe(0);
    expect(result.platformFeePence).toBe(0);
    // Stripe still charges a fixed fee even for £0
    expect(result.totalPence).toBeGreaterThanOrEqual(0);
  });

  it("rounds all amounts to whole pence", () => {
    const result = calculateCheckoutAmounts(999, "creator"); // £9.99 — odd number
    expect(Number.isInteger(result.ticketPricePence)).toBe(true);
    expect(Number.isInteger(result.platformFeePence)).toBe(true);
    expect(Number.isInteger(result.stripeFeePence)).toBe(true);
    expect(Number.isInteger(result.totalPence)).toBe(true);
  });

  it("falls back to starter commission for unknown plan", () => {
    const knownResult = calculateCheckoutAmounts(1000, "starter");
    const unknownResult = calculateCheckoutAmounts(1000, "unknown_plan" as PlanKey);
    expect(unknownResult.commissionRate).toBe(knownResult.commissionRate);
  });
});

// ─── canCreateEvent ───────────────────────────────────────────────────────────

describe("canCreateEvent", () => {
  it("starter: allows 1 event per month, blocks at limit", () => {
    expect(canCreateEvent("starter", 0).allowed).toBe(true);
    expect(canCreateEvent("starter", 1).allowed).toBe(false);
    expect(canCreateEvent("starter", 5).allowed).toBe(false);
  });

  it("creator: allows up to plan limit", () => {
    const limit = PLANS.creator.limits.eventsPerMonth!;
    expect(canCreateEvent("creator", 0).allowed).toBe(true);
    expect(canCreateEvent("creator", limit - 1).allowed).toBe(true);
    expect(canCreateEvent("creator", limit).allowed).toBe(false);
  });

  it("academy: always allows (unlimited)", () => {
    expect(canCreateEvent("academy", 0).allowed).toBe(true);
    expect(canCreateEvent("academy", 1000).allowed).toBe(true);
    expect(canCreateEvent("academy", 999999).allowed).toBe(true);
  });

  it("promoter_plan: allows more events than creator", () => {
    const creatorLimit = PLANS.creator.limits.eventsPerMonth!;
    // promoter should allow at least creatorLimit events
    expect(canCreateEvent("promoter_plan", creatorLimit).allowed).toBe(true);
  });
});

// ─── canCreateClass ───────────────────────────────────────────────────────────

describe("canCreateClass", () => {
  it("starter: blocks all classes (limit is 0)", () => {
    // Starter plan has 0 weekly classes allowed
    expect(canCreateClass("starter", 0).allowed).toBe(false);
  });

  it("creator: allows 1 class, blocks at limit", () => {
    expect(canCreateClass("creator", 0).allowed).toBe(true);
    expect(canCreateClass("creator", 1).allowed).toBe(false);
  });

  it("academy: always allows (unlimited)", () => {
    expect(canCreateClass("academy", 0).allowed).toBe(true);
    expect(canCreateClass("academy", 500).allowed).toBe(true);
  });
});

// ─── canCreateCourse ──────────────────────────────────────────────────────────

describe("canCreateCourse", () => {
  it("starter: cannot create any courses (limit is 0)", () => {
    expect(canCreateCourse("starter", 0).allowed).toBe(false);
  });

  it("creator: cannot create any courses (limit is 0)", () => {
    expect(canCreateCourse("creator", 0).allowed).toBe(false);
  });

  it("academy: always allows (unlimited courses)", () => {
    expect(canCreateCourse("academy", 0).allowed).toBe(true);
    expect(canCreateCourse("academy", 100).allowed).toBe(true);
  });
});

// ─── Commission rate ordering ─────────────────────────────────────────────────

describe("commission rate ordering", () => {
  it("commission rates decrease as plan tier increases", () => {
    const rates = PLAN_ORDER.map(key => PLANS[key].commissionRate);
    for (let i = 1; i < rates.length; i++) {
      expect(rates[i]).toBeLessThanOrEqual(rates[i - 1]);
    }
  });

  it("all commission rates are between 0 and 1 (exclusive)", () => {
    for (const plan of Object.values(PLANS)) {
      expect(plan.commissionRate).toBeGreaterThan(0);
      expect(plan.commissionRate).toBeLessThan(1);
    }
  });
});

// ─── Price ordering ───────────────────────────────────────────────────────────

describe("plan price ordering", () => {
  it("plan prices increase with tier", () => {
    const prices = PLAN_ORDER.map(key => PLANS[key].priceGBP);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  it("starter is free", () => {
    expect(PLANS.starter.priceGBP).toBe(0);
  });

  it("all paid plans have positive price", () => {
    const paidPlans = PLAN_ORDER.slice(1) as PlanKey[];
    for (const key of paidPlans) {
      expect(PLANS[key].priceGBP).toBeGreaterThan(0);
    }
  });
});
