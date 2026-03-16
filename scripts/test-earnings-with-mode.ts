#!/usr/bin/env tsx
/**
 * Test script to verify earnings system handles both test and live transactions
 *
 * This script:
 * 1. Checks if orders have livemode field populated
 * 2. Verifies earnings are calculated for both test and live orders
 * 3. Shows breakdown of test vs live earnings per instructor
 */

import { getDb } from "../server/db";
import { orders, balances, ledgerTransactions, coursePurchases, eventTickets, classPurchases } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

async function testEarningsWithMode() {
  console.log("🔍 Testing Earnings System with Test/Live Mode Support\n");
  console.log("═".repeat(60));

  const db = await getDb();
  if (!db) {
    console.error("❌ Database not available");
    return;
  }

  // 1. Check orders table for livemode data
  console.log("\n📊 Step 1: Checking orders table...\n");

  const allOrders = await db.select({
    id: orders.id,
    userId: orders.userId,
    amount: orders.amount,
    status: orders.status,
    itemType: orders.itemType,
    livemode: orders.livemode,
    createdAt: orders.createdAt,
  }).from(orders).orderBy(orders.createdAt);

  if (allOrders.length === 0) {
    console.log("   ℹ️  No orders found in database");
  } else {
    const testOrders = allOrders.filter(o => o.livemode === false);
    const liveOrders = allOrders.filter(o => o.livemode === true);

    console.log(`   ✅ Total orders: ${allOrders.length}`);
    console.log(`   🧪 Test orders: ${testOrders.length}`);
    console.log(`   💰 Live orders: ${liveOrders.length}`);

    // Show sample orders
    if (testOrders.length > 0) {
      console.log("\n   📋 Sample Test Orders:");
      testOrders.slice(0, 3).forEach(o => {
        console.log(`      #${o.id} - ${o.itemType} - £${o.amount} - ${o.status}`);
      });
    }
  }

  // 2. Check balances and earnings
  console.log("\n\n📊 Step 2: Checking instructor balances...\n");

  const allBalances = await db.select().from(balances);

  if (allBalances.length === 0) {
    console.log("   ℹ️  No instructor balances found");
  } else {
    console.log(`   ✅ Found ${allBalances.length} instructor balance(s)\n`);

    for (const balance of allBalances) {
      console.log(`   👤 Instructor ID: ${balance.userId}`);
      console.log(`      💵 Current Balance: £${balance.currentBalance}`);
      console.log(`      ⏳ Pending Balance: £${balance.pendingBalance}`);
      console.log(`      📈 Total Earned: £${balance.totalEarned}`);
      console.log(`      📤 Total Withdrawn: £${balance.totalWithdrawn}`);

      // Get breakdown of test vs live earnings
      const ledger = await db.select({
        description: ledgerTransactions.description,
        amount: ledgerTransactions.amount,
        type: ledgerTransactions.type,
        status: ledgerTransactions.status,
        orderId: ledgerTransactions.orderId,
      }).from(ledgerTransactions)
        .where(eq(ledgerTransactions.userId, balance.userId))
        .orderBy(ledgerTransactions.createdAt);

      if (ledger.length > 0) {
        console.log(`\n      📒 Ledger Transactions (${ledger.length}):`);

        let testEarnings = 0;
        let liveEarnings = 0;

        for (const tx of ledger) {
          const isTest = tx.description.toLowerCase().includes('test');
          const amount = parseFloat(String(tx.amount));

          if (tx.type === 'earning' && amount > 0) {
            if (isTest) {
              testEarnings += amount;
              console.log(`         🧪 TEST: ${tx.description} - £${amount.toFixed(2)}`);
            } else {
              liveEarnings += amount;
              console.log(`         💰 LIVE: ${tx.description} - £${amount.toFixed(2)}`);
            }
          } else {
            console.log(`         📤 ${tx.type.toUpperCase()}: ${tx.description} - £${amount.toFixed(2)}`);
          }
        }

        console.log(`\n      📊 Earnings Summary:`);
        console.log(`         🧪 Test Earnings: £${testEarnings.toFixed(2)}`);
        console.log(`         💰 Live Earnings: £${liveEarnings.toFixed(2)}`);
        console.log(`         📈 Total: £${(testEarnings + liveEarnings).toFixed(2)}`);
      }

      console.log("");
    }
  }

  // 3. Check purchase tables for test transactions
  console.log("\n📊 Step 3: Checking purchase records...\n");

  const coursePurchasesList = await db.select().from(coursePurchases);
  const eventTicketsList = await db.select().from(eventTickets);
  const classPurchasesList = await db.select().from(classPurchases);

  console.log(`   📚 Course purchases: ${coursePurchasesList.length}`);
  console.log(`   🎫 Event tickets: ${eventTicketsList.length}`);
  console.log(`   💃 Class purchases: ${classPurchasesList.length}`);

  // 4. Summary and recommendations
  console.log("\n\n═".repeat(60));
  console.log("\n🎯 DIAGNOSIS:\n");

  if (allOrders.length === 0) {
    console.log("   ❌ No orders found - Create a test purchase to verify webhook");
  } else {
    const testOrdersCount = allOrders.filter(o => o.livemode === false).length;
    const hasEarnings = allBalances.some(b => parseFloat(String(b.totalEarned)) > 0);

    if (testOrdersCount > 0 && !hasEarnings) {
      console.log("   ❌ PROBLEM FOUND: Test orders exist but no earnings recorded!");
      console.log("   💡 Possible causes:");
      console.log("      1. Webhook is not processing earnings for test orders");
      console.log("      2. creatorUserId is null/invalid");
      console.log("      3. netEarningsPence is 0 or negative");
      console.log("      4. metadata.ticket_price_pence is missing");
      console.log("\n   🔧 Check server logs for webhook error messages");
    } else if (testOrdersCount > 0 && hasEarnings) {
      console.log("   ✅ System is working! Test orders are creating earnings.");
      console.log("   💡 If dashboard shows £0, verify frontend is fetching data correctly");
    } else if (testOrdersCount === 0) {
      console.log("   ℹ️  No test orders found yet");
      console.log("   💡 Create a test purchase using Stripe test card: 4242 4242 4242 4242");
    }
  }

  console.log("\n═".repeat(60));
  console.log("\n✅ Test complete!\n");
}

testEarningsWithMode().catch(console.error);
