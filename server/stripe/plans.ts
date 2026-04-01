/**
 * Subscription Plan Definitions
 * Single source of truth for all plan limits, fees, and Stripe price IDs.
 * Plan keys match the `subscriptionPlan` enum in drizzle/schema.ts.
 *
 * Billing intervals:
 *   - monthly: standard monthly price
 *   - yearly:  20% discount applied (price = monthly * 12 * 0.80)
 */

export type PlanKey = "starter" | "creator" | "promoter_plan" | "academy";
export type BillingInterval = "monthly" | "yearly";

export interface PlanPricing {
  monthly: number;   // GBP per month
  yearly: number;    // GBP per year (20% off 12× monthly)
}

export interface StripePriceIds {
  monthly: string | null;
  yearly: string | null;
}

export interface PlanDefinition {
  key: PlanKey;
  name: string;
  description: string;
  /** Monthly price in GBP (0 = free). Use pricing.monthly for display. */
  priceGBP: number;
  pricing: PlanPricing;
  stripePriceIds: StripePriceIds;
  /** @deprecated Use stripePriceIds.monthly instead */
  stripePriceId: string | null;
  stripeProductName: string;
  /** Commission taken from ticket sales as a decimal (e.g. 0.08 = 8%) */
  commissionRate: number;
  /** Commission taken from course sales as a decimal (e.g. 0.15 = 15%) */
  courseCommissionRate: number;
  limits: {
    eventsPerMonth: number | null;   // null = unlimited
    weeklyClasses: number | null;    // null = unlimited
    courses: number | null;          // null = unlimited
    instructors: number | null;      // null = unlimited
  };
  features: string[];
  /** Roles this plan is appropriate for */
  targetRoles: ("user" | "instructor" | "promoter" | "admin")[];
}

/**
 * Calculate yearly price from monthly price with 20% discount.
 * Returns the annual total in GBP (rounded to 2 decimal places).
 */
export function calcYearlyPrice(monthlyGBP: number): number {
  return Math.round(monthlyGBP * 12 * 0.8 * 100) / 100;
}

export const PLANS: Record<PlanKey, PlanDefinition> = {
  starter: {
    key: "starter",
    name: "Starter",
    description: "Perfect for getting started — list your first event for free.",
    priceGBP: 0,
    pricing: { monthly: 0, yearly: 0 },
    stripePriceIds: { monthly: null, yearly: null },
    stripePriceId: null,
    stripeProductName: "UK Sabor Starter",
    commissionRate: 0.08,
    courseCommissionRate: 0.15,
    limits: {
      eventsPerMonth: 1,
      weeklyClasses: 0,   // No weekly classes on free plan
      courses: null,
      instructors: 1,
    },
    features: [
      "1 active event per month",
      "No weekly class listings",
      "Unlimited courses (15% fee)",
      "Ticket sales",
      "QR check-in",
      "Public creator profile",
      "Basic dashboard",
      "8% ticket commission",
    ],
    targetRoles: ["user", "instructor", "promoter"],
  },

  creator: {
    key: "creator",
    name: "Creator",
    description: "For active teachers and small event organisers growing their audience.",
    priceGBP: 5,
    pricing: { monthly: 5, yearly: calcYearlyPrice(5) },
    stripePriceIds: {
      monthly: process.env.STRIPE_PRICE_CREATOR_MONTHLY || process.env.STRIPE_PRICE_CREATOR || null,
      yearly: process.env.STRIPE_PRICE_CREATOR_YEARLY || null,
    },
    stripePriceId: process.env.STRIPE_PRICE_CREATOR_MONTHLY || process.env.STRIPE_PRICE_CREATOR || null,
    stripeProductName: "UK Sabor Creator",
    commissionRate: 0.04,
    courseCommissionRate: 0.10,
    limits: {
      eventsPerMonth: 1,   // 1 event per month
      weeklyClasses: 1,    // 1 weekly class
      courses: null,
      instructors: 1,
    },
    features: [
      "1 event per month",
      "1 weekly class listing",
      "Unlimited courses (10% fee)",
      "Ticket sales",
      "QR check-in",
      "Creator profile page",
      "Basic analytics",
      "4% ticket commission",
    ],
    targetRoles: ["instructor", "promoter"],
  },

  promoter_plan: {
    key: "promoter_plan",
    name: "Promoter",
    description: "For professional promoters running multiple events and classes.",
    priceGBP: 10,
    pricing: { monthly: 10, yearly: calcYearlyPrice(10) },
    stripePriceIds: {
      monthly: process.env.STRIPE_PRICE_PROMOTER_MONTHLY || process.env.STRIPE_PRICE_PROMOTER || null,
      yearly: process.env.STRIPE_PRICE_PROMOTER_YEARLY || null,
    },
    stripePriceId: process.env.STRIPE_PRICE_PROMOTER_MONTHLY || process.env.STRIPE_PRICE_PROMOTER || null,
    stripeProductName: "UK Sabor Promoter",
    commissionRate: 0.025,
    courseCommissionRate: 0.05,
    limits: {
      eventsPerMonth: null,   // unlimited
      weeklyClasses: 10,
      courses: null,
      instructors: 1,
    },
    features: [
      "Unlimited events per month",
      "Up to 10 weekly classes",
      "Unlimited courses (5% fee)",
      "Ticket sales",
      "QR check-in",
      "CSV attendee export",
      "Event analytics",
      "2.5% ticket commission",
    ],
    targetRoles: ["promoter", "instructor"],
  },

  academy: {
    key: "academy",
    name: "Academy",
    description: "For dance schools and academies with multiple instructors and full course management.",
    priceGBP: 25,
    pricing: { monthly: 25, yearly: calcYearlyPrice(25) },
    stripePriceIds: {
      monthly: process.env.STRIPE_PRICE_ACADEMY_MONTHLY || process.env.STRIPE_PRICE_ACADEMY || null,
      yearly: process.env.STRIPE_PRICE_ACADEMY_YEARLY || null,
    },
    stripePriceId: process.env.STRIPE_PRICE_ACADEMY_MONTHLY || process.env.STRIPE_PRICE_ACADEMY || null,
    stripeProductName: "UK Sabor Academy",
    commissionRate: 0.02,
    courseCommissionRate: 0.00,
    limits: {
      eventsPerMonth: null,   // unlimited
      weeklyClasses: null,    // unlimited
      courses: null,          // unlimited
      instructors: null,      // unlimited
    },
    features: [
      "Unlimited events per month",
      "Unlimited weekly classes",
      "Unlimited courses (0% fee)",
      "Multiple instructors",
      "Student management",
      "Advanced analytics",
      "2% ticket commission",
    ],
    targetRoles: ["instructor", "admin"],
  },
};

