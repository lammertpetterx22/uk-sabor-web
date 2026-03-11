import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { balances, ledgerTransactions, withdrawalRequests, users, coursePurchases, courses, eventTickets, events, classPurchases, classes } from "../../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Get or create a balance record for a user
 */
export async function getOrCreateBalance(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [existing] = await db.select().from(balances).where(eq(balances.userId, userId)).limit(1);
  if (existing) return existing;

  const [newBalance] = await db.insert(balances).values({
    userId,
    currentBalance: "0.00",
    pendingBalance: "0.00",
    totalEarned: "0.00",
    totalWithdrawn: "0.00",
    currency: "GBP",
  }).returning();

  return newBalance;
}

/**
 * Add earnings to a teacher's balance and record in ledger
 */
export async function addEarnings(args: {
  userId: number;
  amount: number;
  description: string;
  orderId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const amountStr = args.amount.toFixed(2);

  // Update balance atomically
  await db.update(balances)
    .set({
      currentBalance: sql`${balances.currentBalance} + ${amountStr}`,
      totalEarned: sql`${balances.totalEarned} + ${amountStr}`,
      updatedAt: new Date(),
    })
    .where(eq(balances.userId, args.userId));

  // Record in ledger
  await db.insert(ledgerTransactions).values({
    userId: args.userId,
    amount: amountStr as any,
    type: "earning",
    description: args.description,
    orderId: args.orderId,
    status: "completed",
  });
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const financialsRouter = router({
  /** Get current wallet balance and metrics */
  getWallet: protectedProcedure.query(async ({ ctx }) => {
    // Only teachers/promoters/admins should access this, but we'll check role-specifically in UI
    // If we want hard check: if (!["instructor", "promoter", "admin"].includes(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
    
    return await getOrCreateBalance(ctx.user.id);
  }),

  /** Get transaction history */
  getLedger: protectedProcedure
    .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      return await db
        .select()
        .from(ledgerTransactions)
        .where(eq(ledgerTransactions.userId, ctx.user.id))
        .orderBy(desc(ledgerTransactions.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),

  /** Request a withdrawal */
  requestWithdrawal: protectedProcedure
    .input(z.object({ amount: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const balance = await getOrCreateBalance(ctx.user.id);
      const currentAvailable = parseFloat(balance.currentBalance as string);

      if (input.amount > currentAvailable) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Insufficient funds. Available: £${currentAvailable.toFixed(2)}`,
        });
      }

      // 1. Deduct from currentBalance (move to pending/internal state)
      // For this simple version, we'll deduct it immediately and create a request.
      // If rejected, we'll refund it.
      await db.update(balances)
        .set({
          currentBalance: sql`${balances.currentBalance} - ${input.amount.toFixed(2)}`,
          updatedAt: new Date(),
        })
        .where(eq(balances.userId, ctx.user.id));

      // 2. Create withdrawal request
      const [request] = await db.insert(withdrawalRequests).values({
        userId: ctx.user.id,
        amount: input.amount.toFixed(2) as any,
        status: "pending",
      }).returning();

      // 3. Optional: Add a pending ledger entry
      await db.insert(ledgerTransactions).values({
        userId: ctx.user.id,
        amount: (-input.amount).toFixed(2) as any,
        type: "withdrawal",
        description: `Withdrawal request #${request.id}`,
        status: "pending",
      });

      return request;
    }),

  /** Get user's withdrawal requests */
  getMyWithdrawals: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db
      .select()
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.userId, ctx.user.id))
      .orderBy(desc(withdrawalRequests.requestedAt));
  }),

  /** Get course sales detailed data */
  getCourseSales: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db
      .select({
        id: coursePurchases.id,
        courseTitle: courses.title,
        pricePaid: coursePurchases.pricePaid,
        platformFee: coursePurchases.platformFee,
        instructorEarnings: coursePurchases.instructorEarnings,
        purchasedAt: coursePurchases.purchasedAt,
      })
      .from(coursePurchases)
      .leftJoin(courses, eq(coursePurchases.courseId, courses.id))
      .where(eq(coursePurchases.instructorId, ctx.user.id))
      .orderBy(desc(coursePurchases.purchasedAt));
  }),

  /** Get event ticket sales detailed data */
  getEventSales: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db
      .select({
        id: eventTickets.id,
        eventTitle: events.title,
        pricePaid: eventTickets.pricePaid,
        platformFee: eventTickets.platformFee,
        instructorEarnings: eventTickets.instructorEarnings,
        quantity: eventTickets.quantity,
        purchasedAt: eventTickets.purchasedAt,
      })
      .from(eventTickets)
      .leftJoin(events, eq(eventTickets.eventId, events.id))
      .where(eq(eventTickets.instructorId, ctx.user.id))
      .orderBy(desc(eventTickets.purchasedAt));
  }),

  /** Get class sales detailed data */
  getClassSales: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db
      .select({
        id: classPurchases.id,
        classTitle: classes.title,
        pricePaid: classPurchases.pricePaid,
        platformFee: classPurchases.platformFee,
        instructorEarnings: classPurchases.instructorEarnings,
        purchasedAt: classPurchases.purchasedAt,
      })
      .from(classPurchases)
      .leftJoin(classes, eq(classPurchases.classId, classes.id))
      .where(eq(classPurchases.instructorId, ctx.user.id))
      .orderBy(desc(classPurchases.purchasedAt));
  }),

  // ─── Admin Procedures ──────────────────────────────────────────────────────

  /** Admin: List all pending and recent withdrawals */
  adminListWithdrawals: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db
      .select({
        request: withdrawalRequests,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(withdrawalRequests)
      .leftJoin(users, eq(withdrawalRequests.userId, users.id))
      .orderBy(desc(withdrawalRequests.requestedAt));
  }),

  /** Admin: Approve/Pay/Reject withdrawal */
  adminUpdateWithdrawal: adminProcedure
    .input(z.object({
      requestId: z.number(),
      status: z.enum(["approved", "paid", "rejected"]),
      adminNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [request] = await db
        .select()
        .from(withdrawalRequests)
        .where(eq(withdrawalRequests.id, input.requestId))
        .limit(1);

      if (!request) throw new TRPCError({ code: "NOT_FOUND" });
      if (request.status === "paid" || request.status === "rejected") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Request already finalized." });
      }

      // If rejected, refund the balance
      if (input.status === "rejected") {
        await db.update(balances)
          .set({
            currentBalance: sql`${balances.currentBalance} + ${request.amount}`,
            updatedAt: new Date(),
          })
          .where(eq(balances.userId, request.userId));
        
        // Mark ledger entry as cancelled too
        await db.update(ledgerTransactions)
          .set({ status: "cancelled", description: sql`${ledgerTransactions.description} || ' (Rejected)'` })
          .where(and(
            eq(ledgerTransactions.userId, request.userId),
            eq(ledgerTransactions.type, "withdrawal"),
            eq(ledgerTransactions.status, "pending"), // Find the matching pending withdrawal
            sql`description LIKE ${`Withdrawal request #${request.id}%`}`
          ));
      }

      // If paid, update totalWithdrawn
      if (input.status === "paid" && request.status !== "paid") {
         await db.update(balances)
          .set({
            totalWithdrawn: sql`${balances.totalWithdrawn} + ${request.amount}`,
            updatedAt: new Date(),
          })
          .where(eq(balances.userId, request.userId));

         // Finalize ledger entry
         await db.update(ledgerTransactions)
          .set({ status: "completed" })
          .where(and(
            eq(ledgerTransactions.userId, request.userId),
            eq(ledgerTransactions.type, "withdrawal"),
            eq(ledgerTransactions.status, "pending"),
            sql`description LIKE ${`Withdrawal request #${request.id}%`}`
          ));
      }

      await db.update(withdrawalRequests)
        .set({
          status: input.status,
          adminNotes: input.adminNotes,
          processedAt: new Date(),
          processedBy: ctx.user.id,
        })
        .where(eq(withdrawalRequests.id, input.requestId));

      return { success: true };
    }),
});
