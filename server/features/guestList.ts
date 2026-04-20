import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  eventTickets,
  events,
  users,
  qrCodes,
  attendance,
  getAllRoles,
} from "../../drizzle/schema";
import { and, eq, desc } from "drizzle-orm";
import crypto from "crypto";
import QRCode from "qrcode";
import { sendEmail } from "./email";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function canManageEvent(user: { id: number; role: string; roles?: string | null }, event: { creatorId?: number | null }): boolean {
  const roles = getAllRoles(user as any);
  if (roles.includes("admin")) return true;
  return !!event.creatorId && event.creatorId === user.id;
}

function generateGuestTicketCode(eventId: number): string {
  const rand = crypto.randomBytes(6).toString("hex").toUpperCase();
  return `GUEST-${eventId}-${rand}`;
}

/**
 * Find a user by email (case-insensitive) or create a lightweight placeholder
 * user record so the guest has a userId to attach the ticket to.
 */
async function findOrCreateGuestUser(db: any, name: string, email: string): Promise<{ id: number; isNew: boolean }> {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
  if (existing[0]) return { id: existing[0].id, isNew: false };

  const openId = `guest_${crypto.randomBytes(12).toString("hex")}`;
  const [created] = await db.insert(users).values({
    openId,
    email: normalizedEmail,
    name: name.trim(),
    loginMethod: "guest_invite",
    role: "user",
  }).returning({ id: users.id });
  return { id: created.id, isNew: true };
}

