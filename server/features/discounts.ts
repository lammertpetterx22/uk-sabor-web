import { z } from "zod";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { discountCodes } from "../../drizzle/schema";
import { eq, sql, and } from "drizzle-orm";

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

      // Check item scoping
      if (dc.eventId) {
        if (!input.items.some(i => i.type === "event" && i.id === dc.eventId))
          return { valid: false as const, error: "This code is for a specific event only" };
      }
      if (dc.classId) {
        if (!input.items.some(i => i.type === "class" && i.id === dc.classId))
          return { valid: false as const, error: "This code is for a specific class only" };
      }
      if (dc.courseId) {
        if (!input.items.some(i => i.type === "course" && i.id === dc.courseId))
          return { valid: false as const, error: "This code is for a specific course only" };
      }

      const cartTotal = input.items.reduce((s, i) => s + i.price * (i.quantity || 1), 0);
      const discountValue = parseFloat(String(dc.discountValue));

      let discountAmount: number;
      if (dc.discountType === "percentage") {
        discountAmount = Math.round(cartTotal * (discountValue / 100) * 100) / 100;
      } else {
        discountAmount = Math.min(discountValue, cartTotal);
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
      maxUses: z.number().int().positive().optional(),
      expiresAt: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const values: Record<string, any> = {
        code: input.code.trim().toUpperCase(),
        discountType: input.discountType,
        discountValue: String(input.discountValue),
        createdBy: ctx.user.id,
      };
      if (input.eventId) values.eventId = input.eventId;
      if (input.classId) values.classId = input.classId;
      if (input.courseId) values.courseId = input.courseId;
      if (input.maxUses) values.maxUses = input.maxUses;
      if (input.expiresAt) values.expiresAt = new Date(input.expiresAt);

      const [created] = await db.insert(discountCodes).values(values).returning();

      return created;
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

  /** Admin: deactivate a code */
  deactivate: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(discountCodes).set({ active: false }).where(eq(discountCodes.id, input.id));
      return { success: true };
    }),
});
