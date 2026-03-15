import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { instructors, courses, classes } from "../../drizzle/schema";
import { eq, like, or } from "drizzle-orm";

export const instructorsRouter = router({
  /**
   * List all instructors
   */
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.select().from(instructors);

    return result;
  }),

  /**
   * Get instructor by ID with their courses and classes
   */
  getById: publicProcedure.input(z.number()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [instructor] = await db.select().from(instructors).where(eq(instructors.id, input)).limit(1);
    if (!instructor) return null;

    // Courses taught by this instructor
    const instructorCourses = await db
      .select()
      .from(courses)
      .where(eq(courses.instructorId, input));

    // Classes taught by this instructor
    const instructorClasses = await db
      .select()
      .from(classes)
      .where(eq(classes.instructorId, input));

    return {
      ...instructor,
      courses: instructorCourses,
      classes: instructorClasses,
    };
  }),

  /**
   * Get the instructor profile for the currently logged-in instructor user.
   * Matches by userId first, then falls back to name match.
   */
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "instructor" && ctx.user.role !== "admin" && ctx.user.role !== "promoter") return null;
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Try userId match first (most reliable)
    const [byUserId] = await db
      .select()
      .from(instructors)
      .where(eq(instructors.userId, ctx.user.id))
      .limit(1);
    if (byUserId) return byUserId;

    // Fallback: name match for legacy records
    const userName = ctx.user.name || "";
    if (!userName) return null;
    const [exact] = await db
      .select()
      .from(instructors)
      .where(eq(instructors.name, userName))
      .limit(1);
    if (exact) return exact;

    const [partial] = await db
      .select()
      .from(instructors)
      .where(like(instructors.name, `%${userName}%`))
      .limit(1);
    return partial || null;
  }),

  /**
   * Self-service: instructor/promoter updates their own profile.
   * If no instructor record exists yet, creates one automatically.
   */
  updateMyProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        bio: z.string().optional(),
        photoUrl: z.string().optional(),
        instagramHandle: z.string().optional(),
        websiteUrl: z.string().optional(),
        specialties: z.string().optional(), // JSON array as string, e.g. '["Salsa","Bachata"]'
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "instructor" && ctx.user.role !== "admin" && ctx.user.role !== "promoter") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Find existing record by userId or name
      const [existing] = await db
        .select()
        .from(instructors)
        .where(
          or(
            eq(instructors.userId, ctx.user.id),
            eq(instructors.name, ctx.user.name || "")
          )
        )
        .limit(1);

      if (existing) {
        // Update existing record, also set userId if not set
        await db
          .update(instructors)
          .set({
            userId: ctx.user.id,
            name: input.name,
            bio: input.bio,
            photoUrl: input.photoUrl,
            instagramHandle: input.instagramHandle,
            websiteUrl: input.websiteUrl,
            specialties: input.specialties,
            updatedAt: new Date(),
          })
          .where(eq(instructors.id, existing.id));
        return { id: existing.id, created: false };
      } else {
        // Create new instructor record linked to this user
        const result = await db.insert(instructors).values({
          userId: ctx.user.id,
          name: input.name,
          bio: input.bio,
          photoUrl: input.photoUrl,
          instagramHandle: input.instagramHandle,
          websiteUrl: input.websiteUrl,
          specialties: input.specialties,
        });
        return { id: Number((result as any).insertId), created: true };
      }
    }),

  /**
   * Admin: Create instructor
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        bio: z.string().optional(),
        photoUrl: z.string().optional(),
        instagramHandle: z.string().optional(),
        websiteUrl: z.string().optional(),
        specialties: z.string().optional(), // JSON array as string
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Unauthorized");

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(instructors).values({
        name: input.name,
        bio: input.bio,
        photoUrl: input.photoUrl,
        instagramHandle: input.instagramHandle,
        websiteUrl: input.websiteUrl,
        specialties: input.specialties,
      });

      return result;
    }),

  /**
   * Admin: Update instructor
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        bio: z.string().optional(),
        photoUrl: z.string().optional(),
        instagramHandle: z.string().optional(),
        websiteUrl: z.string().optional(),
        specialties: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Unauthorized");

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;
      const result = await db.update(instructors).set({
        ...updateData,
        updatedAt: new Date(),
      }).where(eq(instructors.id, id));

      return result;
    }),

  /**
   * Admin: Delete instructor
   */
  delete: protectedProcedure.input(z.number()).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new Error("Unauthorized");

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.delete(instructors).where(eq(instructors.id, input));

    return result;
  }),
});
