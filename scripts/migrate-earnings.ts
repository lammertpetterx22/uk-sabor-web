/**
 * Migration Script: Recalculate and register earnings for existing purchases
 *
 * This script processes all existing purchases (courses, events, classes) and:
 * 1. Ensures instructorId is correctly set
 * 2. Calculates platform fees based on the seller's plan
 * 3. Creates balance entries for teachers/promoters
 * 4. Records earnings in ledger transactions
 *
 * Run with: tsx scripts/migrate-earnings.ts
 */

import { getDb } from "../server/db";
import {
  coursePurchases,
  eventTickets,
  classPurchases,
  courses,
  events,
  classes,
  instructors,
  users,
  balances,
  ledgerTransactions
} from "../drizzle/schema";
import { eq, sql, isNull, or } from "drizzle-orm";
import { PLANS, PlanKey } from "../server/stripe/plans";
import { getOrCreateBalance, addEarnings } from "../server/features/financials";

async function main() {
  console.log("🚀 Starting earnings migration...\n");

  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  let totalProcessed = 0;
  let totalEarningsAdded = 0;

  // ─── 1. Process Course Purchases ───────────────────────────────────────────
  console.log("📚 Processing course purchases...");

  const coursesBought = await db
    .select({
      purchase: coursePurchases,
      course: courses,
      instructor: instructors,
    })
    .from(coursePurchases)
    .leftJoin(courses, eq(coursePurchases.courseId, courses.id))
    .leftJoin(instructors, eq(courses.instructorId, instructors.id));

  for (const record of coursesBought) {
    const { purchase, course, instructor } = record;

    if (!course || !instructor?.userId) {
      console.warn(`⚠️  Skipping purchase #${purchase.id} - missing course or instructor`);
      continue;
    }

    const instructorUserId = instructor.userId;

    // Check if instructorId needs to be updated
    if (purchase.instructorId !== instructorUserId) {
      await db.update(coursePurchases)
        .set({ instructorId: instructorUserId })
        .where(eq(coursePurchases.id, purchase.id));
      console.log(`  ✅ Updated instructorId for course purchase #${purchase.id}`);
    }

    // Calculate earnings if not set
    if (!purchase.instructorEarnings || parseFloat(String(purchase.instructorEarnings)) === 0) {
      const pricePaid = parseFloat(String(purchase.pricePaid || 0));

      if (pricePaid > 0) {
        // Get seller's plan
        const [userRecord] = await db.select({ subscriptionPlan: users.subscriptionPlan })
          .from(users).where(eq(users.id, instructorUserId)).limit(1);

        const sellerPlan = userRecord?.subscriptionPlan || "starter";
        const planDef = PLANS[sellerPlan as PlanKey] || PLANS.starter;
        const commissionRate = planDef.courseCommissionRate;

        const platformFee = pricePaid * commissionRate;
        const instructorEarnings = pricePaid - platformFee;

        // Update purchase record
        await db.update(coursePurchases)
          .set({
            platformFee: platformFee.toFixed(2) as any,
            instructorEarnings: instructorEarnings.toFixed(2) as any
          })
          .where(eq(coursePurchases.id, purchase.id));

        // Add to balance
        await addEarnings({
          userId: instructorUserId,
          amount: instructorEarnings,
          description: `Course sale: ${course.title} (Migration #${purchase.id})`,
          orderId: purchase.orderId || undefined,
        });

        totalEarningsAdded += instructorEarnings;
        console.log(`  💰 Added £${instructorEarnings.toFixed(2)} for course "${course.title}"`);
      }
    }

    totalProcessed++;
  }

  console.log(`✅ Processed ${totalProcessed} course purchases\n`);

  // ─── 2. Process Event Tickets ──────────────────────────────────────────────
  console.log("🎫 Processing event tickets...");

  totalProcessed = 0;
  const eventsBought = await db
    .select({
      ticket: eventTickets,
      event: events,
    })
    .from(eventTickets)
    .leftJoin(events, eq(eventTickets.eventId, events.id));

  for (const record of eventsBought) {
    const { ticket, event } = record;

    if (!event || !event.creatorId) {
      console.warn(`⚠️  Skipping ticket #${ticket.id} - missing event or creator`);
      continue;
    }

    const creatorUserId = event.creatorId;

    // Check if instructorId needs to be updated
    if (ticket.instructorId !== creatorUserId) {
      await db.update(eventTickets)
        .set({ instructorId: creatorUserId })
        .where(eq(eventTickets.id, ticket.id));
      console.log(`  ✅ Updated instructorId for event ticket #${ticket.id}`);
    }

    // Calculate earnings if not set
    if (!ticket.instructorEarnings || parseFloat(String(ticket.instructorEarnings)) === 0) {
      const pricePaid = parseFloat(String(ticket.pricePaid || 0));

      if (pricePaid > 0) {
        // Get seller's plan
        const [userRecord] = await db.select({ subscriptionPlan: users.subscriptionPlan })
          .from(users).where(eq(users.id, creatorUserId)).limit(1);

        const sellerPlan = userRecord?.subscriptionPlan || "starter";
        const planDef = PLANS[sellerPlan as PlanKey] || PLANS.starter;
        const commissionRate = planDef.commissionRate; // Event commission

        const platformFee = pricePaid * commissionRate;
        const instructorEarnings = pricePaid - platformFee;

        // Update ticket record
        await db.update(eventTickets)
          .set({
            platformFee: platformFee.toFixed(2) as any,
            instructorEarnings: instructorEarnings.toFixed(2) as any
          })
          .where(eq(eventTickets.id, ticket.id));

        // Add to balance
        await addEarnings({
          userId: creatorUserId,
          amount: instructorEarnings,
          description: `Event ticket: ${event.title} (Migration #${ticket.id})`,
          orderId: ticket.orderId || undefined,
        });

        totalEarningsAdded += instructorEarnings;
        console.log(`  💰 Added £${instructorEarnings.toFixed(2)} for event "${event.title}"`);
      }
    }

    totalProcessed++;
  }

  console.log(`✅ Processed ${totalProcessed} event tickets\n`);

  // ─── 3. Process Class Purchases ────────────────────────────────────────────
  console.log("💃 Processing class purchases...");

  totalProcessed = 0;
  const classesBought = await db
    .select({
      purchase: classPurchases,
      class: classes,
      instructor: instructors,
    })
    .from(classPurchases)
    .leftJoin(classes, eq(classPurchases.classId, classes.id))
    .leftJoin(instructors, eq(classes.instructorId, instructors.id));

  for (const record of classesBought) {
    const { purchase, class: classItem, instructor } = record;

    if (!classItem || !instructor?.userId) {
      console.warn(`⚠️  Skipping purchase #${purchase.id} - missing class or instructor`);
      continue;
    }

    const instructorUserId = instructor.userId;

    // Check if instructorId needs to be updated
    if (purchase.instructorId !== instructorUserId) {
      await db.update(classPurchases)
        .set({ instructorId: instructorUserId })
        .where(eq(classPurchases.id, purchase.id));
      console.log(`  ✅ Updated instructorId for class purchase #${purchase.id}`);
    }

    // Calculate earnings if not set
    if (!purchase.instructorEarnings || parseFloat(String(purchase.instructorEarnings)) === 0) {
      const pricePaid = parseFloat(String(purchase.pricePaid || 0));

      if (pricePaid > 0) {
        // Get seller's plan
        const [userRecord] = await db.select({ subscriptionPlan: users.subscriptionPlan })
          .from(users).where(eq(users.id, instructorUserId)).limit(1);

        const sellerPlan = userRecord?.subscriptionPlan || "starter";
        const planDef = PLANS[sellerPlan as PlanKey] || PLANS.starter;
        const commissionRate = planDef.commissionRate; // Class commission

        const platformFee = pricePaid * commissionRate;
        const instructorEarnings = pricePaid - platformFee;

        // Update purchase record
        await db.update(classPurchases)
          .set({
            platformFee: platformFee.toFixed(2) as any,
            instructorEarnings: instructorEarnings.toFixed(2) as any
          })
          .where(eq(classPurchases.id, purchase.id));

        // Add to balance
        await addEarnings({
          userId: instructorUserId,
          amount: instructorEarnings,
          description: `Class purchase: ${classItem.title} (Migration #${purchase.id})`,
          orderId: purchase.orderId || undefined,
        });

        totalEarningsAdded += instructorEarnings;
        console.log(`  💰 Added £${instructorEarnings.toFixed(2)} for class "${classItem.title}"`);
      }
    }

    totalProcessed++;
  }

  console.log(`✅ Processed ${totalProcessed} class purchases\n`);

  // ─── Summary ────────────────────────────────────────────────────────────────
  console.log("═══════════════════════════════════════════════════════");
  console.log(`✨ Migration completed successfully!`);
  console.log(`💰 Total earnings added: £${totalEarningsAdded.toFixed(2)}`);
  console.log("═══════════════════════════════════════════════════════\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  });