function buildInvitationEmailHtml(opts: {
  guestName: string;
  eventTitle: string;
  eventDate?: string;
  eventTime?: string;
  venue?: string;
  ticketCode: string;
  qrDataUrl: string;
}): string {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You're Invited — UK Sabor</title>
  </head>
  <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;padding:20px;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
          <tr><td style="background:linear-gradient(135deg,#FA3698 0%,#FD4D43 100%);padding:40px 30px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;">🎉 You're on the Guest List!</h1>
            <p style="margin:10px 0 0 0;color:rgba(255,255,255,0.95);font-size:15px;">Complimentary entry — UK Sabor</p>
          </td></tr>
          <tr><td style="padding:30px;">
            <p style="margin:0 0 16px 0;font-size:16px;color:#1a1a1a;">Hi <strong>${escapeHtml(opts.guestName)}</strong>,</p>
            <p style="margin:0 0 20px 0;font-size:15px;color:#444;line-height:1.6;">
              You've been added to the <strong>guest list</strong> for the event below.
              Show the QR code at the door to get in.
            </p>

            <div style="background:#f9f9f9;border-left:4px solid #FA3698;border-radius:8px;padding:18px;margin:20px 0;">
              <h2 style="margin:0 0 10px 0;color:#FA3698;font-size:20px;">${escapeHtml(opts.eventTitle)}</h2>
              ${opts.eventDate ? `<p style="margin:4px 0;font-size:14px;color:#333;"><strong>Date:</strong> ${escapeHtml(opts.eventDate)}</p>` : ""}
              ${opts.eventTime ? `<p style="margin:4px 0;font-size:14px;color:#333;"><strong>Time:</strong> ${escapeHtml(opts.eventTime)}</p>` : ""}
              ${opts.venue ? `<p style="margin:4px 0;font-size:14px;color:#333;"><strong>Venue:</strong> ${escapeHtml(opts.venue)}</p>` : ""}
            </div>

            <div style="text-align:center;background:#fafafa;border-radius:10px;padding:24px;margin:20px 0;">
              <p style="margin:0 0 12px 0;font-size:14px;color:#555;font-weight:600;">📱 Your entry QR code</p>
              <img src="${opts.qrDataUrl}" alt="QR" style="max-width:240px;width:100%;height:auto;border:2px solid #eee;padding:10px;background:#fff;border-radius:8px;" />
              <p style="margin:14px 0 0 0;font-family:monospace;font-size:13px;color:#FA3698;font-weight:700;letter-spacing:1px;">${escapeHtml(opts.ticketCode)}</p>
              <p style="margin:12px 0 0 0;font-size:12px;color:#888;">If the QR above doesn't display, check the attached image.</p>
            </div>

            <div style="background:#fff3cd;border-left:4px solid #ffc107;border-radius:6px;padding:14px;margin:20px 0;font-size:13px;color:#664d03;">
              ⚠️ This QR is <strong>unique and single-use</strong>. Don't share it — it only works once.
            </div>

            <p style="margin:20px 0 0 0;font-size:13px;color:#666;">
              Questions? Reply to this email or contact <a href="mailto:info@consabor.uk" style="color:#FA3698;">info@consabor.uk</a>
            </p>
          </td></tr>
          <tr><td style="background:#f5f5f5;padding:20px;text-align:center;font-size:12px;color:#888;border-top:1px solid #e5e5e5;">
            <p style="margin:0;">© ${new Date().getFullYear()} UK Sabor · <a href="https://www.consabor.uk" style="color:#FA3698;text-decoration:none;">www.consabor.uk</a></p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
  </html>`;
}

/** Extract the raw PNG bytes from a `data:image/png;base64,...` URL. */
function dataUrlToBuffer(dataUrl: string): Buffer | null {
  const match = /^data:image\/png;base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return Buffer.from(match[1], "base64");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendGuestInvitationEmail(opts: {
  to: string;
  guestName: string;
  event: { title: string; eventDate: Date | string; venue: string | null };
  ticketCode: string;
  qrDataUrl: string;
}): Promise<boolean> {
  const d = new Date(opts.event.eventDate);
  const eventDate = d.toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const eventTime = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  // Use a public QR service URL for the inline image — Apple Mail refuses to
  // render data: URLs and CID attachments, but external URLs always work.
  const qrPayload = `TKT-${opts.ticketCode}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=10&ecc=H&format=png&data=${encodeURIComponent(qrPayload)}`;

  const html = buildInvitationEmailHtml({
    guestName: opts.guestName,
    eventTitle: opts.event.title,
    eventDate,
    eventTime,
    venue: opts.event.venue || undefined,
    ticketCode: opts.ticketCode,
    qrDataUrl: qrUrl,
  });

  const qrBuffer = dataUrlToBuffer(opts.qrDataUrl);
  const attachments = qrBuffer
    ? [{
        filename: `guest-list-qr-${opts.ticketCode}.png`,
        content: qrBuffer,
        contentType: "image/png",
      }]
    : undefined;

  return sendEmail({
    to: opts.to,
    subject: `🎟️ You're on the Guest List — ${opts.event.title}`,
    htmlContent: html,
    attachments,
  });
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const guestListRouter = router({
  /** List all guests for an event, with attendance state. */
  list: protectedProcedure
    .input(z.object({ eventId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [event] = await db.select().from(events).where(eq(events.id, input.eventId)).limit(1);
      if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      if (!canManageEvent(ctx.user as any, event)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You cannot manage this event's guest list" });
      }

      const rows = await db
        .select({
          id: eventTickets.id,
          ticketCode: eventTickets.ticketCode,
          status: eventTickets.status,
          guestName: eventTickets.guestName,
          guestEmail: eventTickets.guestEmail,
          userId: eventTickets.userId,
          usedAt: eventTickets.usedAt,
          createdAt: eventTickets.purchasedAt,
        })
        .from(eventTickets)
        .where(and(
          eq(eventTickets.eventId, input.eventId),
          eq(eventTickets.paymentStatus, "guest"),
        ))
        .orderBy(desc(eventTickets.purchasedAt));

      const total = rows.length;
      const cancelled = rows.filter(r => r.status === "cancelled").length;
      const attended = rows.filter(r => r.status === "used").length;
      const pending = total - cancelled - attended;

      return {
        guests: rows,
        stats: { total, attended, pending, cancelled, notAttended: pending },
      };
    }),

  /** Add a guest to the list — creates ticket + QR + sends invitation email. */
  add: protectedProcedure
    .input(z.object({
      eventId: z.number().int().positive(),
      name: z.string().trim().min(1).max(255),
      email: z.string().trim().email().max(320),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [event] = await db.select().from(events).where(eq(events.id, input.eventId)).limit(1);
      if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      if (!canManageEvent(ctx.user as any, event)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You cannot manage this event's guest list" });
      }

      const email = input.email.trim().toLowerCase();

      // Prevent duplicates: same email already on this event's guest list and not cancelled
      const existing = await db
        .select()
        .from(eventTickets)
        .where(and(
          eq(eventTickets.eventId, input.eventId),
          eq(eventTickets.paymentStatus, "guest"),
          eq(eventTickets.guestEmail, email),
        ))
        .limit(1);

      if (existing.length > 0 && existing[0].status !== "cancelled") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This email is already on the guest list for this event",
        });
      }

      const { id: guestUserId } = await findOrCreateGuestUser(db, input.name, email);

      const ticketCode = generateGuestTicketCode(input.eventId);
      const qrPayload = `TKT-${ticketCode}`;

      let qrDataUrl = "";
      try {
        qrDataUrl = await QRCode.toDataURL(qrPayload, {
          errorCorrectionLevel: "H",
          margin: 1,
          width: 300,
        });
      } catch (e) {
        console.error("[GuestList] QR generation failed:", e);
      }

      const [ticket] = await db.insert(eventTickets).values({
        userId: guestUserId,
        eventId: input.eventId,
        quantity: 1,
        pricePaid: "0.00" as any,
        ticketCode,
        status: "valid",
        paymentStatus: "guest",
        paymentMethod: "guest",
        purchasedAt: new Date(),
        guestName: input.name.trim(),
        guestEmail: email,
        guestAddedBy: ctx.user.id,
      }).returning();

      await db.insert(qrCodes).values({
        itemType: "event",
        itemId: input.eventId,
        userId: guestUserId,
        code: qrPayload,
        qrData: qrDataUrl,
      });

      let emailSent = false;
      try {
        emailSent = await sendGuestInvitationEmail({
          to: email,
          guestName: input.name.trim(),
          event: { title: event.title, eventDate: event.eventDate, venue: event.venue },
          ticketCode,
          qrDataUrl,
        });
      } catch (e) {
        console.error("[GuestList] Email send failed:", e);
      }

      return { ticket, emailSent };
    }),

  /** Remove a guest: cancel ticket, invalidate QR. */
  remove: protectedProcedure
    .input(z.object({ ticketId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [ticket] = await db.select().from(eventTickets).where(eq(eventTickets.id, input.ticketId)).limit(1);
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      if (ticket.paymentStatus !== "guest") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This is not a guest list ticket" });
      }

      const [event] = await db.select().from(events).where(eq(events.id, ticket.eventId)).limit(1);
      if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      if (!canManageEvent(ctx.user as any, event)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You cannot manage this event's guest list" });
      }

      await db.update(eventTickets)
        .set({ status: "cancelled" })
        .where(eq(eventTickets.id, ticket.id));

      // Invalidate the guest's QR for this event (mark used so it's rejected if scanned)
      if (ticket.ticketCode) {
        await db.update(qrCodes)
          .set({ isUsed: true, usedAt: new Date() })
          .where(eq(qrCodes.code, `TKT-${ticket.ticketCode}`));
      }

      return { success: true };
    }),

  /** Resend the invitation email (regenerates QR payload from existing ticket). */
  resend: protectedProcedure
    .input(z.object({ ticketId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [ticket] = await db.select().from(eventTickets).where(eq(eventTickets.id, input.ticketId)).limit(1);
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      if (ticket.paymentStatus !== "guest") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This is not a guest list ticket" });
      }
      if (ticket.status === "cancelled") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot resend — this ticket is cancelled" });
      }
      if (ticket.status === "used") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot resend — this guest already checked in" });
      }

      const [event] = await db.select().from(events).where(eq(events.id, ticket.eventId)).limit(1);
      if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      if (!canManageEvent(ctx.user as any, event)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You cannot manage this event's guest list" });
      }

      if (!ticket.guestEmail || !ticket.ticketCode) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Guest ticket missing email or code" });
      }

      const qrPayload = `TKT-${ticket.ticketCode}`;
      const qrDataUrl = await QRCode.toDataURL(qrPayload, {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 300,
      });

      const emailSent = await sendGuestInvitationEmail({
        to: ticket.guestEmail,
        guestName: ticket.guestName || "Invitado",
        event: { title: event.title, eventDate: event.eventDate, venue: event.venue },
        ticketCode: ticket.ticketCode,
        qrDataUrl,
      });

      return { emailSent };
    }),
});
