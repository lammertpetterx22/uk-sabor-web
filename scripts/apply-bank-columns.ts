import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

async function applyBankColumnsMigration() {
  console.log("Applying bank columns migration to users table...");

  const db = await getDb();
  if (!db) {
    console.error("❌ Database connection not available");
    process.exit(1);
  }

  try {
    // Use raw SQL with IF NOT EXISTS checks
    await db.execute(sql`
      DO $$
      BEGIN
        -- bankAccountHolderName
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'bankAccountHolderName'
        ) THEN
          ALTER TABLE "users" ADD COLUMN "bankAccountHolderName" varchar(255);
          RAISE NOTICE 'Added bankAccountHolderName column';
        ELSE
          RAISE NOTICE 'bankAccountHolderName column already exists';
        END IF;

        -- bankSortCode
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'bankSortCode'
        ) THEN
          ALTER TABLE "users" ADD COLUMN "bankSortCode" varchar(10);
          RAISE NOTICE 'Added bankSortCode column';
        ELSE
          RAISE NOTICE 'bankSortCode column already exists';
        END IF;

        -- bankAccountNumber
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'bankAccountNumber'
        ) THEN
          ALTER TABLE "users" ADD COLUMN "bankAccountNumber" varchar(20);
          RAISE NOTICE 'Added bankAccountNumber column';
        ELSE
          RAISE NOTICE 'bankAccountNumber column already exists';
        END IF;

        -- bankDetailsVerified
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'bankDetailsVerified'
        ) THEN
          ALTER TABLE "users" ADD COLUMN "bankDetailsVerified" boolean DEFAULT false;
          RAISE NOTICE 'Added bankDetailsVerified column';
        ELSE
          RAISE NOTICE 'bankDetailsVerified column already exists';
        END IF;
      END $$;
    `);

    console.log("✅ Migration completed successfully!");

    // Verify columns exist
    const result = await db.execute(sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('bankAccountHolderName', 'bankSortCode', 'bankAccountNumber', 'bankDetailsVerified')
      ORDER BY column_name;
    `);

    console.log("\n📋 Bank detail columns in users table:");
    console.table(result.rows);

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

applyBankColumnsMigration();
