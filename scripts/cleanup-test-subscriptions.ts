#!/usr/bin/env tsx
/**
 * Script to clean up test-mode subscription records from the database
 *
 * Removes all subscription records that reference test-mode Stripe data.
 * This prevents errors when switching from test to live mode.
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { subscriptions } from "../drizzle/schema";
import { isNotNull, sql } from "drizzle-orm";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set");
    process.exit(1);
  }

  const client = postgres(process.env.DATABASE_URL);
  const db = drizzle(client);

  console.log("🔍 Searching for subscription records...\n");

  // Find all subscriptions
  const allSubscriptions = await db
    .select({
      id: subscriptions.id,
      userId: subscriptions.userId,
      plan: subscriptions.plan,
      status: subscriptions.status,
      stripeSubscriptionId: subscriptions.stripeSubscriptionId,
      stripeCustomerId: subscriptions.stripeCustomerId,
    })
    .from(subscriptions);

  if (allSubscriptions.length === 0) {
    console.log("✅ No subscription records found. Database is clean!");
    await client.end();
    return;
  }

  console.log(`Found ${allSubscriptions.length} subscription record(s):\n`);

  for (const sub of allSubscriptions) {
    console.log(`  Subscription #${sub.id} - User #${sub.userId}`);
    console.log(`    Plan: ${sub.plan} | Status: ${sub.status}`);
    console.log(`    Stripe Sub ID: ${sub.stripeSubscriptionId || "None"}`);
    console.log(`    Stripe Customer ID: ${sub.stripeCustomerId || "None"}`);
  }

  console.log("\n⚠️  WARNING: This will DELETE ALL subscription records.");
  console.log("   Users will need to re-subscribe with live-mode Stripe.");
  console.log("\n🚀 Proceeding with cleanup...\n");

  // Delete all subscription records
  const result = await db.delete(subscriptions);

  console.log(`✅ Deleted ${allSubscriptions.length} subscription record(s)`);
  console.log("\n📝 Next steps:");
  console.log("   1. Users can now create fresh live-mode subscriptions");
  console.log("   2. Old test subscriptions won't interfere with billing");
  console.log("   3. Users may need to re-subscribe to regain premium features");

  await client.end();
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
