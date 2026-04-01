import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

async function applyClassMaterialsMigration() {
  console.log("Applying class materials columns migration...");

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
        -- materialsUrl
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'classes' AND column_name = 'materialsUrl'
        ) THEN
          ALTER TABLE "classes" ADD COLUMN "materialsUrl" text;
          RAISE NOTICE 'Added materialsUrl column';
        ELSE
          RAISE NOTICE 'materialsUrl column already exists';
        END IF;

        -- materialsFileName
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'classes' AND column_name = 'materialsFileName'
        ) THEN
          ALTER TABLE "classes" ADD COLUMN "materialsFileName" varchar(255);
          RAISE NOTICE 'Added materialsFileName column';
        ELSE
          RAISE NOTICE 'materialsFileName column already exists';
        END IF;
      END $$;
    `);

    console.log("✅ Migration completed successfully!");

    // Verify columns exist
    const result = await db.execute(sql`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'classes'
      AND column_name IN ('materialsUrl', 'materialsFileName')
      ORDER BY column_name;
    `);

    console.log("\n📋 Class materials columns:");
    console.table(result.rows);

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

applyClassMaterialsMigration();
