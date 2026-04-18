import { z } from "zod";
import Stripe from "stripe";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia" as any,
});

function getBaseUrl(reqOrigin?: string | null): string {
  return (process.env.PUBLIC_BASE_URL || reqOrigin || "https://www.consabor.uk").replace(/\/$/, "");
}

/**
 * Translate Stripe Account object state to our 4-state enum.
 */
function computeStatus(account: Stripe.Account): {
  status: "none" | "pending" | "verified" | "restricted";
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
} {
  const chargesEnabled = !!account.charges_enabled;
  const payoutsEnabled = !!account.payouts_enabled;
  const hasRequirements = (account.requirements?.currently_due?.length ?? 0) > 0
    || (account.requirements?.past_due?.length ?? 0) > 0;

  let status: "none" | "pending" | "verified" | "restricted";
  if (chargesEnabled && payoutsEnabled && !hasRequirements) {
    status = "verified";
  } else if (account.details_submitted && hasRequirements) {
    status = "restricted";
  } else {
    status = "pending";
  }
  return { status, chargesEnabled, payoutsEnabled };
}

async function syncAccountToUser(userId: number, stripeAccountId: string): Promise<{
  status: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const account = await stripe.accounts.retrieve(stripeAccountId);
  const { status, chargesEnabled, payoutsEnabled } = computeStatus(account);

  await db.update(users).set({
    stripeAccountStatus: status,
    stripeChargesEnabled: chargesEnabled,
    stripePayoutsEnabled: payoutsEnabled,
    stripeOnboardedAt: status === "verified" ? (new Date()) : undefined,
  }).where(eq(users.id, userId));

  return { status, chargesEnabled, payoutsEnabled };
}

export const stripeConnectRouter = router({
  /**
   * Create (if needed) a Stripe Express account for the user, and generate
   * an onboarding AccountLink. Frontend redirects the user to the URL.
   */
  createOnboardingLink: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [me] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      if (!me) throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });

      let accountId = me.stripeAccountId;

      if (!accountId) {
        const account = await stripe.accounts.create({
          type: "express",
          country: "GB",
          email: me.email || undefined,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_type: "individual",
          metadata: {
            userId: String(me.id),
            platform: "uk-sabor",
          },
        });
        accountId = account.id;
        await db.update(users).set({
          stripeAccountId: accountId,
          stripeAccountStatus: "pending",
        }).where(eq(users.id, me.id));
      }

      const baseUrl = getBaseUrl(ctx.req.headers.origin as string | undefined);
      const link = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${baseUrl}/profile?stripe=refresh`,
        return_url: `${baseUrl}/profile?stripe=success`,
        type: "account_onboarding",
      });

      return { url: link.url, accountId };
    }),

  /**
   * Return the cached Stripe Connect status for the current user.
   */
  getMyStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const [me] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!me) throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });

    return {
      accountId: me.stripeAccountId,
      status: me.stripeAccountStatus || "none",
      chargesEnabled: !!me.stripeChargesEnabled,
      payoutsEnabled: !!me.stripePayoutsEnabled,
      onboardedAt: me.stripeOnboardedAt,
    };
  }),

  /**
   * Force a fresh sync with Stripe (call after user returns from onboarding).
   */
  refreshStatus: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const [me] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!me || !me.stripeAccountId) {
      return { status: "none" as const, chargesEnabled: false, payoutsEnabled: false };
    }

    return syncAccountToUser(me.id, me.stripeAccountId);
  }),

  /**
   * Create a login link to the user's Stripe Express dashboard.
   */
  createDashboardLink: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const [me] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!me || !me.stripeAccountId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No Stripe account connected yet" });
    }

    const link = await stripe.accounts.createLoginLink(me.stripeAccountId);
    return { url: link.url };
  }),
});

// Exported so the webhook handler can sync on account.updated events
export { syncAccountToUser };
