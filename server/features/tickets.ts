import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { eventTickets, eventTicketTiers, events, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import { sendQRCodeEmail } from "./email";

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

            // Join the buying user so the admin can search the list by
            // buyer name / email — not just ticket code. For guest-list
            // entries the buyer is a placeholder account, so we also keep
            // ticket.guestName / guestEmail in the payload.
            const rows = await db
                .select({
                    ticket: eventTickets,
                    buyerName: users.name,
                    buyerEmail: users.email,
                })
                .from(eventTickets)
                .leftJoin(users, eq(users.id, eventTickets.userId))
                .where(eq(eventTickets.eventId, eventId));

            const tickets = rows.map(r => ({
                ...r.ticket,
                buyerName: r.buyerName,
                buyerEmail: r.buyerEmail,
            }));

            const summary = {
                total: tickets.length,
                valid: tickets.filter(t => t.status === "valid").length,
                used: tickets.filter(t => t.status === "used").length,
                cancelled: tickets.filter(t => t.status === "cancelled").length,
            };

            return { event, tickets, summary };
        }),

    /**
     * Re-send the ticket confirmation email for a single ticket. Used when
     * the buyer says the original email never arrived (spam, typo, etc.).
     * Only the event creator (or admin) can trigger this.
     */
    resendTicketEmail: protectedProcedure
        .input(z.object({ ticketId: z.number().int().positive() }))
        .mutation(async ({ ctx, input }) => {
            const db = await getDb();
            if (!db) throw new Error("Database not available");

            const [ticket] = await db.select().from(eventTickets).where(eq(eventTickets.id, input.ticketId)).limit(1);
            if (!ticket) throw new Error("Ticket not found");

            const [event] = await db.select().from(events).where(eq(events.id, ticket.eventId)).limit(1);
            if (!event) throw new Error("Event not found");

            // Ownership: only the event's creator (or admin) can resend
            const isAdmin = ctx.user.role === "admin";
            const isCreator = !!event.creatorId && event.creatorId === ctx.user.id;
            if (!isAdmin && !isCreator) {
                throw new Error("Access denied — only the event creator can resend ticket emails");
            }

            // Where to send: guest tickets keep their guestEmail; paid tickets
            // go to the buying user's email. Fallback keeps it defensive.
            let toEmail: string | null = null;
            let toName: string = "Attendee";

            if (ticket.paymentStatus === "guest" && ticket.guestEmail) {
                toEmail = ticket.guestEmail;
                toName = ticket.guestName || "Guest";
            } else {
                const [buyer] = await db.select({ email: users.email, name: users.name })
                    .from(users).where(eq(users.id, ticket.userId)).limit(1);
                toEmail = buyer?.email ?? null;
                toName = buyer?.name || "Attendee";
            }

            if (!toEmail) throw new Error("This ticket has no email address on file");

            // Build the tier-aware title and post-purchase info (same logic as the webhook)
            let itemName = event.title;
            let postPurchaseInfo: string | undefined;
            if (ticket.tierId) {
                const [tier] = await db.select({ name: eventTicketTiers.name, postPurchaseInfo: eventTicketTiers.postPurchaseInfo })
                    .from(eventTicketTiers).where(eq(eventTicketTiers.id, ticket.tierId)).limit(1);
                if (tier?.name) itemName = `${event.title} — ${tier.name}`;
                if (tier?.postPurchaseInfo) postPurchaseInfo = tier.postPurchaseInfo;
            }

            const eventDt = new Date(event.eventDate);
            const eventDate = eventDt.toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
            const eventTime = eventDt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

            // Regenerate the QR locally — used for the PNG attachment fallback.
            // The inline QR in the HTML uses the hosted URL-based generator.
            const qrCodeImage = await QRCode.toDataURL(`TKT-${ticket.ticketCode}`, {
                errorCorrectionLevel: "H" as any,
                margin: 1,
                width: 300,
            });

            const ok = await sendQRCodeEmail({
                to: toEmail,
                userName: toName,
                itemType: "event",
                itemName,
                qrCodeImage,
                ticketCode: ticket.ticketCode || undefined,
                eventDate,
                eventTime,
                postPurchaseInfo,
            });

            if (!ok) throw new Error("Email could not be sent — try again in a minute");
            return { success: true, sentTo: toEmail };
        }),
});
