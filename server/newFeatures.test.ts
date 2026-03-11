/**
 * Tests for three new features:
 * 1. Entitlement enforcement (plan limits)
 * 2. Scheduled campaign processor
 * 3. Unsubscribe link (HMAC token generation + URL building)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── 1. Entitlement enforcement (from plans.ts) ───────────────────────────────
import { PLANS, canCreateEvent, canCreateClass, canCreateCourse } from "./stripe/plans";

describe("Entitlement enforcement", () => {
  it("starter plan allows 1 event per month", () => {
    const plan = PLANS.starter;
    expect(plan.limits.eventsPerMonth).toBe(1);
  });

  it("academy plan has unlimited events (null)", () => {
    const plan = PLANS.academy;
    expect(plan.limits.eventsPerMonth).toBeNull();
  });

  it("canCreateEvent returns allowed=true when under limit", () => {
    const result = canCreateEvent("starter", 0);
    expect(result.allowed).toBe(true);
  });

  it("canCreateEvent returns allowed=false when at limit", () => {
    const result = canCreateEvent("starter", 1); // starter limit is 1
    expect(result.allowed).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it("canCreateEvent returns allowed=true for unlimited plan", () => {
    const result = canCreateEvent("academy", 9999);
    expect(result.allowed).toBe(true);
  });

  it("canCreateClass returns allowed=true when under limit", () => {
    const result = canCreateClass("creator", 0); // creator limit is 1, so 0 used is under limit
    expect(result.allowed).toBe(true);
  });

  it("canCreateClass returns allowed=false when at limit", () => {
    const plan = PLANS.creator;
    const limit = plan.limits.weeklyClasses as number;
    const result = canCreateClass("creator", limit);
    expect(result.allowed).toBe(false);
  });

  it("canCreateCourse returns allowed=false for starter (courses=0)", () => {
    const result = canCreateCourse("starter", 0); // starter courses limit is 0
    expect(result.allowed).toBe(false);
  });

  it("canCreateCourse returns allowed=true for academy (unlimited)", () => {
    const result = canCreateCourse("academy", 999);
    expect(result.allowed).toBe(true);
  });

  it("unknown plan falls back to starter limits", () => {
    const result = canCreateEvent("unknown_plan" as any, 1);
    // starter limit is 1, so 1 should be blocked
    expect(result.allowed).toBe(false);
  });
});

// ─── 2. Scheduled campaign processor ─────────────────────────────────────────
import { processScheduledCampaigns, processCampaign } from "./features/scheduledCampaigns";

describe("Scheduled campaign processor", () => {
  it("exports processScheduledCampaigns as a function", () => {
    expect(typeof processScheduledCampaigns).toBe("function");
  });

  it("exports processCampaign as a function", () => {
    expect(typeof processCampaign).toBe("function");
  });

  it("processScheduledCampaigns returns early when DB is unavailable", async () => {
    // Mock getDb to return null
    vi.mock("./db", () => ({ getDb: vi.fn().mockResolvedValue(null) }));
    // Should not throw
    await expect(processScheduledCampaigns()).resolves.toBeUndefined();
    vi.restoreAllMocks();
  });

  it("processCampaign throws when DB is unavailable", async () => {
    vi.mock("./db", () => ({ getDb: vi.fn().mockResolvedValue(null) }));
    await expect(processCampaign(1)).rejects.toThrow("Database not available");
    vi.restoreAllMocks();
  });
});

// ─── 3. Unsubscribe link (HMAC token) ─────────────────────────────────────────
import { generateUnsubscribeToken, buildUnsubscribeUrl } from "./features/emailTracking";

describe("Unsubscribe token generation", () => {
  it("generates a 32-character hex token", () => {
    const token = generateUnsubscribeToken(42);
    expect(token).toHaveLength(32);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });

  it("generates the same token for the same contactId (deterministic)", () => {
    const t1 = generateUnsubscribeToken(100);
    const t2 = generateUnsubscribeToken(100);
    expect(t1).toBe(t2);
  });

  it("generates different tokens for different contactIds", () => {
    const t1 = generateUnsubscribeToken(1);
    const t2 = generateUnsubscribeToken(2);
    expect(t1).not.toBe(t2);
  });

  it("builds a valid unsubscribe URL", () => {
    const url = buildUnsubscribeUrl("https://consabor.uk", 42);
    expect(url).toMatch(/^https:\/\/consabor\.uk\/api\/email\/unsubscribe\/42\/[0-9a-f]{32}$/);
  });

  it("unsubscribe URL contains the correct contactId", () => {
    const url = buildUnsubscribeUrl("https://consabor.uk", 99);
    expect(url).toContain("/99/");
  });

  it("unsubscribe URL token matches generateUnsubscribeToken", () => {
    const contactId = 55;
    const expectedToken = generateUnsubscribeToken(contactId);
    const url = buildUnsubscribeUrl("https://consabor.uk", contactId);
    expect(url).toContain(expectedToken);
  });

  it("works with different base URLs", () => {
    const url = buildUnsubscribeUrl("https://example.com", 1);
    expect(url).toContain("https://example.com/api/email/unsubscribe/");
  });
});
