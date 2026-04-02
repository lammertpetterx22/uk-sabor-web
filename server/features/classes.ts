import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { classes, classPurchases, instructors, classInstructors } from "../../drizzle/schema";
import { getAllRoles } from "../../drizzle/schema";
import { eq, desc, gte, and } from "drizzle-orm";
import { canCreateClass } from "../stripe/plans";

// Uses getAllRoles() to support multi-role users
function hasCreatorRole(user: { role: string; roles?: string | null }): boolean {
  const all = getAllRoles(user as any);
  return all.some(r => r === "admin" || r === "instructor" || r === "promoter");
}

function isAdminRole(user: { role: string; roles?: string | null }): boolean {
  return getAllRoles(user as any).includes("admin");
}

// Resolve the instructor profile linked to a user (by userId, robust lookup)
async function getInstructorForUser(db: any, userId: number) {
  const [byUserId] = await db
    .select()
    .from(instructors)
    .where(eq(instructors.userId, userId))
    .limit(1);
  return byUserId ?? null;
}

export const classesRouter = router({
  /**
   * List all published upcoming classes
   */
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        instructorId: z.number().optional(),
        level: z.enum(["beginner", "intermediate", "advanced", "all-levels"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [eq(classes.status, "published"), gte(classes.classDate, new Date())];
      if (input.instructorId) {
        conditions.push(eq(classes.instructorId, input.instructorId));
      }
      if (input.level) {
        conditions.push(eq(classes.level, input.level));
      }

      const result = await db
        .select()
        .from(classes)
        .where(and(...(conditions as any)))
        .orderBy(desc(classes.classDate))
        .limit(input.limit)
        .offset(input.offset);

      return result;
    }),

  /**
   * Admin: List all classes (all statuses, no date filter)
   * Instructors: List only their own classes
   */
  listAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(100),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!hasCreatorRole(ctx.user)) throw new Error("Unauthorized");
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (isAdminRole(ctx.user)) {
        return db
          .select()
          .from(classes)
          .orderBy(desc(classes.classDate))
          .limit(input.limit)
          .offset(input.offset);
      }

      // Non-admin: only see their own classes
      const instructor = await getInstructorForUser(db, ctx.user.id);
      if (!instructor) return [];

      return db
        .select()
        .from(classes)
        .where(eq(classes.instructorId, instructor.id))
        .orderBy(desc(classes.classDate))
        .limit(input.limit)
        .offset(input.offset);
    }),

  /**
   * Get class by ID
   */
  getById: publicProcedure.input(z.number()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.select().from(classes).where(eq(classes.id, input)).limit(1);

    return result[0] || null;
  }),

  /**
   * Get user's purchased classes
   */
  getUserPurchases: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .select()
      .from(classPurchases)
      .where(eq(classPurchases.userId, ctx.user.id));

    return result;
  }),

  /**
   * Check if user has access to class
   */
  hasAccess: protectedProcedure.input(z.number()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .select()
      .from(classPurchases)
      .where(and(eq(classPurchases.userId, ctx.user.id), eq(classPurchases.classId, input)))
      .limit(1);

    return result.length > 0;
  }),

  /**
   * Create class — instructor/promoter (via multi-role) or admin, with entitlement check
   */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        instructorId: z.number(),
        price: z.string().min(1),
        danceStyle: z.string().optional(),
        level: z.enum(["beginner", "intermediate", "advanced", "all-levels"]).default("all-levels"),
        classDate: z.string().min(1),
        duration: z.number().optional(),
        maxParticipants: z.number().optional(),
        imageUrl: z.string().optional(),
        videoUrl: z.string().optional(),
        hasSocial: z.boolean().optional(),
        socialTime: z.string().optional(),
        socialLocation: z.string().optional(),
        socialDescription: z.string().optional(),
        paymentMethod: z.enum(["online", "cash", "both"]).default("online"),
        materialsUrl: z.string().optional(),
        materialsFileName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!hasCreatorRole(ctx.user)) throw new Error("Unauthorized");

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Entitlement check for non-admin creators
      if (!isAdminRole(ctx.user)) {
        const instructor = await getInstructorForUser(db, ctx.user.id);
        const totalClasses = instructor
          ? (await db.select().from(classes).where(eq(classes.instructorId, instructor.id))).length
          : 0;
        const entitlement = canCreateClass(ctx.user.subscriptionPlan, totalClasses);
        if (!entitlement.allowed) {
          throw new Error(entitlement.reason ?? "Plan limit reached");
        }
      }

      // Determine payment method flags based on paymentMethod
      const allowCashPayment = input.paymentMethod === "cash" || input.paymentMethod === "both";
      const allowOnlinePayment = input.paymentMethod === "online" || input.paymentMethod === "both";

      const result = await db.insert(classes).values({
        title: input.title,
        description: input.description,
        instructorId: input.instructorId,
        price: input.price as any,
        danceStyle: input.danceStyle,
        level: input.level,
        classDate: new Date(input.classDate),
        duration: input.duration,
        maxParticipants: input.maxParticipants,
        imageUrl: input.imageUrl,
        videoUrl: input.videoUrl,
        hasSocial: input.hasSocial || false,
        socialTime: input.socialTime,
        socialLocation: input.socialLocation,
        socialDescription: input.socialDescription,
        paymentMethod: input.paymentMethod,
        allowCashPayment,
        allowOnlinePayment,
        materialsUrl: input.materialsUrl,
        materialsFileName: input.materialsFileName,
        status: "published",
      });

      return result;
    }),

  /**
   * Update class — admin can update any; others only their own
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        instructorId: z.number().optional(),
        price: z.string().optional(),
        danceStyle: z.string().optional(),
        level: z.enum(["beginner", "intermediate", "advanced", "all-levels"]).optional(),
        classDate: z.string().optional(),
        duration: z.number().optional(),
        maxParticipants: z.number().optional(),
        imageUrl: z.string().optional(),
        videoUrl: z.string().optional(),
        status: z.enum(["draft", "published", "cancelled", "completed"]).optional(),
        hasSocial: z.boolean().optional(),
        socialTime: z.string().optional(),
        socialLocation: z.string().optional(),
        socialDescription: z.string().optional(),
        paymentMethod: z.enum(["online", "cash", "both"]).optional(),
        materialsUrl: z.string().optional(),
        materialsFileName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!hasCreatorRole(ctx.user)) throw new Error("Unauthorized");

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Non-admin can only update their own classes (userId-based lookup)
      if (!isAdminRole(ctx.user)) {
        const instructor = await getInstructorForUser(db, ctx.user.id);
        if (!instructor) throw new Error("Instructor profile not found");
        const [classRecord] = await db.select().from(classes).where(eq(classes.id, input.id)).limit(1);
        if (!classRecord || classRecord.instructorId !== instructor.id)
          throw new Error("You do not have permission to edit this class");
      }

      const { id, classDate, ...rest } = input;
      const updateData: Record<string, any> = { ...rest };
      if (classDate) updateData.classDate = new Date(classDate);

      // Update payment method flags if paymentMethod is being changed
      if (input.paymentMethod) {
        updateData.allowCashPayment = input.paymentMethod === "cash" || input.paymentMethod === "both";
        updateData.allowOnlinePayment = input.paymentMethod === "online" || input.paymentMethod === "both";
      }

      const result = await db.update(classes).set(updateData).where(eq(classes.id, id));

      return result;
    }),

  /**
   * Delete class — admin can delete any; others only their own
   */
  delete: protectedProcedure.input(z.number()).mutation(async ({ ctx, input }) => {
    if (!hasCreatorRole(ctx.user)) throw new Error("Unauthorized");

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Non-admin can only delete their own classes (userId-based lookup)
    if (!isAdminRole(ctx.user)) {
      const instructor = await getInstructorForUser(db, ctx.user.id);
      if (!instructor) throw new Error("Instructor profile not found");
      const [classRecord] = await db.select().from(classes).where(eq(classes.id, input)).limit(1);
      if (!classRecord || classRecord.instructorId !== instructor.id)
        throw new Error("You do not have permission to delete this class");
    }

    // Also delete co-instructor records
    await db.delete(classInstructors).where(eq(classInstructors.classId, input));
    const result = await db.delete(classes).where(eq(classes.id, input));

    return result;
  }),

  /**
   * Get co-instructors for a class
   */
  getCoInstructors: publicProcedure.input(z.number()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .select({
        id: classInstructors.id,
        classId: classInstructors.classId,
        instructorId: classInstructors.instructorId,
        role: classInstructors.role,
        name: instructors.name,
        bio: instructors.bio,
        photoUrl: instructors.photoUrl,
        specialties: instructors.specialties,
      })
      .from(classInstructors)
      .innerJoin(instructors, eq(classInstructors.instructorId, instructors.id))
      .where(eq(classInstructors.classId, input));

    return result;
  }),

  /**
   * Add co-instructor to a class (admin only)
   */
  addCoInstructor: protectedProcedure
    .input(z.object({
      classId: z.number(),
      instructorId: z.number(),
      role: z.enum(["lead", "assistant"]).default("assistant"),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdminRole(ctx.user)) throw new Error("Only admins can manage co-instructors");
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if already added
      const existing = await db
        .select()
        .from(classInstructors)
        .where(and(eq(classInstructors.classId, input.classId), eq(classInstructors.instructorId, input.instructorId)))
        .limit(1);
      if (existing.length > 0) throw new Error("Instructor already added to this class");

      const result = await db.insert(classInstructors).values({
        classId: input.classId,
        instructorId: input.instructorId,
        role: input.role,
      });

      return result;
    }),

  /**
   * Remove co-instructor from a class (admin only)
   */
  removeCoInstructor: protectedProcedure
    .input(z.object({
      classId: z.number(),
      instructorId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isAdminRole(ctx.user)) throw new Error("Only admins can manage co-instructors");
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .delete(classInstructors)
        .where(and(eq(classInstructors.classId, input.classId), eq(classInstructors.instructorId, input.instructorId)));

      return result;
    }),

  /**
   * Create cash reservation for class (user reserves spot, pays at door)
   */
  createCashReservation: protectedProcedure
    .input(z.object({
      classId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // 1. Get class details
      const [classRecord] = await db.select()
        .from(classes)
        .where(eq(classes.id, input.classId))
        .limit(1);

      if (!classRecord) {
        throw new Error("Class not found");
      }

      // 2. Verify class allows cash payment
      if (!classRecord.allowCashPayment && classRecord.paymentMethod !== "cash" && classRecord.paymentMethod !== "both") {
        throw new Error("This class requires online payment");
      }

      // 3. Check if class is published
      if (classRecord.status !== "published") {
        throw new Error("This class is not available for booking");
      }

      // 4. Check if user already purchased this class
      const existingPurchase = await db.select()
        .from(classPurchases)
        .where(and(
          eq(classPurchases.userId, ctx.user.id),
          eq(classPurchases.classId, input.classId)
        ))
        .limit(1);

      if (existingPurchase.length > 0) {
        throw new Error("You already have access to this class");
      }

      // 5. Check if there are spots available
      if (classRecord.maxParticipants && (classRecord.currentParticipants ?? 0) >= classRecord.maxParticipants) {
        throw new Error("This class is full");
      }

      // 6. Generate unique access code
      const accessCode = `CASH-${classRecord.id}-${ctx.user.id}-${Date.now()}`;

      // 7. Create purchase with pending_cash status
      const [purchase] = await db.insert(classPurchases).values({
        userId: ctx.user.id,
        classId: input.classId,
        instructorId: classRecord.instructorId,
        pricePaid: classRecord.price,
        accessCode,
        status: "active",
        paymentStatus: "pending_cash",
        paymentMethod: "cash",
        reservedAt: new Date(),
        purchasedAt: new Date(),
      }).returning();

      // 8. Update participant count
      const { sql } = await import("drizzle-orm");
      await db.update(classes)
        .set({ currentParticipants: sql`${classes.currentParticipants} + 1` })
        .where(eq(classes.id, input.classId));

      // 9. Generate QR code
      const QRCode = await import("qrcode");
      const { qrCodes } = await import("../../drizzle/schema");

      const qrCodeValue = `class-${classRecord.id}-user-${ctx.user.id}-purchase-${purchase.id}`;
      const qrDataUrl = await QRCode.toDataURL(qrCodeValue, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 300
      });

      await db.insert(qrCodes).values({
        code: qrCodeValue,
        itemType: 'class',
        itemId: classRecord.id,
        userId: ctx.user.id,
        qrData: qrDataUrl,
      });

      console.log(`[CashReservation] ✅ Reservation created for user ${ctx.user.id} for class ${classRecord.id}`);

      return {
        success: true,
        purchaseId: purchase.id,
        accessCode: purchase.accessCode,
        qrCode: qrDataUrl,
        classTitle: classRecord.title,
        classDate: classRecord.classDate,
        price: classRecord.price,
        paymentInstructions: classRecord.cashPaymentInstructions || `Bring ${classRecord.price} in cash to the class`,
      };
    }),
});
