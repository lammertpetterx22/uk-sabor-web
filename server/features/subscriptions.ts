import { z } from "zod";
import { protectedProcedure, adminProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { subscriptions, usageTracking, users, classes, courses, events, instructors } from "../../drizzle/schema";
import { eq, and, count } from "drizzle-orm";
import Stripe from "stripe";
import { PLANS, getPlan, canCreateEvent, canCreateClass, canCreateCourse, PLAN_ORDER, getStripePriceId, type PlanKey, type BillingInterval } from "../stripe/plans";
import { getOrCreatePriceId } from "./stripeSync";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia" as any,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getOrCreateStripeCustomer(userId: number, email: string | null | undefined, name: string | null | undefined): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [user] = await db.select({ stripeCustomerId: users.stripeCustomerId }).from(users).where(eq(users.id, userId)).limit(1);
  if (user?.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: email || undefined,
    name: name || undefined,
    metadata: { userId: userId.toString() },
  });

  await db.update(users).set({ stripeCustomerId: customer.id }).where(eq(users.id, userId));
  return customer.id;
}

async function getCurrentUsage(userId: number) {
  const db = await getDb();
  if (!db) return { eventsCreated: 0, classesCreated: 0, coursesCreated: 0 };

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [usage] = await db
    .select()
    .from(usageTracking)
    .where(and(
      eq(usageTracking.userId, userId),
      eq(usageTracking.periodYear, year),
      eq(usageTracking.periodMonth, month),
    ))
    .limit(1);

  return usage ?? { eventsCreated: 0, classesCreated: 0, coursesCreated: 0 };
}

