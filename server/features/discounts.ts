import { z } from "zod";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { discountCodes } from "../../drizzle/schema";
import { eq, sql, and } from "drizzle-orm";
import postgres from "postgres";

export const discountRouter = router({
  /** Validate a discount code against the current cart */
  validate: publicProcedure
    .input(z.object({
      code: z.string().min(1).max(50),
      items: z.array(z.object({
        type: z.enum(["course", "class", "event"]),
        id: z.number(),
        price: z.number(),
        quantity: z.number().optional(),
        tierId: z.number().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const normalized = input.code.trim().toUpperCase();

      const [dc] = await db.select().from(discountCodes)
        .where(eq(discountCodes.code, normalized)).limit(1);

      if (!dc) return { valid: false as const, error: "Invalid discount code" };
      if (!dc.active) return { valid: false as const, error: "This code is no longer active" };
      if (dc.expiresAt && new Date(dc.expiresAt) < new Date())
        return { valid: false as const, error: "This code has expired" };
      if (dc.maxUses && dc.usesCount >= dc.maxUses)
        return { valid: false as const, error: "This code has reached its usage limit" };

      // Figure out which cart items the code applies to. A code scoped to an
      // event tier only matches items buying that specific tier; otherwise it
      // matches by event/class/course id as before.
      const eventTierId = (dc as any).eventTierId as number | null;
      const classTierId = (dc as any).classTierId as number | null;

      const matches = (i: { type: string; id: number; tierId?: number }) => {
        if (dc.eventId && i.type === "event" && i.id === dc.eventId) {
          if (eventTierId != null && i.tierId !== eventTierId) return false;
          return true;
        }
        if (dc.classId && i.type === "class" && i.id === dc.classId) {
          if (classTierId != null && i.tierId !== classTierId) return false;
          return true;
        }
        if (dc.courseId && i.type === "course" && i.id === dc.courseId) return true;
        // Global code (no parent set): applies to everything.
        if (!dc.eventId && !dc.classId && !dc.courseId) return true;
        return false;
      };

      const applicable = input.items.filter(matches);
      if (applicable.length === 0) {
        if (eventTierId != null) return { valid: false as const, error: "This code is for a specific ticket type only" };
        if (classTierId != null) return { valid: false as const, error: "This code is for a specific ticket type only" };
        if (dc.eventId) return { valid: false as const, error: "This code is for a specific event only" };
        if (dc.classId) return { valid: false as const, error: "This code is for a specific class only" };
        if (dc.courseId) return { valid: false as const, error: "This code is for a specific course only" };
        return { valid: false as const, error: "This code doesn't apply to your cart" };
      }

      const applicableTotal = applicable.reduce((s, i) => s + i.price * (i.quantity || 1), 0);
      const discountValue = parseFloat(String(dc.discountValue));

      let discountAmount: number;
      if (dc.discountType === "percentage") {
        discountAmount = Math.round(applicableTotal * (discountValue / 100) * 100) / 100;
      } else {
        discountAmount = Math.min(discountValue, applicableTotal);
      }

      return {
        valid: true as const,
        code: dc.code,
        discountType: dc.discountType,
        discountValue,
        discountAmount,
        description: dc.discountType === "percentage"
          ? `${discountValue}% off`
          : `£${discountValue.toFixed(2)} off`,
      };
    }),

  /** Admin: create a discount code */
  create: adminProcedure
    .input(z.object({
      code: z.string().min(1).max(50),
      discountType: z.enum(["percentage", "fixed"]),
      discountValue: z.number().positive(),
      eventId: z.number().optional(),
      classId: z.number().optional(),
      courseId: z.number().optional(),
      // Optional: scope the code to a single ticket tier within the
      // event/class. Requires the parent eventId/classId to be set too.
      eventTierId: z.number().optional(),
      classTierId: z.number().optional(),
      maxUses: z.number().int().positive().optional(),
      expiresAt: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const pgSql = postgres(process.env.DATABASE_URL!);
      try {
        const code = input.code.trim().toUpperCase();

        // If an inactive code with the same name exists, remove it first so
        // the user can "recycle" codes after deactivating them.
        const existingRows = await pgSql`
          SELECT "id", "active" FROM "discountCodes" WHERE "code" = ${code} LIMIT 1
        `;
        if (existingRows.length > 0) {
          const existing = existingRows[0] as { id: number; active: boolean };
          if (existing.active) {
            throw new Error(`El código "${code}" ya existe y está activo. Desactívalo primero o usa otro nombre.`);
          }
          // Inactive duplicate — purge it so we can re-create fresh
          await pgSql`DELETE FROM "discountCodes" WHERE "id" = ${existing.id}`;
        }

        const [created] = await pgSql`
          INSERT INTO "discountCodes" ("code", "discountType", "discountValue", "eventId", "classId", "courseId", "eventTierId", "classTierId", "maxUses", "usesCount", "active", "expiresAt", "createdBy", "createdAt")
          VALUES (${code}, ${input.discountType}, ${input.discountValue}, ${input.eventId ?? null}, ${input.classId ?? null}, ${input.courseId ?? null}, ${input.eventTierId ?? null}, ${input.classTierId ?? null}, ${input.maxUses ?? null}, ${0}, ${true}, ${input.expiresAt ? new Date(input.expiresAt) : null}, ${ctx.user.id}, ${new Date()})
          RETURNING *
        `;
        return created;
      } finally {
        await pgSql.end();
      }
    }),

  /** Admin: list all discount codes */
  list: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(discountCodes);
  }),

  /** List discount codes for a specific item */
  listByItem: protectedProcedure
    .input(z.object({
      itemType: z.enum(["event", "course", "class"]),
      itemId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const col = input.itemType === "event" ? discountCodes.eventId
        : input.itemType === "course" ? discountCodes.courseId
        : discountCodes.classId;

      return db.select().from(discountCodes).where(eq(col, input.itemId));
    }),

  /**
   * Admin: delete a discount code. Frees the code name so it can be re-created.
   * (Historical `usesCount` is lost — past orders that used the code are unaffected
   * because they store the code name in their own metadata, not as a FK to this row.)
   */
  deactivate: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(discountCodes).where(eq(discountCodes.id, input.id));
      return { success: true };
    }),
});
