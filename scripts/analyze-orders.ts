#!/usr/bin/env tsx
/**
 * Analyze all orders in detail
 * Run: npx tsx scripts/analyze-orders.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set!');
  process.exit(1);
}

console.log('\n💰 Detailed Orders Analysis\n');
console.log('━'.repeat(80));

async function main() {
  const client = postgres(DATABASE_URL!);

  try {
    // Get all orders
    const allOrders = await client`SELECT * FROM orders ORDER BY "createdAt" DESC`;

    console.log(`\n📊 Found ${allOrders.length} total order(s)\n`);

    if (allOrders.length === 0) {
      console.log('✅ No orders in database - CRM is completely clean!\n');
      await client.end();
      return;
    }

    // Group by status
    const statusGroups: Record<string, number> = {};
    const livemodeGroups = { test: 0, live: 0 };

    allOrders.forEach((order: any) => {
      statusGroups[order.status] = (statusGroups[order.status] || 0) + 1;
      if (order.livemode) {
        livemodeGroups.live++;
      } else {
        livemodeGroups.test++;
      }
    });

    console.log('━'.repeat(80));
    console.log('\n📈 Orders by Status:\n');
    Object.entries(statusGroups).forEach(([status, count]) => {
      console.log(`   ${status.padEnd(20)} : ${count} order(s)`);
    });

    console.log('\n━'.repeat(80));
    console.log('\n🎯 Orders by Mode:\n');
    console.log(`   🟠 TEST (livemode = false) : ${livemodeGroups.test} order(s)`);
    console.log(`   🟢 LIVE (livemode = true)  : ${livemodeGroups.live} order(s)`);

    // Show first 10 orders in detail
    console.log('\n━'.repeat(80));
    console.log(`\n📋 Recent Orders (showing first 10):\n`);

    allOrders.slice(0, 10).forEach((order: any, i: number) => {
      console.log(`${i + 1}. Order #${order.id}`);
      console.log(`   ├─ User ID: ${order.userId}`);
      console.log(`   ├─ Type: ${order.itemType}`);
      console.log(`   ├─ Item ID: ${order.itemId}`);
      console.log(`   ├─ Amount: £${order.amount}`);
      console.log(`   ├─ Status: ${order.status}`);
      console.log(`   ├─ Mode: ${order.livemode ? '🟢 LIVE' : '🟠 TEST'}`);
      console.log(`   ├─ Stripe ID: ${order.stripePaymentIntentId || 'N/A'}`);
      console.log(`   ├─ Created: ${new Date(order.createdAt).toISOString()}`);
      console.log(`   └─ Updated: ${new Date(order.updatedAt).toISOString()}\n`);
    });

    if (allOrders.length > 10) {
      console.log(`   ... and ${allOrders.length - 10} more order(s)\n`);
    }

    // Check if these are actually paid
    const paidOrders = allOrders.filter((o: any) => o.status === 'paid' || o.status === 'succeeded');
    const unpaidOrders = allOrders.filter((o: any) => o.status !== 'paid' && o.status !== 'succeeded');

    console.log('━'.repeat(80));
    console.log('\n💵 Payment Status:\n');
    console.log(`   ✅ Paid/Succeeded : ${paidOrders.length} order(s)`);
    console.log(`   ⏳ Unpaid/Pending : ${unpaidOrders.length} order(s)`);

    // Calculate actual revenue
    const totalRevenue = paidOrders.reduce((sum: number, o: any) => {
      return sum + parseFloat(o.amount || '0');
    }, 0);

    console.log(`   💰 Total Revenue  : £${totalRevenue.toFixed(2)}`);

    // Recommendation
    console.log('\n━'.repeat(80));
    console.log('\n🎯 Recommendations:\n');

    if (livemodeGroups.test > 0) {
      console.log(`   ⚠️  You have ${livemodeGroups.test} TEST orders (livemode = false)`);
      console.log('   👉 Run: npx tsx scripts/cleanup-test-sales.ts to remove them\n');
    }

    if (unpaidOrders.length > 0 && livemodeGroups.live > 0) {
      console.log(`   ⚠️  You have ${unpaidOrders.length} unpaid LIVE orders`);
      console.log('   👉 These might be abandoned checkouts or failed payments\n');
    }

    if (livemodeGroups.test === 0 && unpaidOrders.length === 0) {
      console.log('   ✅ Database is clean! No test orders or unpaid transactions.\n');
    }

    console.log('━'.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