export const PLAN_ORDER: PlanKey[] = ["starter", "creator", "promoter_plan", "academy"];

/**
 * Get plan definition by key (safe, returns starter as fallback)
 */
export function getPlan(key: string | null | undefined): PlanDefinition {
  return PLANS[(key as PlanKey) ?? "starter"] ?? PLANS.starter;
}

/**
 * Get the Stripe price ID for a plan + billing interval.
 * Falls back to monthly if yearly is not configured.
 */
export function getStripePriceId(planKey: PlanKey, interval: BillingInterval): string | null {
  const plan = PLANS[planKey];
  if (!plan) return null;
  if (interval === "yearly") {
    return plan.stripePriceIds.yearly ?? plan.stripePriceIds.monthly;
  }
  return plan.stripePriceIds.monthly;
}

export interface EntitlementResult {
  allowed: boolean;
  reason?: string;
  limit?: number;
  current?: number;
}

/**
 * Check whether a user's plan allows creating more events this month.
 * eventsThisMonth = current count from usageTracking.
 */
export function canCreateEvent(plan: string, eventsThisMonth: number): EntitlementResult {
  const planDef = PLANS[plan as PlanKey] ?? PLANS.starter;
  const limit = planDef.limits.eventsPerMonth;
  if (limit === null || limit === -1) return { allowed: true };
  if (eventsThisMonth < limit) return { allowed: true, limit, current: eventsThisMonth };
  return {
    allowed: false,
    reason: `Your ${planDef.name} plan allows ${limit} event${limit === 1 ? "" : "s"} per month. Upgrade to create more.`,
    limit,
    current: eventsThisMonth,
  };
}

/**
 * Check whether a user's plan allows creating more weekly classes.
 * totalClasses = total active classes for this user.
 */
export function canCreateClass(plan: string, totalClasses: number): EntitlementResult {
  const planDef = PLANS[plan as PlanKey] ?? PLANS.starter;
  const limit = planDef.limits.weeklyClasses;
  if (limit === null || limit === -1) return { allowed: true };
  if (limit === 0) {
    return {
      allowed: false,
      reason: `Your ${planDef.name} plan does not include weekly class listings. Upgrade to add classes.`,
      limit: 0,
      current: totalClasses,
    };
  }
  if (totalClasses < limit) return { allowed: true, limit, current: totalClasses };
  return {
    allowed: false,
    reason: `Your ${planDef.name} plan allows ${limit} class${limit === 1 ? "" : "es"}. Upgrade to create more.`,
    limit,
    current: totalClasses,
  };
}

