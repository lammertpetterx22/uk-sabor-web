// Migration script to add bannerUrl column to events table
import { config } from "dotenv";
import pg from "pg";

config();

const { Client } = pg;

async function addEventBanner() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("✅ Connected to database");

    console.log("\n📝 Adding bannerUrl column to events table...");

    // Add bannerUrl column
    await client.query(`
      ALTER TABLE "events"
      ADD COLUMN IF NOT EXISTS "bannerUrl" TEXT;
    `);

    console.log("✅ bannerUrl column added successfully!");

    // Verify the column was added
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'events'
      AND column_name = 'bannerUrl';
    `);

    if (result.rows.length > 0) {
      console.log("\n✅ Verification successful:");
      console.log("   Column:", result.rows[0].column_name);
      console.log("   Type:", result.rows[0].data_type);
    }

    console.log("\n✅ Migration completed successfully!");
    console.log("\n📋 Next steps:");
    console.log("   1. Deploy the updated code to production");
    console.log("   2. Events can now have:");
    console.log("      - imageUrl: Cover image (flyer vertical 17:25) for cards");
    console.log("      - bannerUrl: Banner image (horizontal) for event detail page");

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  } finally {
    await client.end();
    console.log("\n🔌 Database connection closed");
  }
}

addEventBanner().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
