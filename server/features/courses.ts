import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { courses, coursePurchases, instructors } from "../../drizzle/schema";
import { getAllRoles } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

// Uses getAllRoles() to support multi-role users
function isAdminRole(user: { role: string; roles?: string | null }): boolean {
  return getAllRoles(user as any).includes("admin");
}

// Courses are creator-centered — instructors, promoters, and admins can create courses
function isInstructorOrAdmin(user: { role: string; roles?: string | null }): boolean {
  const all = getAllRoles(user as any);
  return all.some(r => r === "admin" || r === "instructor" || r === "promoter");
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

export const coursesRouter = router({
  /**
   * List all published courses
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

      const conditions = [eq(courses.status, "published")];
      if (input.instructorId) {
        conditions.push(eq(courses.instructorId, input.instructorId));
      }
      if (input.level) {
        conditions.push(eq(courses.level, input.level));
      }

      const result = await db
        .select()
        .from(courses)
        .where(and(...(conditions as any)))
        .orderBy(desc(courses.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return result;
    }),

  /**
   * List all courses for management (admin sees all, instructors see own)
   */
  listAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(100),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!isInstructorOrAdmin(ctx.user)) throw new Error("Unauthorized — course management requires instructor or admin role");
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (isAdminRole(ctx.user)) {
        return db
          .select()
          .from(courses)
          .orderBy(desc(courses.createdAt))
          .limit(input.limit)
          .offset(input.offset);
      }

      // Instructor: only see their own courses (userId-based lookup)
      const instructor = await getInstructorForUser(db, ctx.user.id);
      if (!instructor) return [];

      return db
        .select()
        .from(courses)
        .where(eq(courses.instructorId, instructor.id))
        .orderBy(desc(courses.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),

  /**
   * Get course by ID
   */
  getById: publicProcedure.input(z.number()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.select().from(courses).where(eq(courses.id, input)).limit(1);

    return result[0] || null;
  }),

  /**
   * Get user's purchased courses
   */
  getUserPurchases: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .select()
      .from(coursePurchases)
      .where(eq(coursePurchases.userId, ctx.user.id));

    return result;
  }),

  /**
   * Check if user has access to course
   */
  hasAccess: protectedProcedure.input(z.number()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .select()
      .from(coursePurchases)
      .where(and(eq(coursePurchases.userId, ctx.user.id), eq(coursePurchases.courseId, input)))
      .limit(1);

    return result.length > 0;
  }),

  /**
   * Update course progress
   */
  updateProgress: protectedProcedure
    .input(
      z.object({
        courseId: z.number(),
        progress: z.number().min(0).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .update(coursePurchases)
        .set({
          progress: input.progress,
          completed: input.progress === 100 ? true : false,
          completedAt: input.progress === 100 ? new Date() : null,
        })
        .where(and(eq(coursePurchases.userId, ctx.user.id), eq(coursePurchases.courseId, input.courseId)));

      return result;
    }),

  /**
   * Create course — instructors and admins only (not promoters)
   */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        videoUrl: z.string().optional(),
        instructorId: z.number(),
        price: z.string().min(1),
        level: z.enum(["beginner", "intermediate", "advanced", "all-levels"]).default("all-levels"),
        danceStyle: z.string().optional(),
        duration: z.string().optional(),
        lessonsCount: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!isInstructorOrAdmin(ctx.user)) throw new Error("Unauthorized — only instructors and admins can create courses");

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(courses).values({
        title: input.title,
        description: input.description,
        imageUrl: input.imageUrl,
        videoUrl: input.videoUrl,
        instructorId: input.instructorId,
        price: input.price as any,
        level: input.level,
        danceStyle: input.danceStyle,
        duration: input.duration,
        lessonsCount: input.lessonsCount,
        status: "published",
      });

      return result;
    }),

  /**
   * Update course — instructors only edit their own (by userId), admins edit all
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        videoUrl: z.string().optional(),
        instructorId: z.number().optional(),
        price: z.string().optional(),
        level: z.enum(["beginner", "intermediate", "advanced", "all-levels"]).optional(),
        danceStyle: z.string().optional(),
        duration: z.string().optional(),
        lessonsCount: z.number().optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!isInstructorOrAdmin(ctx.user)) throw new Error("Unauthorized — only instructors and admins can update courses");

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Non-admin: only edit their own courses (userId-based lookup — no name fallback)
      if (!isAdminRole(ctx.user)) {
        const instructor = await getInstructorForUser(db, ctx.user.id);
        if (!instructor) throw new Error("Instructor profile not found. Please contact support.");
        const [course] = await db.select().from(courses).where(eq(courses.id, input.id)).limit(1);
        if (!course || course.instructorId !== instructor.id)
          throw new Error("You do not have permission to edit this course");
      }

      const { id, ...updateData } = input;
      const result = await db.update(courses).set(updateData).where(eq(courses.id, id));

      return result;
    }),

  /**
   * Delete course — instructors only delete their own, admins delete all
   */
  delete: protectedProcedure.input(z.number()).mutation(async ({ ctx, input }) => {
    if (!isInstructorOrAdmin(ctx.user)) throw new Error("Unauthorized — only instructors and admins can delete courses");

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Non-admin: only delete their own courses  (userId-based lookup — no name fallback)
    if (!isAdminRole(ctx.user)) {
      const instructor = await getInstructorForUser(db, ctx.user.id);
      if (!instructor) throw new Error("Instructor profile not found. Please contact support.");
      const [course] = await db.select().from(courses).where(eq(courses.id, input)).limit(1);
      if (!course || course.instructorId !== instructor.id)
        throw new Error("You do not have permission to delete this course");
    }

    const result = await db.delete(courses).where(eq(courses.id, input));

    return result;
  }),
});
