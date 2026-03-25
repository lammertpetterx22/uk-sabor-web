#!/usr/bin/env tsx
/**
 * Script to clean up all TEST sales from the database
 * This deletes all orders where livemode = false (test transactions)
 *
 * Run: npx tsx scripts/cleanup-test-sales.ts
 *
 * WARNING: This will permanently delete test data!
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { orders, eventTickets, coursePurchases, classPurchases } from '../drizzle/schema.js';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set!');
  console.error('   Please configure it in your .env file');
  process.exit(1);
}

console.log('\n🧹 Test Sales Cleanup Script\n');
console.log('━'.repeat(60));

async function main() {
  console.log('\n📊 Connecting to database...\n');

  const client = postgres(DATABASE_URL!);
  const db = drizzle(client);

  try {
    // Step 1: Find all test orders
    console.log('🔍 Finding test orders (livemode = false)...\n');

    const testOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.livemode, false));

    if (testOrders.length === 0) {
      console.log('✅ No test sales found! Database is already clean.\n');
      await client.end();
      return;
    }

    console.log(`Found ${testOrders.length} test order(s):\n`);

    testOrders.forEach((order, i) => {
      console.log(`   ${i + 1}. Order #${order.id}`);
      console.log(`      ├─ User ID: ${order.userId}`);
      console.log(`      ├─ Type: ${order.itemType}`);
      console.log(`      ├─ Item ID: ${order.itemId}`);
      console.log(`      ├─ Amount: £${order.amount}`);
      console.log(`      ├─ Status: ${order.status}`);
      console.log(`      ├─ Stripe ID: ${order.stripePaymentIntentId || 'N/A'}`);
      console.log(`      └─ Date: ${order.createdAt.toISOString()}\n`);
    });

    // Get order IDs
    const testOrderIds = testOrders.map(o => o.id);

    console.log('━'.repeat(60));
    console.log('\n⚠️  WARNING: This will delete the following:\n');
    console.log(`   • ${testOrders.length} test order(s)`);
    console.log(`   • All event tickets linked to these orders`);
    console.log(`   • All course purchases linked to these orders`);
    console.log(`   • All class purchases linked to these orders\n`);
    console.log('━'.repeat(60));

    // Count related records
    let eventTicketsCount = 0;
    let coursePurchasesCount = 0;
    let classPurchasesCount = 0;

    for (const orderId of testOrderIds) {
      const tickets = await db
        .select()
        .from(eventTickets)
        .where(eq(eventTickets.orderId, orderId));
      eventTicketsCount += tickets.length;

      const courses = await db
        .select()
        .from(coursePurchases)
        .where(eq(coursePurchases.orderId, orderId));
      coursePurchasesCount += courses.length;

      const classes = await db
        .select()
        .from(classPurchases)
        .where(eq(classPurchases.orderId, orderId));
      classPurchasesCount += classes.length;
    }

    console.log(`\n📦 Related records to delete:\n`);
    console.log(`   • ${eventTicketsCount} event ticket(s)`);
    console.log(`   • ${coursePurchasesCount} course purchase(s)`);
    console.log(`   • ${classPurchasesCount} class purchase(s)\n`);

    // Confirmation prompt (auto-confirm in this case)
    console.log('🗑️  Starting deletion process...\n');

    // Step 2: Delete event tickets linked to test orders
    if (eventTicketsCount > 0) {
      console.log(`   Deleting ${eventTicketsCount} event ticket(s)...`);
      for (const orderId of testOrderIds) {
        await db.delete(eventTickets).where(eq(eventTickets.orderId, orderId));
      }
      console.log(`   ✅ Deleted ${eventTicketsCount} event ticket(s)\n`);
    }

    // Step 3: Delete course purchases linked to test orders
    if (coursePurchasesCount > 0) {
      console.log(`   Deleting ${coursePurchasesCount} course purchase(s)...`);
      for (const orderId of testOrderIds) {
        await db.delete(coursePurchases).where(eq(coursePurchases.orderId, orderId));
      }
      console.log(`   ✅ Deleted ${coursePurchasesCount} course purchase(s)\n`);
    }

    // Step 4: Delete class purchases linked to test orders
    if (classPurchasesCount > 0) {
      console.log(`   Deleting ${classPurchasesCount} class purchase(s)...`);
      for (const orderId of testOrderIds) {
        await db.delete(classPurchases).where(eq(classPurchases.orderId, orderId));
      }
      console.log(`   ✅ Deleted ${classPurchasesCount} class purchase(s)\n`);
    }

    // Step 5: Delete the test orders themselves
    console.log(`   Deleting ${testOrders.length} test order(s)...`);
    await db.delete(orders).where(eq(orders.livemode, false));
    console.log(`   ✅ Deleted ${testOrders.length} test order(s)\n`);

    console.log('━'.repeat(60));
    console.log('\n🎉 Cleanup completed successfully!\n');
    console.log('Summary:');
    console.log(`   • ${testOrders.length} test orders deleted`);
    console.log(`   • ${eventTicketsCount} event tickets deleted`);
    console.log(`   • ${coursePurchasesCount} course purchases deleted`);
    console.log(`   • ${classPurchasesCount} class purchases deleted\n`);
    console.log('✅ Your CRM is now clean and ready for production!\n');
    console.log('━'.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
