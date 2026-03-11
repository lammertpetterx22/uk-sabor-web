import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users, events, classes, courses, subscriptions, instructors } from "../../drizzle/schema";
import { eq, and, desc, gte, count } from "drizzle-orm";

export const promotersRouter = router({
  /**
   * List all users with promoter or instructor roles (public profiles)
   * Enriched with instructor profile data (photo, bio, specialties) and content counts
   */
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Fetch users with primary role of promoter or instructor
    const primaryRoleUsers = await db
      .select({
        id: users.id,
        name: users.name,
        role: users.role,
        roles: users.roles,
        subscriptionPlan: users.subscriptionPlan,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        // MySQL doesn't support IN with enum easily, so fetch both separately
        eq(users.role, "promoter")
      );

    const instructorUsers = await db
      .select({
        id: users.id,
        name: users.name,
        role: users.role,
        roles: users.roles,
        subscriptionPlan: users.subscriptionPlan,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.role, "instructor"));

    // Also fetch users who have a secondary role that includes instructor or promoter
    const allUsersWithRoles = await db
      .select({
        id: users.id,
        name: users.name,
        role: users.role,
        roles: users.roles,
        subscriptionPlan: users.subscriptionPlan,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.role, "user")); // base users who may have secondary roles

    // Filter base users who have instructor/promoter as secondary role
    const multiRoleUsers = allUsersWithRoles.filter((u) => {
      if (!u.roles) return false;
      try {
        const parsed = JSON.parse(u.roles);
        return Array.isArray(parsed) && parsed.some((r: string) => r === "instructor" || r === "promoter");
      } catch {
        return false;
      }
    });

    const all = [...primaryRoleUsers, ...instructorUsers, ...multiRoleUsers];
    // Deduplicate by id
    const seen = new Set<number>();
    const unique = all.filter((u) => {
      if (seen.has(u.id)) return false;
      seen.add(u.id);
      return true;
    });

    // Enrich each user with instructor profile data and content counts
    const now = new Date();
    const enriched = await Promise.all(
      unique.map(async (u) => {
        // Try to find instructor profile linked to this user
        const [profile] = await db
          .select({
            id: instructors.id,
            photoUrl: instructors.photoUrl,
            bio: instructors.bio,
            specialties: instructors.specialties,
            instagramHandle: instructors.instagramHandle,
          })
          .from(instructors)
          .where(eq(instructors.userId, u.id))
          .limit(1);

        // Count published courses (via instructors.id)
        const [courseCount] = profile?.id
          ? await db.select({ count: count() }).from(courses).where(and(eq(courses.instructorId, profile.id), eq(courses.status, "published")))
          : [{ count: 0 }];

        // Count upcoming classes (via instructors.id)
        const [classCount] = profile?.id
          ? await db.select({ count: count() }).from(classes).where(and(eq(classes.instructorId, profile.id), eq(classes.status, "published"), gte(classes.classDate, now)))
          : [{ count: 0 }];

        // Count upcoming events created by this user (via creatorId)
        const [eventCount] = await db
          .select({ count: count() })
          .from(events)
          .where(and(eq(events.creatorId, u.id), eq(events.status, "published"), gte(events.eventDate, now)));

        return {
          ...u,
          photoUrl: profile?.photoUrl ?? null,
          bio: profile?.bio ?? null,
          specialties: profile?.specialties ?? null,
          instagramHandle: profile?.instagramHandle ?? null,
          courseCount: courseCount?.count ?? 0,
          classCount: classCount?.count ?? 0,
          eventCount: eventCount?.count ?? 0,
        };
      })
    );

    return enriched;
  }),

  /**
   * Get public profile for a promoter/instructor by user ID
   * Returns their published events, classes, and courses
   */
  getPublicProfile: publicProcedure
    .input(z.number())
    .query(async ({ input: userId }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get user info
      const [user] = await db
        .select({
          id: users.id,
          name: users.name,
          role: users.role,
          roles: users.roles,
          subscriptionPlan: users.subscriptionPlan,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) return null;

      // Show profiles for instructors, promoters, admins, or multi-role users
      const userRoles: string[] = [user.role];
      try {
        if (user.roles) {
          const parsed = JSON.parse(user.roles);
          if (Array.isArray(parsed)) userRoles.push(...parsed);
        }
      } catch { /* ignore */ }
      const isCreatorRole = userRoles.some(r => ["promoter", "instructor", "admin"].includes(r));
      if (!isCreatorRole) return null;

      // Get instructor profile (photo, bio, specialties, social)
      const [instructorProfile] = await db
        .select({
          id: instructors.id,
          photoUrl: instructors.photoUrl,
          bio: instructors.bio,
          specialties: instructors.specialties,
          instagramHandle: instructors.instagramHandle,
          websiteUrl: (instructors as any).websiteUrl,
        })
        .from(instructors)
        .where(eq(instructors.userId, userId))
        .limit(1);

      // Get published courses by this instructor
      const publishedCourses = await db
        .select()
        .from(courses)
        .where(
          and(
            eq(courses.instructorId, instructorProfile?.id ?? -1),
            eq(courses.status, "published")
          )
        )
        .orderBy(desc(courses.createdAt))
        .limit(20);

      // Get upcoming published classes by this instructor
      const now = new Date();
      const upcomingClasses = await db
        .select()
        .from(classes)
        .where(
          and(
            eq(classes.instructorId, instructorProfile?.id ?? -1),
            eq(classes.status, "published"),
            gte(classes.classDate, now)
          )
        )
        .orderBy(classes.classDate)
        .limit(20);

      // Get upcoming published events created by this user (via creatorId)
      const upcomingEvents = await db
        .select()
        .from(events)
        .where(
          and(
            eq(events.creatorId, userId),
            eq(events.status, "published"),
            gte(events.eventDate, now)
          )
        )
        .orderBy(events.eventDate)
        .limit(20);

      // Get subscription plan details
      const [sub] = await db
        .select({ plan: subscriptions.plan, status: subscriptions.status })
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.userId, userId),
            eq(subscriptions.status, "active")
          )
        )
        .limit(1);

      return {
        id: user.id,
        name: user.name,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        activePlan: sub?.plan ?? user.subscriptionPlan,
        memberSince: user.createdAt,
        photoUrl: instructorProfile?.photoUrl ?? null,
        bio: instructorProfile?.bio ?? null,
        specialties: instructorProfile?.specialties ?? null,
        instagramHandle: instructorProfile?.instagramHandle ?? null,
        websiteUrl: instructorProfile?.websiteUrl ?? null,
        courses: publishedCourses,
        classes: upcomingClasses,
        events: upcomingEvents,
        stats: {
          totalCourses: publishedCourses.length,
          totalClasses: upcomingClasses.length,
          totalEvents: upcomingEvents.length,
        },
      };
    }),
});
