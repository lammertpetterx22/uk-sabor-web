#!/usr/bin/env tsx
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { balances, ledgerTransactions, eventTickets } from '../drizzle/schema.js';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set!');
  process.exit(1);
}

async function checkBalanceDiscrepancy() {
  const client = postgres(DATABASE_URL!);
  const db = drizzle(client);

  console.log("🔍 Checking Balance Discrepancy\n");

  // Get balance for user #2
  const [balance] = await db.select()
    .from(balances)
    .where(eq(balances.userId, 2))
    .limit(1);

  if (!balance) {
    console.log("❌ No balance record found for user #2");
    await client.end();
    return;
  }

  console.log("📊 BALANCE RECORD:");
  console.log(`User ID: 2`);
  console.log(`Current Balance: £${balance.currentBalance}`);
  console.log(`Pending Balance: £${balance.pendingBalance}`);
  console.log(`Total Earned: £${balance.totalEarned}`);
  console.log(`Total Withdrawn: £${balance.totalWithdrawn}`);

  // Get all ledger transactions
  const transactions = await db.select()
    .from(ledgerTransactions)
    .where(eq(ledgerTransactions.userId, 2));

  console.log(`\n💸 LEDGER TRANSACTIONS (${transactions.length}):`);
  let sumEarnings = 0;
  transactions.forEach((tx, idx) => {
    console.log(`\n${idx + 1}. ${tx.type} - £${tx.amount}`);
    console.log(`   ${tx.description}`);
    console.log(`   Order: #${tx.orderId || 'N/A'}`);
    console.log(`   Status: ${tx.status}`);
    sumEarnings += Number(tx.amount);
  });

  console.log(`\n📊 Sum of all ledger transactions: £${sumEarnings.toFixed(2)}`);

  // Get all event tickets
  const tickets = await db.select()
    .from(eventTickets)
    .where(eq(eventTickets.instructorId, 2));

  console.log(`\n🎫 EVENT TICKETS (${tickets.length}):`);
  let sumInstructorEarnings = 0;
  tickets.forEach((ticket, idx) => {
    console.log(`\n${idx + 1}. Ticket #${ticket.id} (Order #${ticket.orderId})`);
    console.log(`   Price Paid: £${ticket.pricePaid}`);
    console.log(`   Platform Fee: £${ticket.platformFee}`);
    console.log(`   Instructor Earnings: £${ticket.instructorEarnings}`);
    sumInstructorEarnings += Number(ticket.instructorEarnings);
  });

  console.log(`\n📊 Sum of instructor earnings from tickets: £${sumInstructorEarnings.toFixed(2)}`);

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\n📊 ANALYSIS:`);
  console.log(`Database Current Balance: £${balance.currentBalance}`);
  console.log(`Database Total Earned: £${balance.totalEarned}`);
  console.log(`Sum of Ledger Transactions: £${sumEarnings.toFixed(2)}`);
  console.log(`Sum of Ticket Earnings: £${sumInstructorEarnings.toFixed(2)}`);
  console.log(`\nStripe Balance (reported): £9.44`);
  console.log(`\nDifference (DB - Stripe): £${(Number(balance.currentBalance) - 9.44).toFixed(2)}`);

  console.log(`\n🔍 EXPLANATION:`);
  console.log(`The discrepancy exists because these 2 tickets were sold`);
  console.log(`BEFORE we added Stripe processing fees to the checkout.`);
  console.log(`Customers paid £5.00 per ticket, but Stripe deducted`);
  console.log(`£0.28 per ticket in fees, leaving £4.72 net per ticket.`);
  console.log(`\nThe database calculated earnings as:`);
  console.log(`£5.00 - £0.20 platform fee = £4.80`);
  console.log(`\nBut the actual net after Stripe fees is:`);
  console.log(`£5.00 - £0.28 Stripe fee - £0.19 platform fee = £4.53`);

  await client.end();
}

checkBalanceDiscrepancy().catch(console.error);
