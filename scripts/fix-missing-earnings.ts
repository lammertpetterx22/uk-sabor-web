#!/usr/bin/env tsx

import { getDb } from "../server/db";
import { eventTickets, events, users, instructors } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { addEarnings } from "../server/features/financials";
import { PLANS, PlanKey } from "../server/stripe/plans";

async function fixMissingEarnings() {
  console.log("💰 Fixing Missing Earnings Data\n");

  const db = await getDb();
  if (!db) {
    console.error("❌ Database connection failed");
    process.exit(1);
  }

  // Get tickets without earnings data
  const tickets = await db.select().from(eventTickets);
  const ticketsWithoutEarnings = tickets.filter(t => !t.platformFee || !t.instructorEarnings);

  console.log(`📊 Found ${ticketsWithoutEarnings.length} ticket(s) without earnings data\n`);

  for (const ticket of ticketsWithoutEarnings) {
    console.log(`\n🎫 Processing Ticket #${ticket.id}`);
    console.log(`   Event: #${ticket.eventId}`);
    console.log(`   Order: #${ticket.orderId}`);
    console.log(`   Price Paid: £${ticket.pricePaid}`);
    console.log(`   Quantity: ${ticket.quantity}`);

    // Get event info
    const [event] = await db.select().from(events).where(eq(events.id, ticket.eventId)).limit(1);
    if (!event) {
      console.log(`   ❌ Event not found`);
      continue;
    }

    console.log(`   Event Title: ${event.title}`);
    console.log(`   Creator ID: ${event.creatorId || 'NULL'}`);

    if (!event.creatorId) {
      console.log(`   ⚠️  No creator assigned to this event - skipping earnings`);
      continue;
    }

    // Get creator's subscription plan
    const [creator] = await db.select().from(users).where(eq(users.id, event.creatorId)).limit(1);
    const sellerPlan = creator?.subscriptionPlan || "starter";
    console.log(`   Creator Plan: ${sellerPlan}`);

    // Calculate earnings
    const pricePaidGBP = parseFloat(String(ticket.pricePaid));
    const netEarningsPence = Math.round(pricePaidGBP * 100);

    const planDef = PLANS[sellerPlan as PlanKey] || PLANS.starter;
    const commissionRate = planDef.commissionRate; // Event commission rate

    const commissionPence = Math.round(netEarningsPence * commissionRate);
    const platformFeeGBP = commissionPence / 100;
    const instructorEarningsGBP = (netEarningsPence - commissionPence) / 100;

    console.log(`   💵 Calculations:`);
    console.log(`      Net Earnings: £${(netEarningsPence / 100).toFixed(2)}`);
    console.log(`      Commission Rate: ${(commissionRate * 100).toFixed(1)}%`);
    console.log(`      Platform Fee: £${platformFeeGBP.toFixed(2)}`);
    console.log(`      Instructor Earnings: £${instructorEarningsGBP.toFixed(2)}`);

    // Update eventTicket with earnings data
    await db.update(eventTickets)
      .set({
        instructorId: event.creatorId,
        platformFee: platformFeeGBP.toFixed(2) as any,
        instructorEarnings: instructorEarningsGBP.toFixed(2) as any,
      })
      .where(eq(eventTickets.id, ticket.id));

    console.log(`   ✅ Updated eventTicket #${ticket.id} with earnings data`);

    // Add earnings to instructor's balance
    await addEarnings({
      userId: event.creatorId,
      amount: instructorEarningsGBP,
      description: `Sale: ${event.title} (Order #${ticket.orderId})`,
      orderId: ticket.orderId,
    });

    console.log(`   ✅ Added £${instructorEarningsGBP.toFixed(2)} to instructor balance`);
  }

  console.log("\n\n📊 SUMMARY:");
  console.log("━".repeat(80));
  console.log(`✅ Fixed ${ticketsWithoutEarnings.length} ticket(s)`);
}

fixMissingEarnings()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
