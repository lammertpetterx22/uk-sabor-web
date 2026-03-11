import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { lessons, lessonProgress, coursePurchases } from "../../drizzle/schema";
import { eq, and, asc } from "drizzle-orm";

// ─── Lessons Router ───────────────────────────────────────────────────────────

export const lessonsRouter = router({
    /**
     * Get all lessons for a course.
     * Preview lessons are visible to everyone.
     * Full lesson list is only returned to users who purchased the course.
     */
    getByCourseId: publicProcedure
        .input(z.number().positive())
        .query(async ({ input: courseId, ctx }) => {
            const db = await getDb();
            if (!db) throw new Error("Database not available");

            const allLessons = await db
                .select()
                .from(lessons)
                .where(eq(lessons.courseId, courseId))
                .orderBy(asc(lessons.position));

            // If not authenticated → only preview lessons (no videoUrl exposed)
            if (!ctx.user) {
                return allLessons.map(l => ({
                    ...l,
                    videoUrl: l.isPreview ? l.videoUrl : null,
                    locked: !l.isPreview,
                }));
            }

            // Check purchase
            const [purchase] = await db
                .select()
                .from(coursePurchases)
                .where(and(eq(coursePurchases.userId, ctx.user.id), eq(coursePurchases.courseId, courseId)))
                .limit(1);

            const hasPurchased = !!purchase;

            return allLessons.map(l => ({
                ...l,
                videoUrl: hasPurchased || l.isPreview ? l.videoUrl : null,
                locked: !hasPurchased && !l.isPreview,
            }));
        }),

    /**
     * Get progress for all lessons in a course for the current user.
     * Returns a map of lessonId → { watchPercent, completed }.
     */
    getProgress: protectedProcedure
        .input(z.number().positive())
        .query(async ({ input: courseId, ctx }) => {
            const db = await getDb();
            if (!db) throw new Error("Database not available");

            // Get all lesson IDs for this course
            const courseLessons = await db
                .select({ id: lessons.id })
                .from(lessons)
                .where(eq(lessons.courseId, courseId));

            const lessonIds = courseLessons.map(l => l.id);
            if (lessonIds.length === 0) return {};

            // Get all progress rows for this user
            const progressRows = await db
                .select()
                .from(lessonProgress)
                .where(eq(lessonProgress.userId, ctx.user.id));

            // Index by lessonId for fast lookup
            const progressMap: Record<number, { watchPercent: number; completed: boolean }> = {};
            for (const row of progressRows) {
                if (lessonIds.includes(row.lessonId)) {
                    progressMap[row.lessonId] = {
                        watchPercent: row.watchPercent,
                        completed: row.completed,
                    };
                }
            }

            return progressMap;
        }),

    /**
     * Update progress for a single lesson.
     * Automatically marks as completed when watchPercent >= 95.
     * Uses INSERT … ON DUPLICATE KEY UPDATE pattern via upsert logic.
     */
    updateProgress: protectedProcedure
        .input(
            z.object({
                lessonId: z.number().positive(),
                watchPercent: z.number().min(0).max(100),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const db = await getDb();
            if (!db) throw new Error("Database not available");

            const isCompleted = input.watchPercent >= 95;
            const now = new Date();

            // Check if row exists
            const [existing] = await db
                .select()
                .from(lessonProgress)
                .where(
                    and(
                        eq(lessonProgress.userId, ctx.user.id),
                        eq(lessonProgress.lessonId, input.lessonId)
                    )
                )
                .limit(1);

            if (existing) {
                // Only update if new percent is higher (never go backwards)
                const newPercent = Math.max(existing.watchPercent, input.watchPercent);
                const newCompleted = existing.completed || isCompleted;

                await db
                    .update(lessonProgress)
                    .set({
                        watchPercent: newPercent,
                        completed: newCompleted,
                        completedAt: newCompleted && !existing.completed ? now : existing.completedAt,
                    })
                    .where(
                        and(
                            eq(lessonProgress.userId, ctx.user.id),
                            eq(lessonProgress.lessonId, input.lessonId)
                        )
                    );

                return { watchPercent: newPercent, completed: newCompleted };
            } else {
                await db.insert(lessonProgress).values({
                    userId: ctx.user.id,
                    lessonId: input.lessonId,
                    watchPercent: input.watchPercent,
                    completed: isCompleted,
                    completedAt: isCompleted ? now : undefined,
                });

                return { watchPercent: input.watchPercent, completed: isCompleted };
            }
        }),

    // ── Admin / Instructor: create lesson ─────────────────────────────────────

    create: protectedProcedure
        .input(
            z.object({
                courseId: z.number().positive(),
                title: z.string().min(1),
                description: z.string().optional(),
                videoUrl: z.string().optional(),
                position: z.number().positive(),
                durationSeconds: z.number().optional(),
                isPreview: z.boolean().optional().default(false),
            })
        )
        .mutation(async ({ input, ctx }) => {
            if (!["instructor", "admin"].includes(ctx.user.role)) {
                throw new Error("Only instructors and admins can create lessons");
            }
            const db = await getDb();
            if (!db) throw new Error("Database not available");

            await db.insert(lessons).values({
                courseId: input.courseId,
                title: input.title,
                description: input.description,
                videoUrl: input.videoUrl,
                position: input.position,
                durationSeconds: input.durationSeconds,
                isPreview: input.isPreview ?? false,
            });

            return { success: true };
        }),
});
