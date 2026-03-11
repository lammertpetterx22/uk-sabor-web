import z from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { events, eventTickets, usageTracking } from "../../drizzle/schema";
import { getAllRoles } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { canCreateEvent } from "../stripe/plans";

// Uses getAllRoles() to support multi-role users
function isCreatorRole(user: { role: string; roles?: string | null }): boolean {
  const all = getAllRoles(user as any);
  return all.some(r => r === "admin" || r === "instructor" || r === "promoter");
}

export const eventsRouter = router({
  /**
   * List all published events
   */
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(events)
        .where(eq(events.status, "published"))
        .orderBy(desc(events.eventDate))
        .limit(input.limit)
        .offset(input.offset);

      return result;
    }),

  /**
   * Get event by ID
   */
  getById: publicProcedure.input(z.number()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.select().from(events).where(eq(events.id, input)).limit(1);

    return result[0] || null;
  }),

  /**
   * Get user's event tickets
   */
  getUserTickets: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .select()
      .from(eventTickets)
      .where(eq(eventTickets.userId, ctx.user.id));

    return result;
  }),

  /**
   * Check if user has access to event
   */
  hasAccess: protectedProcedure.input(z.number()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const { and } = await import("drizzle-orm");
    const result = await db
      .select()
      .from(eventTickets)
      .where(and(eq(eventTickets.userId, ctx.user.id), eq(eventTickets.eventId, input)))
      .limit(1);

    return result.length > 0;
  }),

  /**
   * List all events for admin/instructor/promoter management
   * Admins see all; instructors/promoters see only their own
   */
  listAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(100),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!isCreatorRole(ctx.user)) throw new Error("Unauthorized");
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userRoles = getAllRoles(ctx.user as any);
      if (userRoles.includes("admin")) {
        return db.select().from(events).orderBy(desc(events.eventDate)).limit(input.limit).offset(input.offset);
      }

      // Instructors and promoters see only their own events
      return db
        .select()
        .from(events)
        .where(eq(events.creatorId, ctx.user.id))
        .orderBy(desc(events.eventDate))
        .limit(input.limit)
        .offset(input.offset);
    }),

  /**
   * Create event — admin/instructor/promoter with entitlement check
   */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        venue: z.string().min(1),
        city: z.string().optional(),
        eventDate: z.string().min(1),
        eventEndDate: z.string().optional(),
        ticketPrice: z.string().min(1),
        maxTickets: z.number().optional(),
        paymentMethod: z.enum(["online", "cash", "both"]).default("online"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!isCreatorRole(ctx.user)) throw new Error("Unauthorized");

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userRoles = getAllRoles(ctx.user as any);

      // Entitlement check for non-admin creators
      if (!userRoles.includes("admin")) {
        const now = new Date();
        const [usage] = await db
          .select({ eventsCreated: usageTracking.eventsCreated })
          .from(usageTracking)
          .where(
            and(
              eq(usageTracking.userId, ctx.user.id),
              eq(usageTracking.periodYear, now.getFullYear()),
              eq(usageTracking.periodMonth, now.getMonth() + 1)
            )
          )
          .limit(1);
        const eventsThisMonth = usage?.eventsCreated ?? 0;
        const entitlement = canCreateEvent(ctx.user.subscriptionPlan as any, eventsThisMonth);
        if (!entitlement.allowed) {
          throw new Error(entitlement.reason ?? "Plan limit reached");
        }
      }

      // Validate and parse the date
      const parsedDate = new Date(input.eventDate);
      if (isNaN(parsedDate.getTime())) {
        throw new Error("Invalid event date format. Please use YYYY-MM-DDTHH:MM format.");
      }
      if (parsedDate.getFullYear() < 2000) {
        throw new Error("Event date must be a valid future date (after year 2000).");
      }

      const parsedEndDate = input.eventEndDate ? new Date(input.eventEndDate) : undefined;
      if (parsedEndDate && isNaN(parsedEndDate.getTime())) {
        throw new Error("Invalid event end date format.");
      }

      const result = await db.insert(events).values({
        title: input.title,
        description: input.description,
        imageUrl: input.imageUrl,
        venue: input.venue,
        city: input.city,
        eventDate: parsedDate,
        eventEndDate: parsedEndDate,
        ticketPrice: input.ticketPrice as any,
        maxTickets: input.maxTickets,
        paymentMethod: input.paymentMethod,
        creatorId: ctx.user.id,
        status: "draft",
      });

      // Record usage for non-admin creators
      if (!userRoles.includes("admin")) {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        const existingUsage = await db.select().from(usageTracking)
          .where(and(eq(usageTracking.userId, ctx.user.id), eq(usageTracking.periodYear, year), eq(usageTracking.periodMonth, month)))
          .limit(1);

        if (existingUsage.length > 0) {
          const { sql } = await import("drizzle-orm");
          await db.update(usageTracking)
            .set({ eventsCreated: sql`eventsCreated + 1` })
            .where(eq(usageTracking.id, existingUsage[0].id));
        } else {
          await db.insert(usageTracking).values({
            userId: ctx.user.id,
            periodYear: year,
            periodMonth: month,
            eventsCreated: 1,
          });
        }
      }

      return result;
    }),

  /**
   * Update event — admin can update any; instructors/promoters only their own
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        venue: z.string().optional(),
        city: z.string().optional(),
        eventDate: z.string().optional(),
        eventEndDate: z.string().optional(),
        ticketPrice: z.string().optional(),
        maxTickets: z.number().optional(),
        status: z.enum(["draft", "published", "cancelled", "completed"]).optional(),
        paymentMethod: z.enum(["online", "cash", "both"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!isCreatorRole(ctx.user)) throw new Error("Unauthorized");

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userRoles = getAllRoles(ctx.user as any);

      // Non-admin can only update their own events
      if (!userRoles.includes("admin")) {
        const [ev] = await db.select().from(events).where(eq(events.id, input.id)).limit(1);
        if (!ev || ev.creatorId !== ctx.user.id) throw new Error("You do not have permission to edit this event");
      }

      const { id, eventDate, eventEndDate, ...rest } = input;
      const updateData: Record<string, any> = { ...rest };
      if (eventDate) {
        const parsedDate = new Date(eventDate);
        if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() < 2000) {
          throw new Error("Invalid event date. Please use YYYY-MM-DDTHH:MM format.");
        }
        updateData.eventDate = parsedDate;
      }
      if (eventEndDate) {
        const parsedEndDate = new Date(eventEndDate);
        if (!isNaN(parsedEndDate.getTime())) updateData.eventEndDate = parsedEndDate;
      }
      const result = await db.update(events).set(updateData).where(eq(events.id, id));

      return result;
    }),

  /**
   * Delete event — admin can delete any; instructors/promoters only their own
   */
  delete: protectedProcedure.input(z.number()).mutation(async ({ ctx, input }) => {
    if (!isCreatorRole(ctx.user)) throw new Error("Unauthorized");

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const userRoles = getAllRoles(ctx.user as any);

    // Non-admin can only delete their own events
    if (!userRoles.includes("admin")) {
      const [ev] = await db.select().from(events).where(eq(events.id, input)).limit(1);
      if (!ev || ev.creatorId !== ctx.user.id) throw new Error("You do not have permission to delete this event");
    }

    const result = await db.delete(events).where(eq(events.id, input));

    return result;
  }),
});
