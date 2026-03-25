#!/usr/bin/env tsx

/**
 * Fix event #13 ticketsSold counter
 * This script manually updates the ticketsSold count for event #13
 * to reflect the 2 purchases that were made before the fix was deployed
 */

import { getDb } from "../server/db";
import { events, eventTickets } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function fixEventCounter() {
  console.log("🔍 Checking event #13 ticket sales...\n");

  const db = await getDb();
  if (!db) {
    console.error("❌ Database connection failed");
    process.exit(1);
  }

  // Get current event data
  const [event] = await db.select().from(events).where(eq(events.id, 13)).limit(1);

  if (!event) {
    console.error("❌ Event #13 not found");
    process.exit(1);
  }

  console.log("📊 Current Event #13 Status:");
  console.log(`   Title: ${event.title}`);
  console.log(`   Max Tickets: ${event.maxTickets}`);
  console.log(`   Tickets Sold (current): ${event.ticketsSold || 0}`);

  // Count actual ticket purchases
  const tickets = await db.select().from(eventTickets).where(eq(eventTickets.eventId, 13));

  console.log(`\n🎫 Actual Purchases:`);
  console.log(`   Total tickets purchased: ${tickets.length}`);

  let totalQuantity = 0;
  tickets.forEach((ticket, index) => {
    const qty = ticket.quantity || 1;
    totalQuantity += qty;
    console.log(`   ${index + 1}. Order #${ticket.orderId} - User #${ticket.userId} - Quantity: ${qty}`);
  });

  console.log(`   Total quantity sold: ${totalQuantity}`);

  // Update the counter
  if (totalQuantity !== event.ticketsSold) {
    console.log(`\n⚠️  Mismatch detected! Updating ticketsSold from ${event.ticketsSold || 0} to ${totalQuantity}...`);

    await db.update(events)
      .set({ ticketsSold: totalQuantity })
      .where(eq(events.id, 13));

    console.log(`✅ Event #13 ticketsSold updated to ${totalQuantity}`);
  } else {
    console.log(`\n✅ Counter is already correct (${totalQuantity})`);
  }

  // Verify the update
  const [updatedEvent] = await db.select().from(events).where(eq(events.id, 13)).limit(1);
  console.log(`\n📊 Final Event #13 Status:`);
  console.log(`   Tickets Sold: ${updatedEvent.ticketsSold || 0} / ${updatedEvent.maxTickets}`);
  console.log(`   Spots Remaining: ${updatedEvent.maxTickets! - (updatedEvent.ticketsSold || 0)}`);
}

fixEventCounter()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
