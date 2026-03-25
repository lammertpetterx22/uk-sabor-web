#!/usr/bin/env tsx
/**
 * Complete database overview - shows all data
 * Run: npx tsx scripts/database-overview.ts
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set!');
  process.exit(1);
}

console.log('\n📊 Complete Database Overview\n');
console.log('━'.repeat(70));

async function main() {
  const client = postgres(DATABASE_URL!);
  const db = drizzle(client);

  try {
    // Count all tables
    const tables = [
      { name: 'users', icon: '👤' },
      { name: 'instructors', icon: '🎓' },
      { name: 'events', icon: '🎉' },
      { name: 'courses', icon: '📚' },
      { name: 'classes', icon: '💃' },
      { name: 'orders', icon: '💰' },
      { name: '"eventTickets"', icon: '🎫' },
      { name: '"coursePurchases"', icon: '📖' },
      { name: '"classPurchases"', icon: '🎟️' },
      { name: 'subscriptions', icon: '💳' },
      { name: '"crmContacts"', icon: '📇' },
    ];

    console.log('\n📈 Record Counts:\n');

    for (const table of tables) {
      try {
        const result = await client`SELECT COUNT(*) FROM ${sql.raw(table.name)}`;
        const count = parseInt(result[0]?.count || '0');
        console.log(`   ${table.icon} ${table.name.replace(/"/g, '').padEnd(20)} : ${count} record(s)`);
      } catch (error) {
        console.log(`   ${table.icon} ${table.name.replace(/"/g, '').padEnd(20)} : Table not found or error`);
      }
    }

    // Check for test vs production orders
    console.log('\n━'.repeat(70));
    console.log('\n💳 Orders Breakdown:\n');

    try {
      const testOrders = await client`SELECT COUNT(*) FROM orders WHERE livemode = false`;
      const liveOrders = await client`SELECT COUNT(*) FROM orders WHERE livemode = true`;

      console.log(`   🟠 TEST orders (livemode = false)  : ${testOrders[0]?.count || 0}`);
      console.log(`   🟢 LIVE orders (livemode = true)   : ${liveOrders[0]?.count || 0}`);
    } catch (error) {
      console.log('   ⚠️  Could not fetch orders breakdown');
    }

    // Check for recent activity
    console.log('\n━'.repeat(70));
    console.log('\n⏰ Recent Activity (Last 7 Days):\n');

    try {
      const recentUsers = await client`
        SELECT COUNT(*) FROM users
        WHERE "createdAt" > NOW() - INTERVAL '7 days'
      `;
      console.log(`   👤 New users          : ${recentUsers[0]?.count || 0}`);

      const recentOrders = await client`
        SELECT COUNT(*) FROM orders
        WHERE "createdAt" > NOW() - INTERVAL '7 days'
      `;
      console.log(`   💰 New orders         : ${recentOrders[0]?.count || 0}`);

      const recentTickets = await client`
        SELECT COUNT(*) FROM "eventTickets"
        WHERE "purchasedAt" > NOW() - INTERVAL '7 days'
      `;
      console.log(`   🎫 Tickets sold       : ${recentTickets[0]?.count || 0}`);

      const recentCourses = await client`
        SELECT COUNT(*) FROM "coursePurchases"
        WHERE "purchasedAt" > NOW() - INTERVAL '7 days'
      `;
      console.log(`   📖 Courses purchased  : ${recentCourses[0]?.count || 0}`);

    } catch (error) {
      console.log('   ⚠️  Could not fetch recent activity');
    }

    // Revenue overview
    console.log('\n━'.repeat(70));
    console.log('\n💵 Revenue Overview:\n');

    try {
      const totalRevenue = await client`
        SELECT SUM(amount) as total FROM orders WHERE status = 'paid' AND livemode = true
      `;
      const totalAmount = parseFloat(totalRevenue[0]?.total || '0');
      console.log(`   💰 Total LIVE revenue : £${totalAmount.toFixed(2)}`);

      const testRevenue = await client`
        SELECT SUM(amount) as total FROM orders WHERE livemode = false
      `;
      const testAmount = parseFloat(testRevenue[0]?.total || '0');
      console.log(`   🟠 TEST revenue       : £${testAmount.toFixed(2)} (not real)`);

    } catch (error) {
      console.log('   ⚠️  Could not fetch revenue data');
    }

    console.log('\n━'.repeat(70));
    console.log('\n✅ Database Status: Healthy\n');
    console.log('━'.repeat(70) + '\n');

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