async function incrementUsage(userId: number, field: "eventsCreated" | "classesCreated" | "coursesCreated") {
  const db = await getDb();
  if (!db) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [existing] = await db
    .select()
    .from(usageTracking)
    .where(and(
      eq(usageTracking.userId, userId),
      eq(usageTracking.periodYear, year),
      eq(usageTracking.periodMonth, month),
    ))
    .limit(1);

  if (existing) {
    await db.update(usageTracking)
      .set({ [field]: (existing[field] ?? 0) + 1 })
      .where(eq(usageTracking.id, existing.id));
  } else {
    await db.insert(usageTracking).values({
      userId,
      periodYear: year,
      periodMonth: month,
      eventsCreated: field === "eventsCreated" ? 1 : 0,
      classesCreated: field === "classesCreated" ? 1 : 0,
      coursesCreated: field === "coursesCreated" ? 1 : 0,
    });
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const subscriptionsRouter = router({

  /** Get all plan definitions (public — used on pricing page) */
  listPlans: publicProcedure.query(() => {
    return PLAN_ORDER.map((key) => ({
      ...PLANS[key],
      // Don't expose internal Stripe price IDs to frontend
      stripePriceId: undefined,
    }));
  }),

  /** Get the current user's subscription, plan, and usage */
  getMySubscription: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [user] = await db
      .select({ subscriptionPlan: users.subscriptionPlan, role: users.role, stripeCustomerId: users.stripeCustomerId })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    const plan = getPlan(user?.subscriptionPlan);

    // Get active subscription record
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, ctx.user.id), eq(subscriptions.status, "active")))
      .limit(1);

    const usage = await getCurrentUsage(ctx.user.id);

    // Count total active classes and courses for this user (instructor-owned)
    // Must join via instructors table to get the instructorId (not userId)
    const [instructorProfile] = await db
      .select({ id: instructors.id })
      .from(instructors)
      .where(eq(instructors.userId, ctx.user.id))
      .limit(1);
    const instructorId = instructorProfile?.id;

    const totalClassesResult = instructorId
      ? await db.select({ count: count() }).from(classes).where(eq(classes.instructorId, instructorId))
      : [{ count: 0 }];
    const totalCoursesResult = instructorId
      ? await db.select({ count: count() }).from(courses).where(eq(courses.instructorId, instructorId))
      : [{ count: 0 }];

    const totalClasses = totalClassesResult[0]?.count ?? 0;
    const totalCourses = totalCoursesResult[0]?.count ?? 0;

    return {
      plan: {
        key: plan.key,
        name: plan.name,
        description: plan.description,
        priceGBP: plan.priceGBP,
        commissionRate: plan.commissionRate,
        limits: plan.limits,
        features: plan.features,
      },
      subscription: sub ? {
        status: sub.status,
        currentPeriodEnd: sub.currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        stripeSubscriptionId: sub.stripeSubscriptionId,
      } : null,
      usage: {
        eventsThisMonth: usage.eventsCreated,
        totalClasses,
        totalCourses,
      },
      canCreate: {
        event: canCreateEvent(plan.key, usage.eventsCreated),
        class: canCreateClass(plan.key, totalClasses),
        course: canCreateCourse(plan.key, totalCourses),
      },
    };
  }),

  /** Create a Stripe Checkout session to subscribe to a paid plan */
  createSubscriptionCheckout: protectedProcedure
    .input(z.object({
      planKey: z.enum(["creator", "promoter_plan", "academy"]),
      billingInterval: z.enum(["monthly", "yearly"]).default("monthly"),
      origin: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const plan = PLANS[input.planKey];
      const interval = input.billingInterval as BillingInterval;
      // Auto-create Stripe prices if env vars are not configured yet
      const priceId = await getOrCreatePriceId(input.planKey, interval);

      const customerId = await getOrCreateStripeCustomer(ctx.user.id, ctx.user.email, ctx.user.name);

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        success_url: `${input.origin}/billing?success=1&plan=${input.planKey}&interval=${interval}`,
        cancel_url: `${input.origin}/pricing`,
        allow_promotion_codes: true,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          plan_key: input.planKey,
          billing_interval: interval,
        },
        subscription_data: {
          metadata: {
            user_id: ctx.user.id.toString(),
            plan_key: input.planKey,
            billing_interval: interval,
          },
        },
      });

      return { url: session.url };
    }),

  /** Create a Stripe Billing Portal session to manage/cancel subscription */
  createBillingPortal: protectedProcedure
    .input(z.object({ origin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [user] = await db
        .select({ stripeCustomerId: users.stripeCustomerId })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!user?.stripeCustomerId) {
        throw new Error("No billing account found. Please subscribe to a plan first.");
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${input.origin}/billing`,
      });

      return { url: session.url };
    }),

  /** Admin: list all subscriptions */
  adminListSubscriptions: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const subs = await db
      .select({
        id: subscriptions.id,
        userId: subscriptions.userId,
        plan: subscriptions.plan,
        status: subscriptions.status,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
        createdAt: subscriptions.createdAt,
        userName: users.name,
        userEmail: users.email,
        userRole: users.role,
      })
      .from(subscriptions)
      .leftJoin(users, eq(subscriptions.userId, users.id));

    return subs;
  }),

  /** Admin: manually set a user's plan (for testing / manual overrides) */
  adminSetPlan: adminProcedure
    .input(z.object({
      userId: z.number(),
      plan: z.enum(["starter", "creator", "promoter_plan", "academy"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(users)
        .set({ subscriptionPlan: input.plan })
        .where(eq(users.id, input.userId));

      // Upsert subscription record
      const [existing] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, input.userId))
        .limit(1);

      if (existing) {
        await db.update(subscriptions)
          .set({ plan: input.plan, status: "active" })
          .where(eq(subscriptions.id, existing.id));
      } else {
        await db.insert(subscriptions).values({
          userId: input.userId,
          plan: input.plan,
          status: "active",
        });
      }

      return { success: true };
    }),

  /** Check entitlement — called before creating events/classes/courses */
  checkEntitlement: protectedProcedure
    .input(z.object({
      resourceType: z.enum(["event", "class", "course"]),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [user] = await db
        .select({ subscriptionPlan: users.subscriptionPlan })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      const plan = getPlan(user?.subscriptionPlan);
      const usage = await getCurrentUsage(ctx.user.id);

      // Count classes/courses via the instructors table join (instructorId ≠ userId)
      const [instructorProfile] = await db
        .select({ id: instructors.id })
        .from(instructors)
        .where(eq(instructors.userId, ctx.user.id))
        .limit(1);
      const instructorId = instructorProfile?.id;

      const totalClassesResult = instructorId
        ? await db.select({ count: count() }).from(classes).where(eq(classes.instructorId, instructorId))
        : [{ count: 0 }];
      const totalCoursesResult = instructorId
        ? await db.select({ count: count() }).from(courses).where(eq(courses.instructorId, instructorId))
        : [{ count: 0 }];

      const totalClasses = totalClassesResult[0]?.count ?? 0;
      const totalCourses = totalCoursesResult[0]?.count ?? 0;

      let allowed = false;
      let reason = "";

      if (input.resourceType === "event") {
        const result = canCreateEvent(plan.key, usage.eventsCreated);
        allowed = result.allowed;
        if (!allowed) reason = result.reason ?? "Event limit reached. Upgrade your plan.";
      } else if (input.resourceType === "class") {
        const result = canCreateClass(plan.key, totalClasses);
        allowed = result.allowed;
        if (!allowed) reason = result.reason ?? "Class limit reached. Upgrade your plan.";
      } else if (input.resourceType === "course") {
        const result = canCreateCourse(plan.key, totalCourses);
        allowed = result.allowed;
        if (!allowed) reason = result.reason ?? "Course limit reached. Upgrade your plan.";
      }

      return {
        allowed,
        reason,
        plan: plan.key,
        planName: plan.name,
        usage: {
          eventsThisMonth: usage.eventsCreated,
          totalClasses,
          totalCourses,
        },
        limits: plan.limits,
      };
    }),

  /** Increment usage counter after creating a resource */
  recordUsage: protectedProcedure
    .input(z.object({
      resourceType: z.enum(["event", "class", "course"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const fieldMap = {
        event: "eventsCreated" as const,
        class: "classesCreated" as const,
        course: "coursesCreated" as const,
      };
      await incrementUsage(ctx.user.id, fieldMap[input.resourceType]);
      return { success: true };
    }),
});

// Export helpers for use in webhook handler
export { getOrCreateStripeCustomer, incrementUsage };

/**
 * Process Stripe subscription lifecycle events from webhook.
 * Updates the local subscriptions table and user's subscriptionPlan field.
 */
export async function processSubscriptionWebhook(
  eventType: string,
  stripeSub: Stripe.Subscription
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const stripeCustomerId = typeof stripeSub.customer === "string" ? stripeSub.customer : stripeSub.customer?.id;
  if (!stripeCustomerId) return;

  // Find the user by Stripe customer ID
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.stripeCustomerId, stripeCustomerId)).limit(1);
  if (!user) {
    console.warn(`[SubscriptionWebhook] No user found for customer ${stripeCustomerId}`);
    return;
  }

  // Determine plan from price metadata or price ID
  const priceId = stripeSub.items.data[0]?.price?.id ?? "";
  const planMeta = (stripeSub.metadata?.planKey || stripeSub.metadata?.plan_key) as PlanKey | undefined;
  
  console.log(`[SubscriptionWebhook] Processing ${eventType} for sub ${stripeSub.id}. Price: ${priceId}, PlanMeta: ${planMeta}`);

  let planKey: PlanKey = planMeta ?? "starter";

  // Try to match by price ID against known plans if metadata is missing
  if (!planMeta) {
    for (const [key, plan] of Object.entries(PLANS)) {
      // Check env vars directly since PLANS object might have stale nulls
      const prefix = key.toUpperCase().replace("_PLAN", "");
      const envMonthly = process.env[`STRIPE_PRICE_${prefix}_MONTHLY`] || process.env[`STRIPE_PRICE_${prefix}`];
      const envYearly = process.env[`STRIPE_PRICE_${prefix}_YEARLY`];

      const matchesMonthly = (plan.stripePriceIds.monthly && plan.stripePriceIds.monthly === priceId) || (envMonthly === priceId);
      const matchesYearly = (plan.stripePriceIds.yearly && plan.stripePriceIds.yearly === priceId) || (envYearly === priceId);
      
      if (matchesMonthly || matchesYearly) {
        planKey = key as PlanKey;
        console.log(`[SubscriptionWebhook] Identified plan ${planKey} from price ID ${priceId}`);
        break;
      }
    }
  }

  // Stripe uses 'canceled' (US spelling), our DB uses 'cancelled' (UK spelling)
  const rawStatus = stripeSub.status;
  const status = (rawStatus === "canceled" ? "cancelled" : rawStatus) as "active" | "cancelled" | "past_due" | "trialing" | "incomplete";
  
  // Defensive property access for dates (Stripe SDK v14+ might use camelCase)
  const startTime = (stripeSub as any).current_period_start || (stripeSub as any).currentPeriodStart;
  const endTime = (stripeSub as any).current_period_end || (stripeSub as any).currentPeriodEnd;
  
  const currentPeriodStart = startTime ? new Date(startTime * 1000) : new Date();
  const currentPeriodEnd = endTime ? new Date(endTime * 1000) : new Date();
  const cancelAtPeriodEnd = stripeSub.cancel_at_period_end ?? false;

  console.log(`[SubscriptionWebhook] Status: ${status}, Plan: ${planKey}, Period: ${currentPeriodStart.toISOString()} - ${currentPeriodEnd.toISOString()}`);


  if (eventType === "customer.subscription.deleted") {
    // Downgrade to free starter plan
    await db.update(subscriptions)
      .set({ status: "cancelled", cancelAtPeriodEnd: false })
      .where(eq(subscriptions.stripeSubscriptionId, stripeSub.id));
    await db.update(users)
      .set({ subscriptionPlan: "starter" })
      .where(eq(users.id, user.id));
    console.log(`[SubscriptionWebhook] User ${user.id} downgraded to starter (subscription deleted)`);
    return;
  }

  // Upsert subscription record
  const [existing] = await db.select({ id: subscriptions.id })
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSub.id))
    .limit(1);

  if (existing) {
    await db.update(subscriptions).set({
      status,
      plan: planKey,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd,
    }).where(eq(subscriptions.id, existing.id));
  } else {
    await db.insert(subscriptions).values({
      userId: user.id,
      stripeSubscriptionId: stripeSub.id,
      stripeCustomerId: stripeCustomerId,
      plan: planKey,
      status,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd,
    });
  }

  // Update user's plan and role if subscription is active/trialing
  if (status === "active" || status === "trialing") {
    // Determine role based on plan:
    // - creator: instructor (teachers creating classes/courses)
    // - promoter_plan: promoter (event organizers and promoters)
    // - academy: instructor (dance schools — still instructors, just higher tier)
    let newRole = "user";
    if (planKey === "creator" || planKey === "academy") {
      newRole = "instructor";
    } else if (planKey === "promoter_plan") {
      newRole = "promoter";
    }

    const updateRes = await db.update(users)
      .set({
        subscriptionPlan: planKey,
        role: newRole as any,
      })
      .where(eq(users.id, user.id));
    
    console.log(`[SubscriptionWebhook] User ${user.id} plan updated to ${planKey}, role upgraded to ${newRole}. Update result:`, updateRes);
  } else if (status === "past_due" || status === "incomplete") {
    // Downgrade to starter on payment failure
    await db.update(users)
      .set({
        subscriptionPlan: "starter",
        role: "user" as any,
      })
      .where(eq(users.id, user.id));
    console.log(`[SubscriptionWebhook] User ${user.id} downgraded to starter (payment failed: ${status})`);
  }
}
