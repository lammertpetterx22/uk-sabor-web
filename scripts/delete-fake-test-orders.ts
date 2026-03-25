#!/usr/bin/env tsx
/**
 * Delete all orders with fake test Stripe IDs
 * These are orders created during development with simulated payment intents
 *
 * Run: npx tsx scripts/delete-fake-test-orders.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set!');
  process.exit(1);
}

console.log('\n🗑️  Delete Fake Test Orders\n');
console.log('━'.repeat(80));

async function main() {
  const client = postgres(DATABASE_URL!);

  try {
    // Find all orders with fake test Stripe IDs
    console.log('\n🔍 Finding orders with fake/test Stripe IDs...\n');

    const fakeOrders = await client`
      SELECT * FROM orders
      WHERE "stripePaymentIntentId" LIKE 'pi_test_%'
         OR "stripePaymentIntentId" LIKE 'pi_live_test_%'
         OR "stripePaymentIntentId" IS NULL
      ORDER BY "createdAt" DESC
    `;

    if (fakeOrders.length === 0) {
      console.log('✅ No fake test orders found!\n');
      await client.end();
      return;
    }

    console.log(`⚠️  Found ${fakeOrders.length} order(s) with fake/test Stripe IDs:\n`);

    fakeOrders.forEach((order: any, i: number) => {
      console.log(`${i + 1}. Order #${order.id}`);
      console.log(`   ├─ User ID: ${order.userId}`);
      console.log(`   ├─ Type: ${order.itemType}`);
      console.log(`   ├─ Amount: £${order.amount}`);
      console.log(`   ├─ Status: ${order.status}`);
      console.log(`   ├─ Stripe ID: ${order.stripePaymentIntentId || 'NULL (no payment)'}`);
      console.log(`   └─ Created: ${new Date(order.createdAt).toISOString().split('T')[0]}\n`);
    });

    console.log('━'.repeat(80));
    console.log('\n⚠️  WARNING: This will permanently delete:\n');
    console.log(`   • ${fakeOrders.length} fake test order(s)`);
    console.log(`   • All event tickets linked to these orders`);
    console.log(`   • All course purchases linked to these orders`);
    console.log(`   • All class purchases linked to these orders\n`);
    console.log('━'.repeat(80));

    // Get order IDs
    const orderIds = fakeOrders.map((o: any) => o.id);

    // Count related records
    let eventTicketsCount = 0;
    let coursePurchasesCount = 0;
    let classPurchasesCount = 0;

    for (const orderId of orderIds) {
      const tickets = await client`
        SELECT COUNT(*) FROM "eventTickets" WHERE "orderId" = ${orderId}
      `;
      eventTicketsCount += parseInt(tickets[0]?.count || '0');

      const courses = await client`
        SELECT COUNT(*) FROM "coursePurchases" WHERE "orderId" = ${orderId}
      `;
      coursePurchasesCount += parseInt(courses[0]?.count || '0');

      const classes = await client`
        SELECT COUNT(*) FROM "classPurchases" WHERE "orderId" = ${orderId}
      `;
      classPurchasesCount += parseInt(classes[0]?.count || '0');
    }

    console.log(`\n📦 Related records to delete:\n`);
    console.log(`   • ${eventTicketsCount} event ticket(s)`);
    console.log(`   • ${coursePurchasesCount} course purchase(s)`);
    console.log(`   • ${classPurchasesCount} class purchase(s)\n`);
    console.log('━'.repeat(80));

    console.log('\n🗑️  Starting deletion process...\n');

    // Step 1: Delete event tickets
    if (eventTicketsCount > 0) {
      console.log(`   Deleting ${eventTicketsCount} event ticket(s)...`);
      for (const orderId of orderIds) {
        await client`DELETE FROM "eventTickets" WHERE "orderId" = ${orderId}`;
      }
      console.log(`   ✅ Deleted ${eventTicketsCount} event ticket(s)\n`);
    }

    // Step 2: Delete course purchases
    if (coursePurchasesCount > 0) {
      console.log(`   Deleting ${coursePurchasesCount} course purchase(s)...`);
      for (const orderId of orderIds) {
        await client`DELETE FROM "coursePurchases" WHERE "orderId" = ${orderId}`;
      }
      console.log(`   ✅ Deleted ${coursePurchasesCount} course purchase(s)\n`);
    }

    // Step 3: Delete class purchases
    if (classPurchasesCount > 0) {
      console.log(`   Deleting ${classPurchasesCount} class purchase(s)...`);
      for (const orderId of orderIds) {
        await client`DELETE FROM "classPurchases" WHERE "orderId" = ${orderId}`;
      }
      console.log(`   ✅ Deleted ${classPurchasesCount} class purchase(s)\n`);
    }

    // Step 4: Delete the orders
    console.log(`   Deleting ${fakeOrders.length} fake test order(s)...`);
    await client`
      DELETE FROM orders
      WHERE "stripePaymentIntentId" LIKE 'pi_test_%'
         OR "stripePaymentIntentId" LIKE 'pi_live_test_%'
         OR "stripePaymentIntentId" IS NULL
    `;
    console.log(`   ✅ Deleted ${fakeOrders.length} fake test order(s)\n`);

    console.log('━'.repeat(80));
    console.log('\n🎉 Cleanup completed successfully!\n');
    console.log('Summary:');
    console.log(`   • ${fakeOrders.length} fake test orders deleted`);
    console.log(`   • ${eventTicketsCount} event tickets deleted`);
    console.log(`   • ${coursePurchasesCount} course purchases deleted`);
    console.log(`   • ${classPurchasesCount} class purchases deleted\n`);
    console.log('✅ Your CRM is now clean!\n');
    console.log('━'.repeat(80) + '\n');

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
