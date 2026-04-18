import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, adminProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  users,
  events,
  rrpApplications,
  rrpProfiles,
  eventRrps,
  rrpSales,
  getAllRoles,
  parseRoles,
  serializeRoles,
  RRP_TIERS,
  RRP_MAX_COMMISSION_PCT,
  tierForSales,
} from "../../drizzle/schema";
import { and, eq, desc, sql, count } from "drizzle-orm";
import crypto from "crypto";
import { sendEmail } from "./email";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function canManageEvent(user: { id: number; role: string; roles?: string | null }, event: { creatorId?: number | null }): boolean {
  const roles = getAllRoles(user as any);
  if (roles.includes("admin")) return true;
  return !!event.creatorId && event.creatorId === user.id;
}

function generateRrpCode(name: string): string {
  const base = (name || "RRP")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8) || "RRP";
  const rand = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${base}${rand}`;
}

async function ensureUniqueRrpCode(db: any, name: string): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const candidate = generateRrpCode(name);
    const existing = await db.select().from(rrpProfiles).where(eq(rrpProfiles.code, candidate)).limit(1);
    if (existing.length === 0) return candidate;
  }
  // Fallback: pure random
  return `RRP${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

async function addRoleToUser(db: any, userId: number, roleToAdd: string): Promise<void> {
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!u) return;
  const existing = parseRoles(u.roles);
  if (existing.includes(roleToAdd) || u.role === roleToAdd) return;
  existing.push(roleToAdd);
  await db.update(users)
    .set({ roles: serializeRoles(existing) })
    .where(eq(users.id, userId));
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const rrpRouter = router({
  // ===== APPLICATIONS =====

  /** User submits an application to become an RRP. */
  apply: protectedProcedure
    .input(z.object({
      motivation: z.string().trim().min(10, "Cuéntanos un poco más (mínimo 10 caracteres)").max(2000),
      socialHandle: z.string().trim().max(255).optional(),
      phone: z.string().trim().max(32).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // If already an approved RRP, reject
      const [existingProfile] = await db.select().from(rrpProfiles).where(eq(rrpProfiles.userId, ctx.user.id)).limit(1);
      if (existingProfile) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ya eres RRP" });
      }

      // If there's already an application, update it (allows re-submission after rejection)
      const [existingApp] = await db.select().from(rrpApplications).where(eq(rrpApplications.userId, ctx.user.id)).limit(1);

      if (existingApp) {
        if (existingApp.status === "pending") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Ya tienes una solicitud pendiente" });
        }
        await db.update(rrpApplications)
          .set({
            motivation: input.motivation,
            socialHandle: input.socialHandle || null,
            phone: input.phone || null,
            status: "pending",
            reviewedAt: null,
            reviewedBy: null,
            adminNotes: null,
          })
          .where(eq(rrpApplications.id, existingApp.id));
        return { success: true, reapplied: true };
      }

      await db.insert(rrpApplications).values({
        userId: ctx.user.id,
        motivation: input.motivation,
        socialHandle: input.socialHandle || null,
        phone: input.phone || null,
      });

      return { success: true, reapplied: false };
    }),

  /** Current user's application + profile state. */
  getMyApplication: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const [app] = await db.select().from(rrpApplications).where(eq(rrpApplications.userId, ctx.user.id)).limit(1);
    const [profile] = await db.select().from(rrpProfiles).where(eq(rrpProfiles.userId, ctx.user.id)).limit(1);
    return { application: app || null, profile: profile || null };
  }),

  /** Admin: list all applications (optionally filter by status). */
  listApplications: adminProcedure
    .input(z.object({ status: z.enum(["pending", "approved", "rejected"]).optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const rows = await db
        .select({
          id: rrpApplications.id,
          userId: rrpApplications.userId,
          userName: users.name,
          userEmail: users.email,
          motivation: rrpApplications.motivation,
          socialHandle: rrpApplications.socialHandle,
          phone: rrpApplications.phone,
          status: rrpApplications.status,
          adminNotes: rrpApplications.adminNotes,
          reviewedAt: rrpApplications.reviewedAt,
          createdAt: rrpApplications.createdAt,
        })
        .from(rrpApplications)
        .leftJoin(users, eq(users.id, rrpApplications.userId))
        .where(input?.status ? eq(rrpApplications.status, input.status) : sql`1=1`)
        .orderBy(desc(rrpApplications.createdAt));
      return rows;
    }),

  /** Admin: approve an application — generates unique RRP code + adds role. */
  approveApplication: adminProcedure
    .input(z.object({ applicationId: z.number(), adminNotes: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [app] = await db.select().from(rrpApplications).where(eq(rrpApplications.id, input.applicationId)).limit(1);
      if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Application not found" });
      if (app.status === "approved") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Already approved" });
      }

      const [target] = await db.select().from(users).where(eq(users.id, app.userId)).limit(1);
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      await db.update(rrpApplications)
        .set({
          status: "approved",
          adminNotes: input.adminNotes || null,
          reviewedAt: new Date(),
          reviewedBy: ctx.user.id,
        })
        .where(eq(rrpApplications.id, app.id));

      // Create RRP profile if not already there
      const [existingProfile] = await db.select().from(rrpProfiles).where(eq(rrpProfiles.userId, app.userId)).limit(1);
      let code: string;
      if (existingProfile) {
        code = existingProfile.code;
      } else {
        code = await ensureUniqueRrpCode(db, target.name || target.email || "RRP");
        await db.insert(rrpProfiles).values({
          userId: app.userId,
          code,
          approvedBy: ctx.user.id,
        });
      }

      // Add "rrp" role to the user's roles array (preserves their primary role)
      await addRoleToUser(db, app.userId, "rrp");

      // Send approval email
      try {
        if (target.email) {
          const baseUrl = process.env.PUBLIC_BASE_URL || "https://www.consabor.uk";
          await sendEmail({
            to: target.email,
            subject: `🎉 You're now an RRP at UK Sabor`,
            htmlContent: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #FA3698, #FD4D43); padding: 32px; border-radius: 12px 12px 0 0; text-align: center; color: #fff;">
                  <h1 style="margin: 0; font-size: 26px;">🎉 Welcome to the RRP team!</h1>
                </div>
                <div style="background: #fff; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #eee;">
                  <p>Hi <strong>${escapeHtml(target.name || "there")}</strong>,</p>
                  <p>Your RRP application has been approved. You can now sell tickets for events and earn commission.</p>
                  <div style="background: #f9f9f9; border-left: 4px solid #FA3698; padding: 18px; margin: 20px 0; border-radius: 8px;">
                    <p style="margin: 0 0 6px 0; font-size: 13px; color: #666;">Your unique RRP code:</p>
                    <p style="margin: 0; font-size: 24px; font-weight: 800; color: #FA3698; letter-spacing: 2px; font-family: monospace;">${escapeHtml(code)}</p>
                  </div>
                  <p>Visit your RRP dashboard to see your events, earnings, and tier progress:</p>
                  <p style="text-align: center; margin: 24px 0;">
                    <a href="${baseUrl.replace(/\/$/, "")}/rrp-dashboard" style="display: inline-block; background: linear-gradient(135deg, #FA3698, #FD4D43); color: #fff; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 700;">
                      Open RRP Dashboard
                    </a>
                  </p>
                </div>
              </div>`,
          });
        }
      } catch (e) {
        console.error("[RRP] Approval email failed:", e);
      }

      return { success: true, code };
    }),

  /** Admin: reject an application. */
  rejectApplication: adminProcedure
    .input(z.object({ applicationId: z.number(), adminNotes: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db.update(rrpApplications)
        .set({
          status: "rejected",
          adminNotes: input.adminNotes || null,
          reviewedAt: new Date(),
          reviewedBy: ctx.user.id,
        })
        .where(eq(rrpApplications.id, input.applicationId));

      return { success: true };
    }),

  /** Admin: directly create an RRP profile for a user (bypass application). */
  createForUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [target] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      const [existing] = await db.select().from(rrpProfiles).where(eq(rrpProfiles.userId, input.userId)).limit(1);
      if (existing) return { success: true, code: existing.code, alreadyExisted: true };

      const code = await ensureUniqueRrpCode(db, target.name || target.email || "RRP");
      await db.insert(rrpProfiles).values({
        userId: input.userId,
        code,
        approvedBy: ctx.user.id,
      });

      await addRoleToUser(db, input.userId, "rrp");

      return { success: true, code, alreadyExisted: false };
    }),

  // ===== RRP DASHBOARD =====

  /** RRP dashboard data for the current user. */
  getMyDashboard: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const [profile] = await db.select().from(rrpProfiles).where(eq(rrpProfiles.userId, ctx.user.id)).limit(1);
    if (!profile) return null;

    const sales = await db
      .select({
        id: rrpSales.id,
        eventId: rrpSales.eventId,
        eventTitle: events.title,
        ticketPrice: rrpSales.ticketPrice,
        customerDiscount: rrpSales.customerDiscount,
        rrpCommission: rrpSales.rrpCommission,
        commissionPct: rrpSales.commissionPct,
        createdAt: rrpSales.createdAt,
      })
      .from(rrpSales)
      .leftJoin(events, eq(events.id, rrpSales.eventId))
      .where(eq(rrpSales.rrpUserId, ctx.user.id))
      .orderBy(desc(rrpSales.createdAt))
      .limit(100);

    const currentTier = RRP_TIERS.find(t => t.key === profile.tier) ?? RRP_TIERS[0];
    const nextTier = RRP_TIERS.find(t => t.minSales > profile.lifetimeSales) ?? null;

    const assignments = await db
      .select({
        eventId: eventRrps.eventId,
        eventTitle: events.title,
        eventDate: events.eventDate,
        customerDiscountPct: eventRrps.customerDiscountPct,
        rrpCommissionPct: eventRrps.rrpCommissionPct,
        active: eventRrps.active,
      })
      .from(eventRrps)
      .leftJoin(events, eq(events.id, eventRrps.eventId))
      .where(eq(eventRrps.rrpUserId, ctx.user.id))
      .orderBy(desc(events.eventDate));

    return {
      profile,
      currentTier,
      nextTier,
      sales,
      assignments,
    };
  }),

  // ===== EVENT ASSIGNMENT (event creators) =====

  /** Event creator: list RRPs assigned to one of their events. */
  listEventRrps: protectedProcedure
    .input(z.object({ eventId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [event] = await db.select().from(events).where(eq(events.id, input.eventId)).limit(1);
      if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      if (!canManageEvent(ctx.user as any, event)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your event" });
      }

      const rows = await db
        .select({
          id: eventRrps.id,
          rrpUserId: eventRrps.rrpUserId,
          rrpName: users.name,
          rrpEmail: users.email,
          code: rrpProfiles.code,
          tier: rrpProfiles.tier,
          lifetimeSales: rrpProfiles.lifetimeSales,
          customerDiscountPct: eventRrps.customerDiscountPct,
          rrpCommissionPct: eventRrps.rrpCommissionPct,
          active: eventRrps.active,
          createdAt: eventRrps.createdAt,
        })
        .from(eventRrps)
        .leftJoin(users, eq(users.id, eventRrps.rrpUserId))
        .leftJoin(rrpProfiles, eq(rrpProfiles.userId, eventRrps.rrpUserId))
        .where(eq(eventRrps.eventId, input.eventId))
        .orderBy(desc(eventRrps.createdAt));

      return rows;
    }),

  /** Event creator: list all approved RRPs available to add (minus already-assigned). */
  listAvailableRrps: protectedProcedure
    .input(z.object({ eventId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [event] = await db.select().from(events).where(eq(events.id, input.eventId)).limit(1);
      if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      if (!canManageEvent(ctx.user as any, event)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your event" });
      }

      const assigned = await db
        .select({ userId: eventRrps.rrpUserId })
        .from(eventRrps)
        .where(eq(eventRrps.eventId, input.eventId));
      const assignedSet = new Set(assigned.map(a => a.userId));

      const all = await db
        .select({
          userId: rrpProfiles.userId,
          name: users.name,
          email: users.email,
          code: rrpProfiles.code,
          tier: rrpProfiles.tier,
          lifetimeSales: rrpProfiles.lifetimeSales,
        })
        .from(rrpProfiles)
        .leftJoin(users, eq(users.id, rrpProfiles.userId))
        .where(eq(rrpProfiles.active, true))
        .orderBy(desc(rrpProfiles.lifetimeSales));

      return all.filter(r => !assignedSet.has(r.userId));
    }),

  /** Event creator: assign an RRP to their event with custom rates. */
  assignToEvent: protectedProcedure
    .input(z.object({
      eventId: z.number().int().positive(),
      rrpUserId: z.number().int().positive(),
      customerDiscountPct: z.number().int().min(0).max(90),
      rrpCommissionPct: z.number().int().min(0).max(RRP_MAX_COMMISSION_PCT),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [event] = await db.select().from(events).where(eq(events.id, input.eventId)).limit(1);
      if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      if (!canManageEvent(ctx.user as any, event)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your event" });
      }

      const [profile] = await db.select().from(rrpProfiles).where(eq(rrpProfiles.userId, input.rrpUserId)).limit(1);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "RRP not found" });

      const currentTier = RRP_TIERS.find(t => t.key === profile.tier) ?? RRP_TIERS[0];
      if (input.rrpCommissionPct < currentTier.minCommissionPct) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Este RRP es ${currentTier.label} — mínimo ${currentTier.minCommissionPct}% de comisión`,
        });
      }

      const existing = await db
        .select()
        .from(eventRrps)
        .where(and(eq(eventRrps.eventId, input.eventId), eq(eventRrps.rrpUserId, input.rrpUserId)))
        .limit(1);

      if (existing.length > 0) {
        await db.update(eventRrps)
          .set({
            customerDiscountPct: input.customerDiscountPct,
            rrpCommissionPct: input.rrpCommissionPct,
            active: true,
          })
          .where(eq(eventRrps.id, existing[0].id));
        return { success: true, updated: true };
      }

      await db.insert(eventRrps).values({
        eventId: input.eventId,
        rrpUserId: input.rrpUserId,
        customerDiscountPct: input.customerDiscountPct,
        rrpCommissionPct: input.rrpCommissionPct,
        assignedBy: ctx.user.id,
      });

      return { success: true, updated: false };
    }),

  /** Event creator: remove an RRP from their event (soft-delete). */
  removeFromEvent: protectedProcedure
    .input(z.object({ eventRrpId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [row] = await db.select().from(eventRrps).where(eq(eventRrps.id, input.eventRrpId)).limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Not found" });

      const [event] = await db.select().from(events).where(eq(events.id, row.eventId)).limit(1);
      if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      if (!canManageEvent(ctx.user as any, event)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your event" });
      }

      await db.delete(eventRrps).where(eq(eventRrps.id, input.eventRrpId));
      return { success: true };
    }),

  // ===== CODE VALIDATION (checkout) =====

  /**
   * Validate an RRP code for a given event. Returns the config if valid:
   *   { valid: true, rrpUserId, customerDiscountPct, rrpCommissionPct, discountedPrice }
   */
  validateCode: publicProcedure
    .input(z.object({
      code: z.string().trim().min(1).max(32),
      eventId: z.number().int().positive(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const normalized = input.code.trim().toUpperCase();

      const [profile] = await db.select().from(rrpProfiles)
        .where(and(eq(rrpProfiles.code, normalized), eq(rrpProfiles.active, true)))
        .limit(1);
      if (!profile) return { valid: false as const, error: "Invalid code" };

      const [assignment] = await db.select().from(eventRrps)
        .where(and(
          eq(eventRrps.eventId, input.eventId),
          eq(eventRrps.rrpUserId, profile.userId),
          eq(eventRrps.active, true),
        ))
        .limit(1);
      if (!assignment) return { valid: false as const, error: "This code is not active for this event" };

      const [event] = await db.select().from(events).where(eq(events.id, input.eventId)).limit(1);
      if (!event) return { valid: false as const, error: "Event not found" };

      const ticketPrice = parseFloat(String(event.ticketPrice));
      const discountAmount = Math.round(ticketPrice * assignment.customerDiscountPct) / 100;
      const discountedPrice = Math.max(0, ticketPrice - discountAmount);

      return {
        valid: true as const,
        code: normalized,
        rrpUserId: profile.userId,
        customerDiscountPct: assignment.customerDiscountPct,
        rrpCommissionPct: assignment.rrpCommissionPct,
        discountAmount,
        discountedPrice,
      };
    }),

  /** Admin: full list of active RRP profiles with stats. */
  adminList: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    return db
      .select({
        userId: rrpProfiles.userId,
        name: users.name,
        email: users.email,
        code: rrpProfiles.code,
        tier: rrpProfiles.tier,
        lifetimeSales: rrpProfiles.lifetimeSales,
        lifetimeEarnings: rrpProfiles.lifetimeEarnings,
        active: rrpProfiles.active,
        approvedAt: rrpProfiles.approvedAt,
      })
      .from(rrpProfiles)
      .leftJoin(users, eq(users.id, rrpProfiles.userId))
      .orderBy(desc(rrpProfiles.lifetimeSales));
  }),
});

// ─── Attribution helper (called from webhook after successful payment) ────────

/**
 * Record a sale attribution for an RRP, update their tier, and credit commission
 * to their internal balance. Prevents self-dealing (buyer == RRP).
 */
export async function attributeRrpSale(args: {
  rrpUserId: number;
  eventId: number;
  orderId?: number;
  buyerUserId: number;
  ticketPrice: number;
  customerDiscountPct: number;
  rrpCommissionPct: number;
}): Promise<void> {
  const { rrpUserId, buyerUserId } = args;
  if (rrpUserId === buyerUserId) {
    console.warn(`[RRP] Skip self-attribution: buyer ${buyerUserId} == RRP ${rrpUserId}`);
    return;
  }

  const db = await getDb();
  if (!db) return;

  const customerDiscount = Math.round(args.ticketPrice * args.customerDiscountPct) / 100;
  const priceAfterDiscount = args.ticketPrice - customerDiscount;
  const rrpCommission = Math.round(priceAfterDiscount * args.rrpCommissionPct * 100) / 10000;

  await db.insert(rrpSales).values({
    rrpUserId,
    eventId: args.eventId,
    orderId: args.orderId ?? null,
    buyerUserId,
    ticketPrice: args.ticketPrice.toFixed(2) as any,
    customerDiscount: customerDiscount.toFixed(2) as any,
    rrpCommission: rrpCommission.toFixed(2) as any,
    commissionPct: args.rrpCommissionPct,
    creditedToBalance: true,
  });

  // Update profile counters + tier
  const [profile] = await db.select().from(rrpProfiles).where(eq(rrpProfiles.userId, rrpUserId)).limit(1);
  if (profile) {
    const newLifetimeSales = profile.lifetimeSales + 1;
    const newEarnings = parseFloat(String(profile.lifetimeEarnings)) + rrpCommission;
    const newTier = tierForSales(newLifetimeSales);

    await db.update(rrpProfiles)
      .set({
        lifetimeSales: newLifetimeSales,
        lifetimeEarnings: newEarnings.toFixed(2) as any,
        tier: newTier.key,
      })
      .where(eq(rrpProfiles.userId, rrpUserId));

    // If tier changed, send celebration email
    if (newTier.key !== profile.tier) {
      try {
        const [rrpUser] = await db.select().from(users).where(eq(users.id, rrpUserId)).limit(1);
        if (rrpUser?.email) {
          await sendEmail({
            to: rrpUser.email,
            subject: `🎉 You've reached ${newTier.label} tier!`,
            htmlContent: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #FA3698, #FD4D43); padding: 32px; border-radius: 12px 12px 0 0; text-align: center; color: #fff;">
                  <h1 style="margin: 0; font-size: 28px;">🎉 Level up!</h1>
                  <p style="margin: 8px 0 0; opacity: 0.95;">You've reached <strong>${newTier.label}</strong></p>
                </div>
                <div style="background: #fff; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #eee;">
                  <p>Congrats <strong>${escapeHtml(rrpUser.name || "there")}</strong>!</p>
                  <p>With <strong>${newLifetimeSales}</strong> lifetime sales, you're now <strong>${newTier.label}</strong> tier. Your minimum commission floor is now <strong>${newTier.minCommissionPct}%</strong>.</p>
                  <p>Event creators who assign you will have to offer you at least ${newTier.minCommissionPct}% commission on their events.</p>
                  <p>Keep it going! 💪</p>
                </div>
              </div>`,
          });
        }
      } catch (e) {
        console.error("[RRP] Tier-up email failed:", e);
      }
    }
  }

  // Credit commission into the RRP's balance (uses existing balances infra)
  try {
    const { addEarnings } = await import("./financials");
    await addEarnings({
      userId: rrpUserId,
      amount: rrpCommission,
      description: `RRP commission for event #${args.eventId}`,
      orderId: args.orderId,
    });
  } catch (e) {
    console.error("[RRP] Failed to credit balance:", e);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
