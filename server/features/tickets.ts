import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { eventTickets, events, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// ─── Role guards ──────────────────────────────────────────────────────────────

/** Staff = instructor (teacher) OR promoter roles */
function isStaff(user: { role: string; roles?: string | null }): boolean {
    const extra: string[] = [];
    try {
        const parsed = user.roles ? JSON.parse(user.roles) : [];
        if (Array.isArray(parsed)) extra.push(...parsed);
    } catch { }
    const all = [user.role, ...extra];
    return all.some(r => r === "instructor" || r === "promoter" || r === "admin");
}

// ─── Tickets Router ───────────────────────────────────────────────────────────

export const ticketsRouter = router({
    /**
     * Get all tickets for the current user (with event info).
     */
    getMyTickets: protectedProcedure.query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // ✅ FIX N+1: Single query with LEFT JOIN
        // This replaces N queries (1 per ticket) with 1 query
        const ticketsWithEvents = await db
            .select({
                // Ticket fields
                id: eventTickets.id,
                userId: eventTickets.userId,
                eventId: eventTickets.eventId,
                orderId: eventTickets.orderId,
                quantity: eventTickets.quantity,
                instructorId: eventTickets.instructorId,
                pricePaid: eventTickets.pricePaid,
                platformFee: eventTickets.platformFee,
                instructorEarnings: eventTickets.instructorEarnings,
                ticketCode: eventTickets.ticketCode,
                status: eventTickets.status,
                purchasedAt: eventTickets.purchasedAt,
                usedAt: eventTickets.usedAt,
                // Event info (nested object)
                event: {
                    id: events.id,
                    title: events.title,
                    eventDate: events.eventDate,
                    venue: events.venue,
                    imageUrl: events.imageUrl,
                }
            })
            .from(eventTickets)
            .leftJoin(events, eq(events.id, eventTickets.eventId))
            .where(eq(eventTickets.userId, ctx.user.id));

        return ticketsWithEvents;
    }),

    /**
     * Validate a QR code and mark the ticket as used.
     * Only accessible to staff (instructor/promoter/admin).
     *
     * QR payload format: "TKT-<ticketCode>"
     */
    validateQR: protectedProcedure
        .input(z.object({ qrPayload: z.string().min(1) }))
        .mutation(async ({ input, ctx }) => {
            if (!isStaff(ctx.user)) {
                throw new Error("Acceso denegado — solo staff puede validar entradas");
            }

            const db = await getDb();
            if (!db) throw new Error("Database not available");

            // Parse the QR payload — we embed "TKT-<ticketCode>" in the QR
            const code = input.qrPayload.startsWith("TKT-")
                ? input.qrPayload.slice(4)
                : input.qrPayload;

            // Find the ticket
            const [ticket] = await db
                .select()
                .from(eventTickets)
                .where(eq(eventTickets.ticketCode, code))
                .limit(1);

            if (!ticket) {
                throw new Error("Ticket not found — invalid code");
            }

            // Get event info (needed for ownership check below)
            const [event] = await db
                .select({ title: events.title, eventDate: events.eventDate, venue: events.venue, creatorId: events.creatorId })
                .from(events)
                .where(eq(events.id, ticket.eventId))
                .limit(1);

            // Ownership check — only the event's creator (or admin) can validate
            // QRs for this event.
            const isAdmin = ctx.user.role === "admin";
            const isCreator = event && !!event.creatorId && event.creatorId === ctx.user.id;
            if (!isAdmin && !isCreator) {
                throw new Error("Access denied — only the event creator can scan tickets for this event");
            }

            if (ticket.status === "used") {
                const usedTime = ticket.usedAt
                    ? new Date(ticket.usedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
                    : "earlier";
                throw new Error(`This ticket was already scanned at ${usedTime}`);
            }

            if (ticket.status === "cancelled") {
                throw new Error("This ticket has been cancelled and is not valid");
            }

            // Check if payment is pending (cash)
            const isPendingCash = (ticket as any).paymentStatus === "pending_cash";

            // Get buyer info
            const [buyer] = await db
                .select({ name: users.name, email: users.email })
                .from(users)
                .where(eq(users.id, ticket.userId))
                .limit(1);

            // Mark as used AND confirm cash payment if pending
            const updateData: any = {
                status: "used",
                usedAt: new Date()
            };

            if (isPendingCash) {
                updateData.paymentStatus = "paid";
                updateData.paidAt = new Date();
            }

            await db
                .update(eventTickets)
                .set(updateData)
                .where(eq(eventTickets.id, ticket.id));

            return {
                success: true,
                ticketCode: code,
                attendeeName: buyer?.name ?? "Attendee",
                attendeeEmail: buyer?.email ?? null,
                eventTitle: event?.title ?? "Event",
                eventDate: event?.eventDate ?? null,
                eventVenue: event?.venue ?? null,
                wasPendingCash: isPendingCash,
                price: isPendingCash ? ticket.pricePaid : null,
            };
        }),

    /**
     * List all tickets for a specific event (staff view).
     * Returns valid/used/cancelled counts + full list.
     */
    getEventTickets: protectedProcedure
        .input(z.number().positive())
        .query(async ({ input: eventId, ctx }) => {
            if (!isStaff(ctx.user)) {
                throw new Error("Access denied — only staff can view ticket lists");
            }

            const db = await getDb();
            if (!db) throw new Error("Database not available");

            const [event] = await db
                .select()
                .from(events)
                .where(eq(events.id, eventId))
                .limit(1);

            if (!event) throw new Error("Event not found");

            // Ownership check: only the event's creator (or an admin) can see its tickets.
            // Other instructors/promoters/rrps must not be able to look at events they
            // didn't create.
            const isAdmin = ctx.user.role === "admin";
            const isCreator = !!event.creatorId && event.creatorId === ctx.user.id;
            if (!isAdmin && !isCreator) {
                throw new Error("Access denied — you're not the creator of this event");
            }

            const tickets = await db
                .select()
                .from(eventTickets)
                .where(eq(eventTickets.eventId, eventId));

            const summary = {
                total: tickets.length,
                valid: tickets.filter(t => t.status === "valid").length,
                used: tickets.filter(t => t.status === "used").length,
                cancelled: tickets.filter(t => t.status === "cancelled").length,
            };

            return { event, tickets, summary };
        }),
});
