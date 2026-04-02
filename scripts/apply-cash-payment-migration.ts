import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

async function applyMigration() {
  console.log("🔄 Applying cash payment migration...\n");

  const db = await getDb();
  if (!db) {
    console.error("❌ Database connection not available");
    process.exit(1);
  }

  try {
    // Apply each statement from the migration file
    const statements = [
      // classPurchases columns
      `ALTER TABLE "classPurchases" ADD COLUMN IF NOT EXISTS "paymentStatus" varchar(20) DEFAULT 'paid'`,
      `ALTER TABLE "classPurchases" ADD COLUMN IF NOT EXISTS "paymentMethod" varchar(20)`,
      `ALTER TABLE "classPurchases" ADD COLUMN IF NOT EXISTS "paidAt" timestamp`,
      `ALTER TABLE "classPurchases" ADD COLUMN IF NOT EXISTS "reservedAt" timestamp`,

      // classes columns
      `ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "allowCashPayment" boolean DEFAULT false`,
      `ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "allowOnlinePayment" boolean DEFAULT true`,
      `ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "cashPaymentInstructions" text`,

      // eventTickets columns
      `ALTER TABLE "eventTickets" ADD COLUMN IF NOT EXISTS "paymentStatus" varchar(20) DEFAULT 'paid'`,
      `ALTER TABLE "eventTickets" ADD COLUMN IF NOT EXISTS "paymentMethod" varchar(20)`,
      `ALTER TABLE "eventTickets" ADD COLUMN IF NOT EXISTS "paidAt" timestamp`,
      `ALTER TABLE "eventTickets" ADD COLUMN IF NOT EXISTS "reservedAt" timestamp`,

      // events columns
      `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "allowCashPayment" boolean DEFAULT false`,
      `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "allowOnlinePayment" boolean DEFAULT true`,
      `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "cashPaymentInstructions" text`,

      // indexes
      `CREATE INDEX IF NOT EXISTS "class_purchases_payment_status_idx" ON "classPurchases" USING btree ("paymentStatus")`,
      `CREATE INDEX IF NOT EXISTS "event_tickets_payment_status_idx" ON "eventTickets" USING btree ("paymentStatus")`,
    ];

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 60)}...`);
      await db.execute(sql.raw(statement));
      console.log("✅ Done\n");
    }

    console.log("✨ Migration applied successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

applyMigration();
