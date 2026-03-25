#!/usr/bin/env tsx
/**
 * DELETE ALL ORDERS from the database
 * ⚠️  WARNING: This is irreversible! Use only to start fresh.
 *
 * Run: npx tsx scripts/delete-all-orders.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set!');
  process.exit(1);
}

console.log('\n🗑️  DELETE ALL ORDERS\n');
console.log('━'.repeat(80));
console.log('\n⚠️  ⚠️  ⚠️  WARNING ⚠️  ⚠️  ⚠️\n');
console.log('This will PERMANENTLY delete ALL orders and related data!');
console.log('This action CANNOT be undone!\n');
console.log('━'.repeat(80));

async function main() {
  const client = postgres(DATABASE_URL!);

  try {
    // Get all orders
    const allOrders = await client`SELECT * FROM orders ORDER BY "createdAt" DESC`;

    if (allOrders.length === 0) {
      console.log('\n✅ No orders found in database. Already clean!\n');
      await client.end();
      return;
    }

    console.log(`\n📊 Found ${allOrders.length} order(s) to delete:\n`);

    // Show summary by type
    const typeCount: Record<string, number> = {};
    allOrders.forEach((order: any) => {
      typeCount[order.itemType] = (typeCount[order.itemType] || 0) + 1;
    });

    console.log('Orders by type:');
    Object.entries(typeCount).forEach(([type, count]) => {
      console.log(`   • ${type.padEnd(15)} : ${count} order(s)`);
    });

    // Calculate total amount
    const totalAmount = allOrders.reduce((sum: number, o: any) => {
      return sum + parseFloat(o.amount || '0');
    }, 0);

    console.log(`\n💰 Total value: £${totalAmount.toFixed(2)}`);

    // Count related records
    console.log('\n🔍 Counting related records...\n');

    const eventTicketsCount = await client`SELECT COUNT(*) FROM "eventTickets"`;
    const coursePurchasesCount = await client`SELECT COUNT(*) FROM "coursePurchases"`;
    const classPurchasesCount = await client`SELECT COUNT(*) FROM "classPurchases"`;

    const ticketsTotal = parseInt(eventTicketsCount[0]?.count || '0');
    const coursesTotal = parseInt(coursePurchasesCount[0]?.count || '0');
    const classesTotal = parseInt(classPurchasesCount[0]?.count || '0');

    console.log('Related records to delete:');
    console.log(`   • ${ticketsTotal} event ticket(s)`);
    console.log(`   • ${coursesTotal} course purchase(s)`);
    console.log(`   • ${classesTotal} class purchase(s)`);

    console.log('\n━'.repeat(80));
    console.log('\n⚠️  FINAL WARNING:\n');
    console.log(`This will delete:`);
    console.log(`   • ${allOrders.length} orders`);
    console.log(`   • ${ticketsTotal} event tickets`);
    console.log(`   • ${coursesTotal} course purchases`);
    console.log(`   • ${classesTotal} class purchases`);
    console.log(`   • Total value: £${totalAmount.toFixed(2)}\n`);
    console.log('━'.repeat(80));

    console.log('\n🗑️  Starting deletion process...\n');

    // Step 1: Delete event tickets
    if (ticketsTotal > 0) {
      console.log(`   Deleting ${ticketsTotal} event ticket(s)...`);
      await client`DELETE FROM "eventTickets"`;
      console.log(`   ✅ Deleted ${ticketsTotal} event ticket(s)\n`);
    }

    // Step 2: Delete course purchases
    if (coursesTotal > 0) {
      console.log(`   Deleting ${coursesTotal} course purchase(s)...`);
      await client`DELETE FROM "coursePurchases"`;
      console.log(`   ✅ Deleted ${coursesTotal} course purchase(s)\n`);
    }

    // Step 3: Delete class purchases
    if (classesTotal > 0) {
      console.log(`   Deleting ${classesTotal} class purchase(s)...`);
      await client`DELETE FROM "classPurchases"`;
      console.log(`   ✅ Deleted ${classesTotal} class purchase(s)\n`);
    }

    // Step 4: Delete all orders
    console.log(`   Deleting ${allOrders.length} order(s)...`);
    await client`DELETE FROM orders`;
    console.log(`   ✅ Deleted ${allOrders.length} order(s)\n`);

    console.log('━'.repeat(80));
    console.log('\n🎉 Database cleanup completed!\n');
    console.log('Summary:');
    console.log(`   • ${allOrders.length} orders deleted`);
    console.log(`   • ${ticketsTotal} event tickets deleted`);
    console.log(`   • ${coursesTotal} course purchases deleted`);
    console.log(`   • ${classesTotal} class purchases deleted`);
    console.log(`   • Total value removed: £${totalAmount.toFixed(2)}\n`);
    console.log('✅ Database is now completely clean and ready for production!\n');
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
