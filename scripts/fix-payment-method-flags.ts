import { getDb } from "../server/db";
import { events, classes } from "../drizzle/schema";
import { sql } from "drizzle-orm";

/**
 * Script to update existing events/classes with payment method flags
 * This fixes events/classes created before the allowCashPayment/allowOnlinePayment fields were added
 */

async function fixPaymentMethodFlags() {
  console.log("🔄 Updating payment method flags for existing events and classes...\n");

  const db = await getDb();
  if (!db) {
    console.error("❌ Database connection not available");
    process.exit(1);
  }

  try {
    // Update EVENTS with paymentMethod = 'online'
    console.log("Updating events with paymentMethod='online'...");
    const onlineEvents = await db.execute(sql`
      UPDATE events
      SET
        "allowCashPayment" = false,
        "allowOnlinePayment" = true
      WHERE "paymentMethod" = 'online'
        OR "paymentMethod" IS NULL
    `);
    console.log(`✅ Updated events for online payment\n`);

    // Update EVENTS with paymentMethod = 'cash'
    console.log("Updating events with paymentMethod='cash'...");
    const cashEvents = await db.execute(sql`
      UPDATE events
      SET
        "allowCashPayment" = true,
        "allowOnlinePayment" = false
      WHERE "paymentMethod" = 'cash'
    `);
    console.log(`✅ Updated events for cash payment\n`);

    // Update EVENTS with paymentMethod = 'both'
    console.log("Updating events with paymentMethod='both'...");
    const bothEvents = await db.execute(sql`
      UPDATE events
      SET
        "allowCashPayment" = true,
        "allowOnlinePayment" = true
      WHERE "paymentMethod" = 'both'
    `);
    console.log(`✅ Updated events for both payment methods\n`);

    // Update CLASSES with paymentMethod = 'online'
    console.log("Updating classes with paymentMethod='online'...");
    const onlineClasses = await db.execute(sql`
      UPDATE classes
      SET
        "allowCashPayment" = false,
        "allowOnlinePayment" = true
      WHERE "paymentMethod" = 'online'
        OR "paymentMethod" IS NULL
    `);
    console.log(`✅ Updated classes for online payment\n`);

    // Update CLASSES with paymentMethod = 'cash'
    console.log("Updating classes with paymentMethod='cash'...");
    const cashClasses = await db.execute(sql`
      UPDATE classes
      SET
        "allowCashPayment" = true,
        "allowOnlinePayment" = false
      WHERE "paymentMethod" = 'cash'
    `);
    console.log(`✅ Updated classes for cash payment\n`);

    // Update CLASSES with paymentMethod = 'both'
    console.log("Updating classes with paymentMethod='both'...");
    const bothClasses = await db.execute(sql`
      UPDATE classes
      SET
        "allowCashPayment" = true,
        "allowOnlinePayment" = true
      WHERE "paymentMethod" = 'both'
    `);
    console.log(`✅ Updated classes for both payment methods\n`);

    console.log("✨ Payment method flags updated successfully!");
    console.log("\n📊 Summary:");
    console.log("- Events updated for all payment methods");
    console.log("- Classes updated for all payment methods");
    console.log("\n🎯 Next step: Test creating a new event with 'both' payment method and verify the Reserve button appears");

    process.exit(0);
  } catch (error) {
    console.error("❌ Update failed:", error);
    process.exit(1);
  }
}

fixPaymentMethodFlags();
