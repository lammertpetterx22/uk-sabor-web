#!/usr/bin/env tsx
/**
 * Fix Stripe Fee Discrepancy
 *
 * Problem: Orders #35 and #36 were placed BEFORE we added Stripe processing fees
 * to the checkout. The customers only paid £5.00 per ticket, but Stripe deducted
 * their fees (1.5% + 20p) from this amount.
 *
 * Result:
 * - Database shows: £9.60 available (£4.80 × 2)
 * - Stripe shows: £9.44 available (after deducting £0.56 in Stripe fees)
 *
 * Solution: Deduct the Stripe fees from the instructor earnings for these 2 orders
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, sql } from 'drizzle-orm';
import { eventTickets, users, orders } from '../drizzle/schema.js';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set!');
  process.exit(1);
}

async function fixStripeFeeDiscrepancy() {
  const client = postgres(DATABASE_URL!);
  const db = drizzle(client);

  console.log("🔧 Fixing Stripe Fee Discrepancy\n");

  // Get orders #35 and #36
  const orderIds = [35, 36];
  let totalAdjustment = 0;
  let userId: number | null = null;

  for (const orderId of orderIds) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Order #${orderId}`);

    // Get the ticket
    const tickets = await db.select()
      .from(eventTickets)
      .where(eq(eventTickets.orderId, orderId));

    if (tickets.length === 0) {
      console.log(`❌ No tickets found`);
      continue;
    }

    const ticket = tickets[0];
    userId = ticket.instructorId;

    console.log(`\nCURRENT VALUES:`);
    console.log(`Price Paid: £${ticket.pricePaid}`);
    console.log(`Platform Fee: £${ticket.platformFee}`);
    console.log(`Instructor Earnings: £${ticket.instructorEarnings}`);

    // Calculate what it SHOULD be
    // Customer paid: £5.00
    // Stripe fee: 1.5% + 20p = £0.075 + £0.20 = £0.275 ≈ £0.28
    const pricePaid = Number(ticket.pricePaid);
    const stripeFee = Math.round(pricePaid * 100 * 0.015 + 20) / 100; // 1.5% + 20p
    const netAfterStripeFee = pricePaid - stripeFee;

    // Platform fee: 4% of net amount (admin has 4% commission for "creator" plan)
    const platformFee = Math.round(netAfterStripeFee * 100 * 0.04) / 100;
    const instructorEarnings = netAfterStripeFee - platformFee;

    console.log(`\nCORRECTED VALUES:`);
    console.log(`Price Paid: £${pricePaid.toFixed(2)}`);
    console.log(`Stripe Fee: £${stripeFee.toFixed(2)} (customer didn't pay this)`);
    console.log(`Net After Stripe: £${netAfterStripeFee.toFixed(2)}`);
    console.log(`Platform Fee (4%): £${platformFee.toFixed(2)}`);
    console.log(`Instructor Earnings: £${instructorEarnings.toFixed(2)}`);

    const oldInstructorEarnings = Number(ticket.instructorEarnings);
    const earningsDifference = oldInstructorEarnings - instructorEarnings;
    totalAdjustment += earningsDifference;

    console.log(`\n💰 ADJUSTMENT:`);
    console.log(`Old Instructor Earnings: £${oldInstructorEarnings.toFixed(2)}`);
    console.log(`New Instructor Earnings: £${instructorEarnings.toFixed(2)}`);
    console.log(`Difference: -£${earningsDifference.toFixed(2)}`);

    // Update the ticket
    await db.update(eventTickets)
      .set({
        platformFee: platformFee.toFixed(2),
        instructorEarnings: instructorEarnings.toFixed(2),
      })
      .where(eq(eventTickets.id, ticket.id));

    console.log(`✅ Ticket #${ticket.id} updated`);
  }

  // Adjust user balance
  if (userId) {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user) {
      const oldBalance = Number(user.balance || 0);
      const newBalance = oldBalance - totalAdjustment;

      await db.update(users)
        .set({
          balance: sql`${newBalance.toFixed(2)}`,
        })
        .where(eq(users.id, userId));

      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`👤 User #${userId} balance updated:`);
      console.log(`Old Balance: £${oldBalance.toFixed(2)}`);
      console.log(`New Balance: £${newBalance.toFixed(2)}`);
      console.log(`Total Adjustment: -£${totalAdjustment.toFixed(2)}`);
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\n📊 SUMMARY:`);
  console.log(`Fixed 2 orders that were missing Stripe fee deductions`);
  console.log(`Total adjustment: -£${totalAdjustment.toFixed(2)}`);
  console.log(`\n✅ Now your database balance should match Stripe balance!`);
  console.log(`\nEXPLANATION:`);
  console.log(`These 2 tickets were sold BEFORE we added Stripe processing fees`);
  console.log(`to the checkout. Customers only paid £5.00 per ticket, but Stripe`);
  console.log(`deducted their fees (£0.28 per ticket) from that amount.`);
  console.log(`\nSo the real money you received in Stripe is £9.44, not £9.60.`);

  await client.end();
}

fixStripeFeeDiscrepancy().catch(console.error);