/**
 * Check whether a user's plan allows creating courses.
 */
export function canCreateCourse(plan: string, totalCourses: number): EntitlementResult {
  return { allowed: true };
}

/**
 * Calculate the total checkout amount with CORRECT STRIPE FEE MODEL:
 * - Client pays: Ticket price + Stripe fee (calculated via "gross-up")
 * - Platform fee is deducted from instructor's earnings
 * - Stripe fee is NOT deducted from instructor (client already pays it)
 *
 * IMPORTANT: Stripe charges 1.5% + £0.20 on the TOTAL amount charged to the client,
 * not just the ticket price. We use "gross-up" formula to calculate the exact amount
 * needed so that after Stripe takes their fee, we receive the full ticket price.
 *
 * MATHEMATICAL EXPLANATION:
 * ========================
 *
 * WRONG APPROACH (old code):
 * --------------------------
 * Ticket: £10.00
 * Stripe fee (simple): £10.00 × 1.5% + £0.20 = £0.35
 * Total charged: £10.00 + £0.35 = £10.35
 *
 * But Stripe charges 1.5% + £0.20 on £10.35, not £10.00:
 * Real Stripe fee: £10.35 × 1.5% + £0.20 = £0.3552 ≈ £0.36
 * You receive: £10.35 - £0.36 = £9.99 ❌ (missing £0.01)
 *
 * CORRECT APPROACH (gross-up formula):
 * -------------------------------------
 * We want to receive: £10.00 (ticket price)
 * Stripe charges: 1.5% + £0.20 on the total amount
 *
 * Let X = total amount to charge client
 * Stripe fee = X × 1.5% + £0.20 = 0.015X + 0.20
 * After fee = X - (0.015X + 0.20) = £10.00
 *
 * Solving for X:
 * X - 0.015X - 0.20 = 10.00
 * 0.985X = 10.20
 * X = 10.20 / 0.985 = £10.355... ≈ £10.36
 *
 * Check: £10.36 × 1.5% + £0.20 = £0.3554 ≈ £0.36
 * You receive: £10.36 - £0.36 = £10.00 ✅ EXACT!
 *
 * FORMULA:
 * --------
 * totalPence = (ticketPricePence + 20) / 0.985
 * stripeFeePence = totalPence - ticketPricePence
 *
 * Stripe UK processing fee: 1.5% + £0.20 for European cards
 * Returns all amounts in pence (integer).
 */
export function calculateCheckoutAmounts(ticketPricePence: number, plan: PlanKey, isCourse: boolean = false) {
  const planDef = PLANS[plan] ?? PLANS.starter;
  const commissionRate = isCourse ? planDef.courseCommissionRate : planDef.commissionRate;

  // CORRECT STRIPE FEE CALCULATION using "gross-up" formula
  // We want to receive exactly ticketPricePence after Stripe takes their 1.5% + £0.20
  // Formula: totalPence = (ticketPricePence + fixedFeePence) / (1 - percentageFee)
  const STRIPE_PERCENTAGE = 0.015;  // 1.5%
  const STRIPE_FIXED_PENCE = 20;    // £0.20

  // Gross-up calculation to ensure we receive EXACTLY ticketPricePence after Stripe fee
  const totalPence = Math.round((ticketPricePence + STRIPE_FIXED_PENCE) / (1 - STRIPE_PERCENTAGE));

  // Stripe fee is the difference between what client pays and what we want to receive
  const stripeFeePence = totalPence - ticketPricePence;

  // Platform fee is deducted from instructor's earnings
  const platformFeePence = Math.round(ticketPricePence * commissionRate);

  // What the instructor actually receives (only platform fee deducted, NOT Stripe fee)
  const instructorEarningsPence = ticketPricePence - platformFeePence;

  return {
    ticketPricePence,        // Original ticket price
    platformFeePence,        // Platform commission (deducted from instructor)
    stripeFeePence,          // Stripe fee (paid by client, calculated via gross-up)
    totalPence,              // What client pays (calculated to cover ticket + exact Stripe fee)
    instructorEarningsPence, // What instructor receives (price - platform fee)
    commissionRate,
  };
}
