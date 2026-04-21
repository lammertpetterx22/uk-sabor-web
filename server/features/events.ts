import z from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { events, eventTickets, eventTicketTiers, usageTracking } from "../../drizzle/schema";
import { getAllRoles } from "../../drizzle/schema";
import { eq, desc, and, gte } from "drizzle-orm";
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

      // Hide events whose date has already passed (past the start of today)
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const result = await db
        .select()
        .from(events)
        .where(and(eq(events.status, "published"), gte(events.eventDate, startOfToday)))
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

      // Determine payment method flags based on paymentMethod
      const allowCashPayment = input.paymentMethod === "cash" || input.paymentMethod === "both";
      const allowOnlinePayment = input.paymentMethod === "online" || input.paymentMethod === "both";

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
        allowCashPayment,
        allowOnlinePayment,
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

      // Update payment method flags if paymentMethod is being changed
      if (input.paymentMethod) {
        updateData.allowCashPayment = input.paymentMethod === "cash" || input.paymentMethod === "both";
        updateData.allowOnlinePayment = input.paymentMethod === "online" || input.paymentMethod === "both";
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

  /**
   * Create cash reservation for event (user reserves spot, pays at door)
   */
  createCashReservation: protectedProcedure
    .input(z.object({
      eventId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // 1. Get event details
      const [event] = await db.select()
        .from(events)
        .where(eq(events.id, input.eventId))
        .limit(1);

      if (!event) {
        throw new Error("Event not found");
      }

      // 2. Verify event allows cash payment
      if (!event.allowCashPayment && event.paymentMethod !== "cash" && event.paymentMethod !== "both") {
        throw new Error("This event requires online payment");
      }

      // 3. Check if event is published
      if (event.status !== "published") {
        throw new Error("This event is not available for booking");
      }

      // 4. Check if user already has a ticket for this event
      const existingTicket = await db.select()
        .from(eventTickets)
        .where(and(
          eq(eventTickets.userId, ctx.user.id),
          eq(eventTickets.eventId, input.eventId)
        ))
        .limit(1);

      if (existingTicket.length > 0) {
        throw new Error("You already have a ticket for this event");
      }

      // 5. Check if there are spots available
      if (event.maxTickets && (event.ticketsSold ?? 0) >= event.maxTickets) {
        throw new Error("This event is sold out");
      }

      // 6. Generate unique ticket code
      const ticketCode = `CASH-${event.id}-${ctx.user.id}-${Date.now()}`;

      // 7. Create ticket with pending_cash status
      const [ticket] = await db.insert(eventTickets).values({
        userId: ctx.user.id,
        eventId: input.eventId,
        quantity: 1,
        pricePaid: event.ticketPrice,
        ticketCode,
        status: "valid",
        paymentStatus: "pending_cash",
        paymentMethod: "cash",
        reservedAt: new Date(),
        purchasedAt: new Date(),
      }).returning();

      // 8. Update tickets sold count
      const { sql } = await import("drizzle-orm");
      await db.update(events)
        .set({ ticketsSold: sql`${events.ticketsSold} + 1` })
        .where(eq(events.id, input.eventId));

      // 9. Generate QR code
      const QRCode = await import("qrcode");
      const { qrCodes } = await import("../../drizzle/schema");

      const qrCodeValue = `event-${event.id}-user-${ctx.user.id}-ticket-${ticket.id}`;
      const qrDataUrl = await QRCode.toDataURL(qrCodeValue, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 300
      });

      await db.insert(qrCodes).values({
        code: qrCodeValue,
        itemType: 'event',
        itemId: event.id,
        userId: ctx.user.id,
        qrData: qrDataUrl,
      });

      console.log(`[CashReservation] ✅ Reservation created for user ${ctx.user.id} for event ${event.id}`);

      // 10. Send confirmation email
      try {
        const { generateCashReservationEmail, generateCashReservationEmailPlainText } = await import("../emails/cashReservationConfirmation");
        const { sendEmail } = await import("../emails/emailService");

        const emailHtml = generateCashReservationEmail({
          to: ctx.user.email,
          userName: ctx.user.name || ctx.user.email.split('@')[0],
          itemType: "event",
          itemTitle: event.title,
          itemDate: event.eventDate,
          venue: event.venue || undefined,
          price: event.ticketPrice,
          qrCode: qrDataUrl,
          confirmationCode: ticket.ticketCode || "",
          paymentInstructions: event.cashPaymentInstructions || undefined,
        });

        const emailText = generateCashReservationEmailPlainText({
          to: ctx.user.email,
          userName: ctx.user.name || ctx.user.email.split('@')[0],
          itemType: "event",
          itemTitle: event.title,
          itemDate: event.eventDate,
          venue: event.venue || undefined,
          price: event.ticketPrice,
          qrCode: qrDataUrl,
          confirmationCode: ticket.ticketCode || "",
          paymentInstructions: event.cashPaymentInstructions || undefined,
        });

        await sendEmail({
          to: ctx.user.email,
          subject: `Spot Reserved: ${event.title} - Pay at Door`,
          html: emailHtml,
          text: emailText,
        });

        console.log(`[CashReservation] 📧 Email sent to ${ctx.user.email}`);
      } catch (emailError) {
        console.error(`[CashReservation] ⚠️ Failed to send email:`, emailError);
        // Don't throw - reservation was successful even if email fails
      }

      return {
        success: true,
        ticketId: ticket.id,
        ticketCode: ticket.ticketCode,
        qrCode: qrDataUrl,
        eventTitle: event.title,
        eventDate: event.eventDate,
        venue: event.venue,
        price: event.ticketPrice,
        paymentInstructions: event.cashPaymentInstructions || `Bring ${event.ticketPrice} in cash to the door`,
      };
    }),

  /**
   * Add collaborator to event - Only creator can add
   * Split options: 50/50 or 60/40 (creator gets 60%)
   */
  addCollaborator: protectedProcedure
    .input(z.object({
      eventId: z.number(),
      collaboratorId: z.number(),
      split: z.enum(["50/50", "60/40"]).default("50/50"),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isCreatorRole(ctx.user)) throw new Error("Unauthorized");

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // 1. Get event and verify creator
      const [event] = await db.select().from(events).where(eq(events.id, input.eventId)).limit(1);
      if (!event) throw new Error("Event not found");
      if (event.creatorId !== ctx.user.id) {
        throw new Error("Only the event creator can add collaborators");
      }

      // 2. Check if collaborator exists and has instructor/promoter role
      const { users, collaborators } = await import("../../drizzle/schema");
      const [collaborator] = await db.select().from(users).where(eq(users.id, input.collaboratorId)).limit(1);
      if (!collaborator) throw new Error("Collaborator user not found");

      const collabRoles = getAllRoles(collaborator as any);
      if (!collabRoles.some(r => r === "instructor" || r === "promoter" || r === "admin")) {
        throw new Error("Collaborator must be an instructor or promoter");
      }

      // 3. Check if collaborator already exists for this event
      const existing = await db.select()
        .from(collaborators)
        .where(and(
          eq(collaborators.itemType, "event"),
          eq(collaborators.itemId, input.eventId)
        ))
        .limit(1);

      if (existing.length > 0) {
        throw new Error("This event already has a collaborator");
      }

      // 4. Calculate percentages based on split
      const creatorPercentage = input.split === "60/40" ? 60 : 50;
      const collaboratorPercentage = input.split === "60/40" ? 40 : 50;

      // 5. Create collaborator record
      const [result] = await db.insert(collaborators).values({
        itemType: "event",
        itemId: input.eventId,
        creatorId: ctx.user.id,
        collaboratorId: input.collaboratorId,
        creatorPercentage,
        collaboratorPercentage,
      }).returning();

      console.log(`[Collaborator] ✅ Added collaborator ${input.collaboratorId} to event ${input.eventId} (${input.split})`);

      return result;
    }),

  /**
   * Remove collaborator from event - Only creator can remove
   */
  removeCollaborator: protectedProcedure
    .input(z.object({
      eventId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isCreatorRole(ctx.user)) throw new Error("Unauthorized");

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify event creator
      const [event] = await db.select().from(events).where(eq(events.id, input.eventId)).limit(1);
      if (!event) throw new Error("Event not found");
      if (event.creatorId !== ctx.user.id) {
        throw new Error("Only the event creator can remove collaborators");
      }

      const { collaborators } = await import("../../drizzle/schema");
      const result = await db.delete(collaborators)
        .where(and(
          eq(collaborators.itemType, "event"),
          eq(collaborators.itemId, input.eventId)
        ));

      console.log(`[Collaborator] ✅ Removed collaborator from event ${input.eventId}`);

      return result;
    }),

  /**
   * Get collaborator for an event
   */
  getCollaborator: publicProcedure
    .input(z.number())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { collaborators } = await import("../../drizzle/schema");
      const [result] = await db.select()
        .from(collaborators)
        .where(and(
          eq(collaborators.itemType, "event"),
          eq(collaborators.itemId, input)
        ))
        .limit(1);

      return result || null;
    }),

  // ─── Multi-tier tickets ────────────────────────────────────────────────
  /** Public: list ticket tiers for an event (ordered by position). */
  listTiers: publicProcedure
    .input(z.number())
    .query(async ({ input: eventId }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return db
        .select()
        .from(eventTicketTiers)
        .where(and(eq(eventTicketTiers.eventId, eventId), eq(eventTicketTiers.active, true)))
        .orderBy(eventTicketTiers.position);
    }),

  /**
   * Replace the tier list for an event. Creators send the full desired state:
   * new rows get inserted, edited rows get updated (preserving soldCount),
   * removed rows get soft-deactivated so existing ticket.tierId references stay intact.
   */
  saveTiers: protectedProcedure
    .input(z.object({
      eventId: z.number(),
      tiers: z.array(z.object({
        id: z.number().optional(),
        name: z.string().min(1),
        description: z.string().optional().nullable(),
        price: z.string().min(1),
        maxQuantity: z.number().int().positive().optional().nullable(),
        position: z.number().int().min(0),
      })).max(20),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isCreatorRole(ctx.user)) throw new Error("Unauthorized");
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Ownership check
      const [ev] = await db.select().from(events).where(eq(events.id, input.eventId)).limit(1);
      if (!ev) throw new Error("Event not found");
      const userRoles = getAllRoles(ctx.user as any);
      if (!userRoles.includes("admin") && ev.creatorId !== ctx.user.id) {
        throw new Error("You do not have permission to edit this event");
      }

      const existing = await db.select().from(eventTicketTiers).where(eq(eventTicketTiers.eventId, input.eventId));
      const existingById = new Map(existing.map(t => [t.id, t]));
      const keptIds = new Set<number>();

      for (const tier of input.tiers) {
        if (tier.id && existingById.has(tier.id)) {
          keptIds.add(tier.id);
          await db.update(eventTicketTiers)
            .set({
              name: tier.name,
              description: tier.description ?? null,
              price: tier.price as any,
              maxQuantity: tier.maxQuantity ?? null,
              position: tier.position,
              active: true,
              updatedAt: new Date(),
            })
            .where(eq(eventTicketTiers.id, tier.id));
        } else {
          await db.insert(eventTicketTiers).values({
            eventId: input.eventId,
            name: tier.name,
            description: tier.description ?? null,
            price: tier.price as any,
            maxQuantity: tier.maxQuantity ?? null,
            position: tier.position,
          });
        }
      }

      // Soft-deactivate tiers that were removed — keeps historical ticket.tierId valid
      for (const t of existing) {
        if (!keptIds.has(t.id)) {
          await db.update(eventTicketTiers)
            .set({ active: false, updatedAt: new Date() })
            .where(eq(eventTicketTiers.id, t.id));
        }
      }

      // Return the current tier list so callers can map their in-memory
      // positions back to the persisted tier ids (e.g. to attach pending
      // discount codes to the right tier right after creation).
      const saved = await db
        .select()
        .from(eventTicketTiers)
        .where(and(eq(eventTicketTiers.eventId, input.eventId), eq(eventTicketTiers.active, true)))
        .orderBy(eventTicketTiers.position);
      return { ok: true, tiers: saved };
    }),
});
