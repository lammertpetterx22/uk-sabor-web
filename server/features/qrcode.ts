import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { qrCodes, attendance, events, classes, users, eventTickets, classPurchases } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import QRCode from "qrcode";

// Generate a unique QR code identifier
function generateQRCode(): string {
  return crypto.randomBytes(16).toString("hex");
}

// Generate QR data (JSON with event/class info)
function generateQRData(itemType: "event" | "class", itemId: number, code: string) {
  return JSON.stringify({
    type: itemType,
    itemId,
    code,
    timestamp: new Date().toISOString(),
  });
}

export const qrcodeRouter = router({
  // Generate QR code for an event or class
  generateQRCode: protectedProcedure
    .input(
      z.object({
        itemType: z.enum(["event", "class"]),
        itemId: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if user is admin or instructor
      if (ctx.user.role !== "admin" && ctx.user.role !== "instructor") {
        throw new Error("Only admins and instructors can generate QR codes");
      }

      // Verify the item exists and user has permission
      if (input.itemType === "event") {
        const eventResult = await db
          .select()
          .from(events)
          .where(eq(events.id, input.itemId))
          .limit(1);
        if (!eventResult[0]) throw new Error("Event not found");
      } else {
        const classResult = await db
          .select()
          .from(classes)
          .where(eq(classes.id, input.itemId))
          .limit(1);
        if (!classResult[0]) throw new Error("Class not found");
        // For instructors, verify they own the class
        if (ctx.user.role === "instructor") {
          // TODO: Add instructor ownership check when instructor-class relation is added
        }
      }

      // Check if QR code already exists
      const existing = await db
        .select()
        .from(qrCodes)
        .where(
          and(
            eq(qrCodes.itemType, input.itemType),
            eq(qrCodes.itemId, input.itemId)
          )
        )
        .limit(1);
      const existingQR = existing[0];

      if (existingQR) {
        return existingQR;
      }

      // Generate new QR code
      const code = generateQRCode();
      const qrData = generateQRData(input.itemType, input.itemId, code);

      const result = await db.insert(qrCodes).values({
        code,
        itemType: input.itemType,
        itemId: input.itemId,
        qrData,
      });

      return {
        id: result[0],
        code,
        itemType: input.itemType,
        itemId: input.itemId,
        qrData,
      };
    }),

  // Get QR code for an event or class
  getQRCode: publicProcedure
    .input(
      z.object({
        itemType: z.enum(["event", "class"]),
        itemId: z.number().int().positive(),
      })
    )
    .query(async ({ input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const qrResult = await db
        .select()
        .from(qrCodes)
        .where(
          and(
            eq(qrCodes.itemType, input.itemType),
            eq(qrCodes.itemId, input.itemId)
          )
        )
        .limit(1);
      const qr = qrResult[0];

      return qr || null;
    }),

  // Check in a user by scanning QR code
  checkIn: protectedProcedure
    .input(
      z.object({
        qrCode: z.string().min(1),
        userId: z.number().int().positive().optional(), // For admin checking in others
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Find the QR code
      const qrResult = await db
        .select()
        .from(qrCodes)
        .where(eq(qrCodes.code, input.qrCode))
        .limit(1);
      const qr = qrResult[0];

      if (!qr) {
        throw new Error("QR code no válido");
      }

      // Block re-use: if QR already scanned, reject immediately
      if (qr.isUsed) {
        const usedAtStr = qr.usedAt ? new Date(qr.usedAt).toLocaleString("es-GB") : "anteriormente";
        throw new Error(`Este QR ya fue usado el ${usedAtStr}. Cada QR es de un solo uso.`);
      }

      // For personal QR codes (with userId), use the QR's owner.
      // For venue QR codes (no userId), use the provided userId or the scanner.
      const userId = qr.userId ?? input.userId ?? ctx.user.id;

      // Verify the scanner has permission:
      // - Admins/instructors can check in anyone
      // - Regular users can only check in themselves via their own personal QR
      if (ctx.user.role !== "admin" && ctx.user.role !== "instructor") {
        if (qr.userId && qr.userId !== ctx.user.id) {
          throw new Error("Este QR pertenece a otro usuario");
        }
      }

      // Check if user already checked in (double safety check)
      const existingAttendance = await db
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.userId, userId),
            eq(attendance.itemType, qr.itemType),
            eq(attendance.itemId, qr.itemId)
          )
        )
        .limit(1);
      const existing = existingAttendance[0];

      if (existing) {
        throw new Error("Esta persona ya ha hecho check-in en este evento/clase");
      }

      // Mark QR as used (single-use enforcement)
      await db.update(qrCodes)
        .set({ isUsed: true, usedAt: new Date() })
        .where(eq(qrCodes.id, qr.id));

      // Record attendance
      const result = await db.insert(attendance).values({
        userId,
        itemType: qr.itemType,
        itemId: qr.itemId,
        qrCodeId: qr.id,
        checkedInBy: ctx.user.id,
      });

      // Get user name and email for the response
      const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const attendeeUser = userResult[0];
      const userName = attendeeUser?.name || attendeeUser?.email || "Unknown";

      // Get item title for the response
      let itemTitle = "";
      if (qr.itemType === "event") {
        const eventResult = await db.select({ title: events.title }).from(events).where(eq(events.id, qr.itemId)).limit(1);
        itemTitle = eventResult[0]?.title || "";
      } else {
        const classResult = await db.select({ title: classes.title }).from(classes).where(eq(classes.id, qr.itemId)).limit(1);
        itemTitle = classResult[0]?.title || "";
      }

      return {
        id: (result as any).insertId,
        userId,
        userName,
        userEmail: attendeeUser?.email || "",
        itemType: qr.itemType,
        itemId: qr.itemId,
        itemTitle,
        checkedInAt: new Date(),
      };
    }),

  // Get attendance for an event or class
  getAttendance: protectedProcedure
    .input(
      z.object({
        itemType: z.enum(["event", "class"]),
        itemId: z.number().int().positive(),
      })
    )
    .query(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Only admin and instructors can view attendance
      if (ctx.user.role !== "admin" && ctx.user.role !== "instructor") {
        throw new Error("Only admins and instructors can view attendance");
      }

      const records = await db
        .select({
          id: attendance.id,
          userId: attendance.userId,
          userName: users.name,
          userEmail: users.email,
          checkedInAt: attendance.checkedInAt,
          checkedInBy: attendance.checkedInBy,
        })
        .from(attendance)
        .leftJoin(users, eq(attendance.userId, users.id))
        .where(
          and(
            eq(attendance.itemType, input.itemType),
            eq(attendance.itemId, input.itemId)
          )
        );

      return records;
    }),

  // Get user's check-in history
  getUserCheckInHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const records = await db
        .select({
          id: attendance.id,
          itemType: attendance.itemType,
          itemId: attendance.itemId,
          checkedInAt: attendance.checkedInAt,
        })
        .from(attendance)
        .where(eq(attendance.userId, ctx.user.id))
        .limit(input.limit)
        .offset(input.offset);

      return records;
    }),

  // Get personal QR codes for the logged-in user (for dashboard display)
  // Auto-generates missing QR codes for purchases that don't have one yet
  getUserQRCodes: protectedProcedure
    .query(async ({ ctx }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // First, ensure all purchases have QR codes (auto-generate missing ones)
      try {
        // Check class purchases without QR codes
        const userClassPurchases = await db.select().from(classPurchases).where(eq(classPurchases.userId, ctx.user.id));
        for (const purchase of userClassPurchases) {
          if (!purchase.orderId) continue;
          const [existingQR] = await db.select().from(qrCodes)
            .where(and(eq(qrCodes.userId, ctx.user.id), eq(qrCodes.orderId, purchase.orderId))).limit(1);
          if (!existingQR) {
            const qrValue = `class-${purchase.classId}-user-${ctx.user.id}-order-${purchase.orderId}`;
            const qrDataUrl = await QRCode.toDataURL(qrValue, { errorCorrectionLevel: 'H', margin: 1, width: 300 });
            await db.insert(qrCodes).values({
              code: qrValue,
              itemType: 'class',
              itemId: purchase.classId,
              userId: ctx.user.id,
              orderId: purchase.orderId,
              qrData: qrDataUrl,
            });
          }
        }
        // Check event tickets without QR codes
        const userEventTickets = await db.select().from(eventTickets).where(eq(eventTickets.userId, ctx.user.id));
        for (const ticket of userEventTickets) {
          if (!ticket.orderId) continue;
          const [existingQR] = await db.select().from(qrCodes)
            .where(and(eq(qrCodes.userId, ctx.user.id), eq(qrCodes.orderId, ticket.orderId))).limit(1);
          if (!existingQR) {
            const qrValue = `event-${ticket.eventId}-user-${ctx.user.id}-order-${ticket.orderId}`;
            const qrDataUrl = await QRCode.toDataURL(qrValue, { errorCorrectionLevel: 'H', margin: 1, width: 300 });
            await db.insert(qrCodes).values({
              code: qrValue,
              itemType: 'event',
              itemId: ticket.eventId,
              userId: ctx.user.id,
              orderId: ticket.orderId,
              qrData: qrDataUrl,
            });
          }
        }
      } catch (autoGenError) {
        console.error('[QR] Auto-generation error (non-fatal):', autoGenError);
      }

      // Return all QR codes for this user
      const userQRs = await db
        .select()
        .from(qrCodes)
        .where(eq(qrCodes.userId, ctx.user.id));

      return userQRs;
    }),

  // Get attendance count for an event or class
  getAttendanceCount: publicProcedure
    .input(
      z.object({
        itemType: z.enum(["event", "class"]),
        itemId: z.number().int().positive(),
      })
    )
    .query(async ({ input }: any) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.itemType, input.itemType),
            eq(attendance.itemId, input.itemId)
          )
        );

      return result.length;
    }),
});
