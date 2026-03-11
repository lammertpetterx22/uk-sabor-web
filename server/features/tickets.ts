import { z } from "zod";
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

        const tickets = await db
            .select()
            .from(eventTickets)
            .where(eq(eventTickets.userId, ctx.user.id));

        const withEvents = await Promise.all(
            tickets.map(async ticket => {
                const [event] = await db
                    .select({ id: events.id, title: events.title, eventDate: events.eventDate, venue: events.venue, imageUrl: events.imageUrl })
                    .from(events)
                    .where(eq(events.id, ticket.eventId))
                    .limit(1);
                return { ...ticket, event: event ?? null };
            })
        );

        return withEvents;
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
                throw new Error("Entrada no encontrada — código inválido");
            }

            if (ticket.status === "used") {
                const usedTime = ticket.usedAt
                    ? new Date(ticket.usedAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
                    : "antes";
                throw new Error(`Esta entrada ya fue escaneada a las ${usedTime} `);
            }

            if (ticket.status === "cancelled") {
                throw new Error("Esta entrada fue cancelada y no es válida");
            }

            // Get buyer info
            const [buyer] = await db
                .select({ name: users.name, email: users.email })
                .from(users)
                .where(eq(users.id, ticket.userId))
                .limit(1);

            // Get event info
            const [event] = await db
                .select({ title: events.title, eventDate: events.eventDate, venue: events.venue })
                .from(events)
                .where(eq(events.id, ticket.eventId))
                .limit(1);

            // Mark as used  
            await db
                .update(eventTickets)
                .set({ status: "used", usedAt: new Date() })
                .where(eq(eventTickets.id, ticket.id));

            return {
                success: true,
                ticketCode: code,
                attendeeName: buyer?.name ?? "Asistente",
                attendeeEmail: buyer?.email ?? null,
                eventTitle: event?.title ?? "Evento",
                eventDate: event?.eventDate ?? null,
                eventVenue: event?.venue ?? null,
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
                throw new Error("Acceso denegado — solo staff puede ver las entradas");
            }

            const db = await getDb();
            if (!db) throw new Error("Database not available");

            const tickets = await db
                .select()
                .from(eventTickets)
                .where(eq(eventTickets.eventId, eventId));

            const [event] = await db
                .select()
                .from(events)
                .where(eq(events.id, eventId))
                .limit(1);

            const summary = {
                total: tickets.length,
                valid: tickets.filter(t => t.status === "valid").length,
                used: tickets.filter(t => t.status === "used").length,
                cancelled: tickets.filter(t => t.status === "cancelled").length,
            };

            return { event, tickets, summary };
        }),
});
