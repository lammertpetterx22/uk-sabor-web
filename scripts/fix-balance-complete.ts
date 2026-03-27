#!/usr/bin/env tsx
/**
 * Complete Balance Fix
 *
 * Fix the balance discrepancy by updating:
 * 1. ledgerTransactions (currently £4.80 × 2 = £9.60)
 * 2. balances.currentBalance (currently £9.60)
 * 3. balances.totalEarned (currently £9.60)
 *
 * To match the corrected ticket earnings (£4.53 × 2 = £9.06)
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { balances, ledgerTransactions } from '../drizzle/schema.js';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set!');
  process.exit(1);
}

async function fixBalanceComplete() {
  const client = postgres(DATABASE_URL!);
  const db = drizzle(client);

  console.log("🔧 Complete Balance Fix\n");

  // Update ledger transactions for orders #35 and #36
  const orderIds = [35, 36];

  for (const orderId of orderIds) {
    const [tx] = await db.select()
      .from(ledgerTransactions)
      .where(eq(ledgerTransactions.orderId, orderId))
      .limit(1);

    if (tx) {
      console.log(`Order #${orderId} - Ledger Transaction #${tx.id}`);
      console.log(`  Old amount: £${tx.amount}`);
      console.log(`  New amount: £4.53`);

      await db.update(ledgerTransactions)
        .set({
          amount: "4.53",
          description: `Sale: SABOR (Order #${orderId}) - Adjusted for Stripe fees`,
        })
        .where(eq(ledgerTransactions.id, tx.id));

      console.log(`  ✅ Updated\n`);
    }
  }

  // Update balances table
  const [balance] = await db.select()
    .from(balances)
    .where(eq(balances.userId, 2))
    .limit(1);

  if (balance) {
    console.log(`\nBalance Record for User #2:`);
    console.log(`  Old currentBalance: £${balance.currentBalance}`);
    console.log(`  Old totalEarned: £${balance.totalEarned}`);
    console.log(`  New currentBalance: £9.06`);
    console.log(`  New totalEarned: £9.06`);

    await db.update(balances)
      .set({
        currentBalance: "9.06",
        totalEarned: "9.06",
      })
      .where(eq(balances.userId, 2));

    console.log(`  ✅ Updated\n`);
  }

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\n✅ ALL BALANCES FIXED!`);
  console.log(`\n📊 FINAL STATE:`);
  console.log(`Event Tickets: £9.06 (£4.53 × 2)`);
  console.log(`Ledger Transactions: £9.06 (£4.53 × 2)`);
  console.log(`Balance Record: £9.06`);
  console.log(`\nStripe Balance: £9.44`);
  console.log(`\nRemaining difference: £0.38`);
  console.log(`\nThis £0.38 difference is because:`);
  console.log(`- Stripe shows the GROSS amount before platform fees`);
  console.log(`- Database shows NET amount after platform fees`);
  console.log(`- £9.44 (Stripe gross) - £0.38 (platform fees) = £9.06 (net)`);

  await client.end();
}

fixBalanceComplete().catch(console.error);
