#!/usr/bin/env tsx
/**
 * Apply livemode migration to orders table
 * This adds the ability to track test vs production transactions
 */

import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

async function applyMigration() {
  console.log("🔧 Applying livemode migration to orders table...\n");
  console.log("═".repeat(60));

  const db = await getDb();
  if (!db) {
    console.error("❌ Database not available");
    process.exit(1);
  }

  try {
    // Check if column already exists
    console.log("\n📊 Step 1: Checking if livemode column exists...");

    try {
      const checkColumn = await db.execute(sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'orders'
        AND column_name = 'livemode';
      `);

      const rows = (checkColumn as any).rows || (checkColumn as any) || [];

      if (rows.length > 0) {
        console.log("   ✅ Column 'livemode' already exists - skipping migration");
        console.log("\n═".repeat(60));
        console.log("\n✅ Migration already applied!\n");
        return;
      }
    } catch (checkError: any) {
      console.log("   ⚠️  Could not check existing column, will try to add it...");
    }

    // Add the column
    console.log("   ⚙️  Adding 'livemode' column to orders table...");

    await db.execute(sql`
      ALTER TABLE "orders"
      ADD COLUMN "livemode" boolean DEFAULT true NOT NULL;
    `);

    console.log("   ✅ Column added successfully");

    // Add index for performance
    console.log("\n📊 Step 2: Creating index for livemode...");

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "orders_livemode_idx" ON "orders" ("livemode");
    `);

    console.log("   ✅ Index created successfully");

    // Verify the migration
    console.log("\n📊 Step 3: Verifying migration...");

    try {
      const verify = await db.execute(sql`
        SELECT column_name, data_type, column_default
        FROM information_schema.columns
        WHERE table_name = 'orders'
        AND column_name = 'livemode';
      `);

      const rows = (verify as any).rows || (verify as any) || [];

      if (rows.length > 0) {
        console.log("   ✅ Migration verified:");
        console.log(`      Column: ${rows[0].column_name}`);
        console.log(`      Type: ${rows[0].data_type}`);
        console.log(`      Default: ${rows[0].column_default}`);
      }
    } catch (verifyError) {
      console.log("   ✅ Column added (verification skipped)");
    }

    // Check existing orders
    console.log("\n📊 Step 4: Checking existing orders...");

    try {
      const ordersCount = await db.execute(sql`
        SELECT COUNT(*) as count FROM "orders";
      `);

      const rows = (ordersCount as any).rows || (ordersCount as any) || [];
      const count = rows.length > 0 ? parseInt(rows[0].count as string) : 0;

      console.log(`   ✅ Total orders in database: ${count}`);

      if (count > 0) {
        console.log(`   ℹ️  All existing orders now have livemode = true (default)`);
        console.log("   💡 New test purchases will have livemode = false");
      }
    } catch (countError) {
      console.log("   ✅ Orders count check skipped");
    }

    console.log("\n═".repeat(60));
    console.log("\n✅ Migration completed successfully!\n");
    console.log("📝 Next steps:");
    console.log("   1. Restart your server: npm run dev");
    console.log("   2. Make a test purchase with Stripe test card");
    console.log("   3. Check logs for 'Mode: TEST' messages");
    console.log("   4. Run: tsx scripts/test-earnings-with-mode.ts\n");

  } catch (error: any) {
    console.error("\n❌ Migration failed:");
    console.error(error.message);
    console.error("\nFull error:", error);
    process.exit(1);
  }
}

applyMigration();
