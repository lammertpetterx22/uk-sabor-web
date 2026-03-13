import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { lessons, lessonProgress, coursePurchases, courses, instructors } from "../../drizzle/schema";
import { eq, and, asc } from "drizzle-orm";
import { getAllRoles } from "../../drizzle/schema";
import { bunnyGenerateSignedUrl, getBunnyLibraryId } from "../bunny";

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

            // If not authenticated → only preview lessons (no bunnyVideoId exposed)
            if (!ctx.user) {
                return allLessons.map(l => ({
                    ...l,
                    bunnyVideoId: l.isPreview ? l.bunnyVideoId : null,
                    bunnyLibraryId: l.isPreview ? l.bunnyLibraryId : null,
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
                bunnyVideoId: hasPurchased || l.isPreview ? l.bunnyVideoId : null,
                bunnyLibraryId: hasPurchased || l.isPreview ? l.bunnyLibraryId : null,
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
                bunnyVideoId: z.string(), // REQUIRED: Bunny.net video GUID
                bunnyLibraryId: z.string(), // REQUIRED: Bunny.net library ID
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
                videoUrl: null, // Deprecated field, always null
                bunnyVideoId: input.bunnyVideoId,
                bunnyLibraryId: input.bunnyLibraryId,
                position: input.position,
                durationSeconds: input.durationSeconds,
                isPreview: input.isPreview ?? false,
            });

            return { success: true };
        }),

    /**
     * Get secure video URL for a lesson
     * SECURITY: Only returns video URL if:
     * - User has purchased the course, OR
     * - Lesson is marked as preview (free), OR
     * - User is the course instructor/admin
     *
     * Uses Bunny.net signed URLs exclusively (AWS S3 removed).
     */
    getSecureVideoUrl: protectedProcedure
        .input(z.object({ lessonId: z.number() }))
        .query(async ({ ctx, input }) => {
            const db = await getDb();
            if (!db) throw new Error("Database not available");

            // Get lesson details
            const [lesson] = await db
                .select()
                .from(lessons)
                .where(eq(lessons.id, input.lessonId))
                .limit(1);

            if (!lesson) throw new Error("Lesson not found");

            // Check if video exists (must have Bunny.net ID)
            if (!lesson.bunnyVideoId || !lesson.bunnyLibraryId) {
                throw new Error(
                    "No video available for this lesson. Please upload a video using Bunny.net Stream API."
                );
            }

            // If it's a preview lesson, allow access
            if (lesson.isPreview) {
                console.log(`[Lessons] ✅ Preview lesson access granted to user ${ctx.user.id} for lesson ${input.lessonId}`);

                const signedUrl = bunnyGenerateSignedUrl(
                    lesson.bunnyVideoId,
                    lesson.bunnyLibraryId,
                    86400 // 24 hours
                );

                return {
                    videoUrl: signedUrl,
                    bunnyVideoId: lesson.bunnyVideoId,
                    bunnyLibraryId: lesson.bunnyLibraryId,
                    isBunnyVideo: true,
                    expiresIn: 86400,
                };
            }

            // Check if user is admin
            const isAdmin = getAllRoles(ctx.user as any).includes("admin");

            // Check if user is the course instructor
            const [course] = await db
                .select()
                .from(courses)
                .where(eq(courses.id, lesson.courseId))
                .limit(1);

            if (!course) throw new Error("Course not found");

            let isInstructor = false;
            if (course.instructorId) {
                const [instructor] = await db
                    .select()
                    .from(instructors)
                    .where(eq(instructors.id, course.instructorId))
                    .limit(1);
                if (instructor && instructor.userId === ctx.user.id) {
                    isInstructor = true;
                }
            }

            // Check if user has purchased the course
            let hasPurchased = false;
            if (!isAdmin && !isInstructor) {
                const [purchase] = await db
                    .select()
                    .from(coursePurchases)
                    .where(
                        and(
                            eq(coursePurchases.userId, ctx.user.id),
                            eq(coursePurchases.courseId, lesson.courseId)
                        )
                    )
                    .limit(1);

                hasPurchased = !!purchase;
            }

            // Grant access if admin, instructor, or purchased
            if (!isAdmin && !isInstructor && !hasPurchased) {
                throw new Error("You must purchase this course to access this lesson");
            }

            console.log(`[Lessons] ✅ Secure video access granted to user ${ctx.user.id} for lesson ${input.lessonId}`);

            // Generate Bunny.net signed URL
            const signedUrl = bunnyGenerateSignedUrl(
                lesson.bunnyVideoId,
                lesson.bunnyLibraryId,
                86400 // 24 hours
            );

            return {
                videoUrl: signedUrl,
                bunnyVideoId: lesson.bunnyVideoId,
                bunnyLibraryId: lesson.bunnyLibraryId,
                isBunnyVideo: true,
                expiresIn: 86400,
            };
        }),
});
