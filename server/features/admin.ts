import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { events, courses, classes, users, orders, eventTickets, classPurchases, coursePurchases, instructors as instructorsTable } from "../../drizzle/schema";
import { getAllRoles } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { canCreateCourse } from "../stripe/plans";

// Helper: instructors + admins (not promoters) — for course operations
const instructorOrAdminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const roles = getAllRoles(ctx.user as any);
  if (!roles.some(r => r === "admin" || r === "instructor")) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Course management requires instructor or admin access" });
  }
  return next({ ctx });
});

// Helper: all content creators — events and classes
const creatorProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const roles = getAllRoles(ctx.user as any);
  if (!roles.some(r => r === "admin" || r === "instructor" || r === "promoter")) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Creator access required" });
  }
  return next({ ctx });
});

export const adminRouter = router({
  // ===== EVENTS MANAGEMENT =====
  listAllEvents: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const allEvents = await db.select().from(events).orderBy(desc(events.createdAt));
    return allEvents;
  }),

  /** Instructors/promoters: list only their own events */
  listMyEvents: creatorProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    if (ctx.user.role === "admin") {
      return db.select().from(events).orderBy(desc(events.createdAt));
    }
    return db.select().from(events).where(eq(events.creatorId, ctx.user.id)).orderBy(desc(events.createdAt));
  }),

  /** Instructors/promoters: list only their own classes */
  listMyClasses: creatorProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const roles = getAllRoles(ctx.user as any);
    if (roles.includes("admin")) {
      return db.select().from(classes).orderBy(desc(classes.createdAt));
    }
    // Find instructor record linked to this user
    const { instructors: instructorsTable } = await import("../../drizzle/schema");
    const [instructor] = await db
      .select()
      .from(instructorsTable)
      .where(eq(instructorsTable.userId, ctx.user.id))
      .limit(1);
    if (!instructor) return [];
    return db.select().from(classes).where(eq(classes.instructorId, instructor.id)).orderBy(desc(classes.createdAt));
  }),

  /** Instructors: list only their own courses */
  listMyCourses: instructorOrAdminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const roles = getAllRoles(ctx.user as any);
    if (roles.includes("admin")) {
      return db.select().from(courses).orderBy(desc(courses.createdAt));
    }
    const { instructors: instructorsTable } = await import("../../drizzle/schema");
    const [instructor] = await db
      .select()
      .from(instructorsTable)
      .where(eq(instructorsTable.userId, ctx.user.id))
      .limit(1);
    if (!instructor) return [];
    return db.select().from(courses).where(eq(courses.instructorId, instructor.id)).orderBy(desc(courses.createdAt));
  }),

  // ===== USER MANAGEMENT =====
  listUsers: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      roles: users.roles,
      loginMethod: users.loginMethod,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
    }).from(users).orderBy(desc(users.createdAt));

    // Parse roles JSON for each user
    return allUsers.map(u => ({
      ...u,
      rolesArray: u.roles ? JSON.parse(u.roles) : [u.role]
    }));

  }),

  deleteUser: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      // Prevent self-deletion
      if (ctx.user?.id === input.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No puedes eliminarte a ti mismo" });
      }
      await db.delete(users).where(eq(users.id, input.id));
      return { success: true };
    }),


  updateUserRole: adminProcedure
    .input(z.object({
      id: z.number(),
      role: z.enum(["user", "instructor", "promoter", "admin"]),
      additionalRole: z.enum(["user", "instructor", "promoter", "admin"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      if (ctx.user?.id === input.id && input.role !== "admin") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No puedes cambiar tu propio rol" });
      }
      // Build roles array: primary role + optional additional role
      const rolesArray: string[] = [input.role];
      if (input.additionalRole && input.additionalRole !== input.role) {
        rolesArray.push(input.additionalRole);
      }

      // Update user with new role and roles array
      await db.update(users).set({
        role: input.role,
        roles: JSON.stringify(rolesArray)
      }).where(eq(users.id, input.id));

      return { success: true, rolesArray };
    }),















  createEvent: creatorProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        eventDate: z.string().min(1, "Event date is required"),
        venue: z.string().min(1),
        ticketPrice: z.string(),
        maxTickets: z.number().int().positive().optional(),
        imageUrl: z.string().optional(),
        city: z.string().optional(),
        status: z.string().optional(),
        paymentMethod: z.enum(["online", "cash", "both"]).default("online"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const parsedDate = new Date(input.eventDate);
      if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() < 2000) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid event date. Please select a valid date and time." });
      }

      await db.insert(events).values({
        title: input.title,
        description: input.description,
        eventDate: parsedDate,
        venue: input.venue,
        city: input.city,
        imageUrl: input.imageUrl,
        ticketPrice: input.ticketPrice,
        maxTickets: input.maxTickets || null,
        ticketsSold: 0,
        status: (input.status as any) || "published",
        paymentMethod: input.paymentMethod,
        creatorId: ctx.user.id,
      });

      return { success: true };
    }),

  updateEvent: creatorProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        eventDate: z.string().optional(),
        venue: z.string().optional(),
        ticketPrice: z.string().optional(),
        maxTickets: z.number().int().positive().optional(),
        imageUrl: z.string().optional(),
        city: z.string().optional(),
        status: z.string().optional(),
        paymentMethod: z.enum(["online", "cash", "both"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const roles = getAllRoles(ctx.user as any);

      // Non-admins can only edit their own events
      if (!roles.includes("admin")) {
        const [existing] = await db.select({ creatorId: events.creatorId }).from(events).where(eq(events.id, input.id)).limit(1);
        if (!existing || existing.creatorId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You can only edit your own events" });
        }
      }

      const updateData: Record<string, any> = {};
      if (input.title) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.eventDate) updateData.eventDate = new Date(input.eventDate);
      if (input.venue) updateData.venue = input.venue;
      if (input.city) updateData.city = input.city;
      if (input.imageUrl) updateData.imageUrl = input.imageUrl;
      if (input.ticketPrice) updateData.ticketPrice = input.ticketPrice;
      if (input.maxTickets) updateData.maxTickets = input.maxTickets;
      if (input.status) updateData.status = input.status;
      if (input.paymentMethod) updateData.paymentMethod = input.paymentMethod;

      await db.update(events).set(updateData).where(eq(events.id, input.id));

      return { success: true };
    }),

  deleteEvent: creatorProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const roles = getAllRoles(ctx.user as any);

    // Non-admins can only delete their own events
    if (!roles.includes("admin")) {
      const [existing] = await db.select({ creatorId: events.creatorId }).from(events).where(eq(events.id, input.id)).limit(1);
      if (!existing || existing.creatorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own events" });
      }
    }

    await db.delete(events).where(eq(events.id, input.id));

    return { success: true };
  }),

  // ===== COURSES MANAGEMENT =====
  createCourse: instructorOrAdminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        danceStyle: z.string().optional(),
        level: z.enum(["beginner", "intermediate", "advanced", "all-levels"]),
        price: z.string(),
        instructorId: z.number(),
        duration: z.string().optional(),
        lessonsCount: z.number().int().optional(),
        videoUrl: z.string().optional(),
        imageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const roles = getAllRoles(ctx.user as any);

      // Entitlement check for non-admin instructors
      if (!roles.includes("admin")) {
        const [instructor] = await db
          .select({ id: instructorsTable.id })
          .from(instructorsTable)
          .where(eq(instructorsTable.userId, ctx.user.id))
          .limit(1);
        const instructorId = instructor?.id;
        const totalCourses = instructorId
          ? (await db.select().from(courses).where(eq(courses.instructorId, instructorId))).length
          : 0;
        const entitlement = canCreateCourse(ctx.user.subscriptionPlan, totalCourses);
        if (!entitlement.allowed) {
          throw new TRPCError({ code: "FORBIDDEN", message: entitlement.reason ?? "Plan does not include courses" });
        }
      }

      await db.insert(courses).values({
        title: input.title,
        description: input.description,
        danceStyle: input.danceStyle,
        level: input.level,
        price: input.price,
        instructorId: input.instructorId,
        duration: input.duration,
        lessonsCount: input.lessonsCount,
        videoUrl: input.videoUrl,
        imageUrl: input.imageUrl,
        status: "published",
      });

      return { success: true };
    }),

  updateCourse: instructorOrAdminProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        danceStyle: z.string().optional(),
        level: z.enum(["beginner", "intermediate", "advanced", "all-levels"]).optional(),
        price: z.string().optional(),
        duration: z.string().optional(),
        lessonsCount: z.number().int().optional(),
        videoUrl: z.string().optional(),
        imageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const roles = getAllRoles(ctx.user as any);

      // Non-admins can only edit courses they instruct (userId-based lookup)
      if (!roles.includes("admin")) {
        const [instructor] = await db.select({ id: instructorsTable.id })
          .from(instructorsTable).where(eq(instructorsTable.userId, ctx.user.id)).limit(1);
        if (!instructor) throw new TRPCError({ code: "FORBIDDEN", message: "Instructor profile not found" });
        const [existing] = await db.select({ instructorId: courses.instructorId }).from(courses).where(eq(courses.id, input.id)).limit(1);
        if (!existing || existing.instructorId !== instructor.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You can only edit your own courses" });
        }
      }

      const updateData: Record<string, any> = {};
      if (input.title) updateData.title = input.title;
      if (input.description) updateData.description = input.description;
      if (input.danceStyle) updateData.danceStyle = input.danceStyle;
      if (input.level) updateData.level = input.level;
      if (input.price) updateData.price = input.price;
      if (input.duration) updateData.duration = input.duration;
      if (input.lessonsCount) updateData.lessonsCount = input.lessonsCount;
      if (input.videoUrl) updateData.videoUrl = input.videoUrl;
      if (input.imageUrl) updateData.imageUrl = input.imageUrl;

      await db.update(courses).set(updateData).where(eq(courses.id, input.id));

      return { success: true };
    }),

  deleteCourse: instructorOrAdminProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const roles = getAllRoles(ctx.user as any);

    // Non-admins can only delete their own courses (userId-based lookup)
    if (!roles.includes("admin")) {
      const [instructor] = await db.select({ id: instructorsTable.id })
        .from(instructorsTable).where(eq(instructorsTable.userId, ctx.user.id)).limit(1);
      if (!instructor) throw new TRPCError({ code: "FORBIDDEN", message: "Instructor profile not found" });
      const [existing] = await db.select({ instructorId: courses.instructorId }).from(courses).where(eq(courses.id, input.id)).limit(1);
      if (!existing || existing.instructorId !== instructor.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own courses" });
      }
    }

    await db.delete(courses).where(eq(courses.id, input.id));

    return { success: true };
  }),

  // ===== CLASSES MANAGEMENT =====
  createClass: creatorProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        danceStyle: z.string().optional(),
        classDate: z.string().min(1, "Class date is required"),
        duration: z.number().int().positive().optional(),
        price: z.string(),
        instructorId: z.number(),
        maxParticipants: z.number().int().positive().optional(),
        hasSocial: z.boolean().optional().default(false),
        socialTime: z.string().optional(),
        socialLocation: z.string().optional(),
        socialDescription: z.string().optional(),
        level: z.string().optional(),
        imageUrl: z.string().optional(),
        paymentMethod: z.enum(["online", "cash", "both"]).optional().default("online"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const parsedDate = new Date(input.classDate);
      if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() < 2000) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid class date. Please select a valid date and time." });
      }

      await db.insert(classes).values({
        title: input.title,
        description: input.description,
        danceStyle: input.danceStyle,
        classDate: parsedDate,
        duration: input.duration || null,
        price: input.price,
        instructorId: input.instructorId,
        maxParticipants: input.maxParticipants || null,
        currentParticipants: 0,
        status: "published",
        hasSocial: input.hasSocial ?? false,
        socialTime: input.socialTime,
        socialLocation: input.socialLocation,
        socialDescription: input.socialDescription,
        level: input.level as any,
        imageUrl: input.imageUrl,
        paymentMethod: input.paymentMethod || "online",
      });

      return { success: true };
    }),

  updateClass: creatorProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        danceStyle: z.string().optional(),
        classDate: z.string().optional(),
        duration: z.number().int().positive().optional(),
        price: z.string().optional(),
        maxParticipants: z.number().int().positive().optional(),
        status: z.string().optional(),
        hasSocial: z.boolean().optional(),
        socialTime: z.string().optional(),
        socialLocation: z.string().optional(),
        socialDescription: z.string().optional(),
        level: z.string().optional(),
        imageUrl: z.string().optional(),
        paymentMethod: z.enum(["online", "cash", "both"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const roles = getAllRoles(ctx.user as any);

      // Non-admins can only edit their own classes
      if (!roles.includes("admin")) {
        const [instructor] = await db.select({ id: instructorsTable.id })
          .from(instructorsTable).where(eq(instructorsTable.userId, ctx.user.id)).limit(1);
        if (!instructor) throw new TRPCError({ code: "FORBIDDEN", message: "Instructor profile not found" });
        const [existing] = await db.select({ instructorId: classes.instructorId }).from(classes).where(eq(classes.id, input.id)).limit(1);
        if (!existing || existing.instructorId !== instructor.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You can only edit your own classes" });
        }
      }

      const updateData: Record<string, any> = {};
      if (input.title) updateData.title = input.title;
      if (input.description) updateData.description = input.description;
      if (input.danceStyle) updateData.danceStyle = input.danceStyle;
      if (input.classDate) updateData.classDate = new Date(input.classDate);
      if (input.duration) updateData.duration = input.duration;
      if (input.price) updateData.price = input.price;
      if (input.maxParticipants) updateData.maxParticipants = input.maxParticipants;
      if (input.status) updateData.status = input.status;
      if (input.hasSocial !== undefined) updateData.hasSocial = input.hasSocial;
      if (input.socialTime !== undefined) updateData.socialTime = input.socialTime;
      if (input.socialLocation !== undefined) updateData.socialLocation = input.socialLocation;
      if (input.socialDescription !== undefined) updateData.socialDescription = input.socialDescription;
      if (input.level) updateData.level = input.level;
      if (input.imageUrl) updateData.imageUrl = input.imageUrl;
      if (input.paymentMethod) updateData.paymentMethod = input.paymentMethod;

      await db.update(classes).set(updateData).where(eq(classes.id, input.id));

      return { success: true };
    }),

  deleteClass: creatorProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const roles = getAllRoles(ctx.user as any);

    // Non-admins can only delete their own classes
    if (!roles.includes("admin")) {
      const [instructor] = await db.select({ id: instructorsTable.id })
        .from(instructorsTable).where(eq(instructorsTable.userId, ctx.user.id)).limit(1);
      if (!instructor) throw new TRPCError({ code: "FORBIDDEN", message: "Instructor profile not found" });
      const [existing] = await db.select({ instructorId: classes.instructorId }).from(classes).where(eq(classes.id, input.id)).limit(1);
      if (!existing || existing.instructorId !== instructor.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own classes" });
      }
    }

    await db.delete(classes).where(eq(classes.id, input.id));

    return { success: true };
  }),

  // ===== ORDERS MANAGEMENT =====
  /**
   * Get all orders (admin view) with user and item details
   */
  getAllOrders: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));

    const enriched = await Promise.all(
      allOrders.map(async (order) => {
        let userName = "Unknown";
        let userEmail = "";
        let itemTitle: string | null = null;

        try {
          const [user] = await db.select({ name: users.name, email: users.email })
            .from(users).where(eq(users.id, order.userId)).limit(1);
          if (user) { userName = user.name ?? "Unknown"; userEmail = user.email ?? ""; }
        } catch { }

        try {
          if (order.itemType === "event") {
            const [item] = await db.select({ title: events.title }).from(events).where(eq(events.id, order.itemId)).limit(1);
            if (item) itemTitle = item.title;
          } else if (order.itemType === "course") {
            const [item] = await db.select({ title: courses.title }).from(courses).where(eq(courses.id, order.itemId)).limit(1);
            if (item) itemTitle = item.title;
          } else if (order.itemType === "class") {
            const [item] = await db.select({ title: classes.title }).from(classes).where(eq(classes.id, order.itemId)).limit(1);
            if (item) itemTitle = item.title;
          }
        } catch { }

        return { ...order, userName, userEmail, itemTitle };
      })
    );

    return enriched;
  }),

  /**
   * Get all event tickets (admin view)
   */
  getAllTickets: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const tickets = await db.select().from(eventTickets).orderBy(desc(eventTickets.purchasedAt));

    const enriched = await Promise.all(
      tickets.map(async (ticket) => {
        let userName = "Unknown";
        let eventTitle = "Unknown";
        try {
          const [user] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, ticket.userId)).limit(1);
          if (user) userName = user.name ?? "Unknown";
          const [event] = await db.select({ title: events.title }).from(events).where(eq(events.id, ticket.eventId)).limit(1);
          if (event) eventTitle = event.title;
        } catch { }
        return { ...ticket, userName, eventTitle };
      })
    );

    return enriched;
  }),
});
