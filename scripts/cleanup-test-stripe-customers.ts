#!/usr/bin/env tsx
/**
 * Script to clean up test-mode Stripe customer IDs from the database
 *
 * When switching from Stripe test mode to live mode, users with test-mode
 * customer IDs (e.g., cus_U9Yelnv7E4yUnw) will cause errors:
 * "No such customer: 'cus_XXX'; a similar object exists in test mode,
 *  but a live mode key was used to make this request."
 *
 * This script removes all stripeCustomerId values from users, forcing
 * the system to create new live-mode customers when needed.
 *
 * SAFETY: This is safe because:
 * - The app will auto-create new live customer IDs when needed
 * - Existing subscriptions in Stripe won't be affected
 * - Users can re-subscribe with fresh live-mode customers
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users } from "../drizzle/schema";
import { isNotNull, sql } from "drizzle-orm";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set");
    process.exit(1);
  }

  const client = postgres(process.env.DATABASE_URL);
  const db = drizzle(client);

  console.log("🔍 Searching for users with Stripe customer IDs...\n");

  // Find all users with stripeCustomerId
  const usersWithCustomers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      stripeCustomerId: users.stripeCustomerId,
      subscriptionPlan: users.subscriptionPlan,
    })
    .from(users)
    .where(isNotNull(users.stripeCustomerId));

  if (usersWithCustomers.length === 0) {
    console.log("✅ No users with Stripe customer IDs found. Database is clean!");
    await client.end();
    return;
  }

  console.log(`Found ${usersWithCustomers.length} user(s) with Stripe customer IDs:\n`);

  for (const user of usersWithCustomers) {
    console.log(`  User #${user.id} - ${user.name || "No name"} (${user.email || "No email"})`);
    console.log(`    Customer ID: ${user.stripeCustomerId}`);
    console.log(`    Plan: ${user.subscriptionPlan}`);
  }

  console.log("\n⚠️  WARNING: This will remove ALL Stripe customer IDs from the database.");
  console.log("   Users will get new live-mode customer IDs when they next subscribe.");
  console.log("\n🚀 Proceeding with cleanup...\n");

  // Clear all stripeCustomerId values
  const result = await db
    .update(users)
    .set({ stripeCustomerId: null })
    .where(isNotNull(users.stripeCustomerId));

  console.log(`✅ Cleared ${usersWithCustomers.length} Stripe customer ID(s) from database`);
  console.log("\n📝 Next steps:");
  console.log("   1. Users can now subscribe/manage billing without errors");
  console.log("   2. New live-mode customer IDs will be created automatically");
  console.log("   3. If users had active subscriptions, they may need to re-subscribe");
  console.log("\n💡 Tip: Check Stripe dashboard to see old test subscriptions vs new live ones");

  await client.end();
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
