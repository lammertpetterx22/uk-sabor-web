#!/usr/bin/env tsx

import { getDb } from "../server/db";
import { eventTickets, coursePurchases, classPurchases, orders, events, courses, classes, instructors, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function checkEarnings() {
  console.log("💰 Checking Earnings Data\n");

  const db = await getDb();
  if (!db) {
    console.error("❌ Database connection failed");
    process.exit(1);
  }

  // Get all orders
  const allOrders = await db.select().from(orders);
  console.log(`📊 Total Orders: ${allOrders.length}\n`);

  // Check event tickets
  console.log("🎫 EVENT TICKETS:");
  console.log("━".repeat(80));
  const tickets = await db.select().from(eventTickets);

  for (const ticket of tickets) {
    const [order] = await db.select().from(orders).where(eq(orders.id, ticket.orderId)).limit(1);
    const [event] = await db.select().from(events).where(eq(events.id, ticket.eventId)).limit(1);

    console.log(`\nTicket ID: ${ticket.id}`);
    console.log(`  Order: #${ticket.orderId} (${order?.livemode ? 'LIVE' : 'TEST'})`);
    console.log(`  Event: #${ticket.eventId} - ${event?.title}`);
    console.log(`  User: #${ticket.userId}`);
    console.log(`  Price Paid: £${ticket.pricePaid}`);
    console.log(`  Platform Fee: £${ticket.platformFee || 'NULL'}`);
    console.log(`  Instructor Earnings: £${ticket.instructorEarnings || 'NULL'}`);
    console.log(`  Instructor ID: ${ticket.instructorId || 'NULL'}`);
    console.log(`  Quantity: ${ticket.quantity}`);
  }

  // Check course purchases
  console.log("\n\n📚 COURSE PURCHASES:");
  console.log("━".repeat(80));
  const coursePurch = await db.select().from(coursePurchases);

  for (const purchase of coursePurch) {
    const [order] = await db.select().from(orders).where(eq(orders.id, purchase.orderId)).limit(1);
    const [course] = await db.select().from(courses).where(eq(courses.id, purchase.courseId)).limit(1);

    console.log(`\nPurchase ID: ${purchase.id}`);
    console.log(`  Order: #${purchase.orderId} (${order?.livemode ? 'LIVE' : 'TEST'})`);
    console.log(`  Course: #${purchase.courseId} - ${course?.title}`);
    console.log(`  User: #${purchase.userId}`);
    console.log(`  Price Paid: £${purchase.pricePaid}`);
    console.log(`  Platform Fee: £${purchase.platformFee || 'NULL'}`);
    console.log(`  Instructor Earnings: £${purchase.instructorEarnings || 'NULL'}`);
    console.log(`  Instructor ID: ${purchase.instructorId || 'NULL'}`);
  }

  // Check class purchases
  console.log("\n\n💃 CLASS PURCHASES:");
  console.log("━".repeat(80));
  const classPurch = await db.select().from(classPurchases);

  for (const purchase of classPurch) {
    const [order] = await db.select().from(orders).where(eq(orders.id, purchase.orderId)).limit(1);
    const [classItem] = await db.select().from(classes).where(eq(classes.id, purchase.classId)).limit(1);

    console.log(`\nPurchase ID: ${purchase.id}`);
    console.log(`  Order: #${purchase.orderId} (${order?.livemode ? 'LIVE' : 'TEST'})`);
    console.log(`  Class: #${purchase.classId} - ${classItem?.title}`);
    console.log(`  User: #${purchase.userId}`);
    console.log(`  Price Paid: £${purchase.pricePaid}`);
    console.log(`  Platform Fee: £${purchase.platformFee || 'NULL'}`);
    console.log(`  Instructor Earnings: £${purchase.instructorEarnings || 'NULL'}`);
    console.log(`  Instructor ID: ${purchase.instructorId || 'NULL'}`);
  }

  // Summary
  console.log("\n\n📊 SUMMARY:");
  console.log("━".repeat(80));

  const ticketsWithEarnings = tickets.filter(t => t.platformFee && t.instructorEarnings);
  const coursesWithEarnings = coursePurch.filter(c => c.platformFee && c.instructorEarnings);
  const classesWithEarnings = classPurch.filter(c => c.platformFee && c.instructorEarnings);

  console.log(`Event Tickets with Earnings: ${ticketsWithEarnings.length} / ${tickets.length}`);
  console.log(`Course Purchases with Earnings: ${coursesWithEarnings.length} / ${coursePurch.length}`);
  console.log(`Class Purchases with Earnings: ${classesWithEarnings.length} / ${classPurch.length}`);

  const missingEarnings = tickets.length + coursePurch.length + classPurch.length -
                          ticketsWithEarnings.length - coursesWithEarnings.length - classesWithEarnings.length;

  if (missingEarnings > 0) {
    console.log(`\n⚠️  ${missingEarnings} purchase(s) are missing earnings data!`);
  } else {
    console.log(`\n✅ All purchases have earnings data`);
  }
}

checkEarnings()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
