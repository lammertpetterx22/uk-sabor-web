/**
 * Stripe Products Sync
 * Creates or updates Stripe products and prices for all subscription plans.
 * Returns the price IDs so the admin can set them as env vars.
 *
 * Also exports `getOrCreatePriceId` — used by the checkout flow to auto-create
 * prices on demand when env vars are not yet configured.
 */
import Stripe from "stripe";
import { router, adminProcedure } from "../_core/trpc";
import { PLANS, type PlanKey, type BillingInterval } from "../stripe/plans";

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" as any });
}

interface SyncResult {
  plan: string;
  productId: string;
  monthlyPriceId: string;
  yearlyPriceId: string;
  monthlyAmount: number;
  yearlyAmount: number;
}

async function syncPlan(
  stripe: Stripe,
  planKey: "creator" | "promoter_plan" | "academy"
): Promise<SyncResult> {
  const plan = PLANS[planKey];
  const monthlyPence = Math.round(plan.priceGBP * 100);
  const yearlyPence = Math.round(plan.priceGBP * 12 * 0.8 * 100); // 20% discount

  // Find or create product
  const existingProducts = await stripe.products.search({
    query: `metadata["uk_sabor_plan"]:"${planKey}"`,
  });

  let product: Stripe.Product;
  if (existingProducts.data.length > 0) {
    product = await stripe.products.update(existingProducts.data[0].id, {
      name: plan.stripeProductName,
      description: plan.description,
    });
  } else {
    product = await stripe.products.create({
      name: plan.stripeProductName,
      description: plan.description,
      metadata: { uk_sabor_plan: planKey },
    });
  }

  // Find or create monthly price
  const existingMonthly = await stripe.prices.search({
    query: `product:"${product.id}" metadata["interval"]:"monthly" active:"true"`,
  });

  let monthlyPrice: Stripe.Price;
  if (existingMonthly.data.length > 0) {
    monthlyPrice = existingMonthly.data[0];
  } else {
    monthlyPrice = await stripe.prices.create({
      product: product.id,
      currency: "gbp",
      unit_amount: monthlyPence,
      recurring: { interval: "month" },
      nickname: `${plan.stripeProductName} Monthly`,
      metadata: { uk_sabor_plan: planKey, interval: "monthly" },
    });
  }

  // Find or create yearly price
  const existingYearly = await stripe.prices.search({
    query: `product:"${product.id}" metadata["interval"]:"yearly" active:"true"`,
  });

  let yearlyPrice: Stripe.Price;
  if (existingYearly.data.length > 0) {
    yearlyPrice = existingYearly.data[0];
  } else {
    yearlyPrice = await stripe.prices.create({
      product: product.id,
      currency: "gbp",
      unit_amount: yearlyPence,
      recurring: { interval: "year" },
      nickname: `${plan.stripeProductName} Yearly (20% off)`,
      metadata: { uk_sabor_plan: planKey, interval: "yearly" },
    });
  }

  return {
    plan: planKey,
    productId: product.id,
    monthlyPriceId: monthlyPrice.id,
    yearlyPriceId: yearlyPrice.id,
    monthlyAmount: monthlyPence,
    yearlyAmount: yearlyPence,
  };
}

/**
 * Get or auto-create a Stripe price ID for a given plan + billing interval.
 * First checks env vars; if missing, syncs the plan in Stripe and returns the price ID.
 * This eliminates the "No Stripe price configured" error for first-time setups.
 */
export async function getOrCreatePriceId(
  planKey: "creator" | "promoter_plan" | "academy",
  interval: BillingInterval
): Promise<string> {
  // 1. Check env vars first (fastest path)
  const prefix = planKey.toUpperCase().replace("_PLAN", "");
  const envMonthly =
    process.env[`STRIPE_PRICE_${prefix}_MONTHLY`] ||
    process.env[`STRIPE_PRICE_${prefix}`];
  const envYearly = process.env[`STRIPE_PRICE_${prefix}_YEARLY`];

  if (interval === "yearly" && envYearly) return envYearly;
  if (interval === "yearly" && envMonthly) return envMonthly; // fallback to monthly if yearly not set
  if (interval === "monthly" && envMonthly) return envMonthly;

  // 2. No env var — auto-create via Stripe API
  console.log(`[StripeSync] No price ID found for ${planKey} (${interval}), auto-creating...`);
  const stripe = getStripeClient();
  const result = await syncPlan(stripe, planKey);

  // Inject into process.env so subsequent calls in the same process are fast
  process.env[`STRIPE_PRICE_${prefix}_MONTHLY`] = result.monthlyPriceId;
  process.env[`STRIPE_PRICE_${prefix}_YEARLY`] = result.yearlyPriceId;

  console.log(`[StripeSync] Auto-created prices for ${planKey}: monthly=${result.monthlyPriceId}, yearly=${result.yearlyPriceId}`);

  return interval === "yearly" ? result.yearlyPriceId : result.monthlyPriceId;
}

export const stripeSyncRouter = router({
  syncProducts: adminProcedure.mutation(async () => {
    const stripe = getStripeClient();
    const results: SyncResult[] = [];

    for (const planKey of ["creator", "promoter_plan", "academy"] as const) {
      const result = await syncPlan(stripe, planKey);
      results.push(result);

      // Inject into process.env so subsequent calls in the same process are fast
      const prefix = planKey.toUpperCase().replace("_PLAN", "");
      process.env[`STRIPE_PRICE_${prefix}_MONTHLY`] = result.monthlyPriceId;
      process.env[`STRIPE_PRICE_${prefix}_YEARLY`] = result.yearlyPriceId;
    }

    // Build env var instructions
    const envVars: Record<string, string> = {};
    for (const r of results) {
      const prefix = r.plan.toUpperCase().replace("_PLAN", "");
      envVars[`STRIPE_PRICE_${prefix}_MONTHLY`] = r.monthlyPriceId;
      envVars[`STRIPE_PRICE_${prefix}_YEARLY`] = r.yearlyPriceId;
    }

    return {
      success: true,
      results,
      envVars,
      instructions: [
        "Copy the env vars below and add them in Settings → Secrets:",
        ...Object.entries(envVars).map(([k, v]) => `${k}=${v}`),
      ].join("\n"),
    };
  }),

  getProductStatus: adminProcedure.query(async () => {
    const stripe = getStripeClient();
    const status: Array<{
      plan: string;
      name: string;
      monthlyConfigured: boolean;
      yearlyConfigured: boolean;
      monthlyPriceId: string | null;
      yearlyPriceId: string | null;
    }> = [];

    for (const planKey of ["creator", "promoter_plan", "academy"] as const) {
      const plan = PLANS[planKey];
      const prefix = planKey.toUpperCase().replace("_PLAN", "");
      status.push({
        plan: planKey,
        name: plan.stripeProductName,
        monthlyConfigured: !!(
          process.env[`STRIPE_PRICE_${prefix}_MONTHLY`] ||
          process.env[`STRIPE_PRICE_${prefix}`]
        ),
        yearlyConfigured: !!process.env[`STRIPE_PRICE_${prefix}_YEARLY`],
        monthlyPriceId:
          process.env[`STRIPE_PRICE_${prefix}_MONTHLY`] ||
          process.env[`STRIPE_PRICE_${prefix}`] ||
          null,
        yearlyPriceId:
          process.env[`STRIPE_PRICE_${prefix}_YEARLY`] || null,
      });
    }

    return status;
  }),
});
