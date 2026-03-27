/**
 * Rename password column to passwordHash in users table
 *
 * Usage:
 * npx tsx scripts/rename-password-column.ts
 */

import pg from "pg";
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.yajztkmoqhhtbgyogldb:UkSabor_SecureDB_2026!@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    console.log("🔌 Connecting to database...");
    await client.connect();
    console.log("✅ Connected!");

    // Check if password column exists
    console.log("\n📊 Checking current schema...");
    const checkPassword = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'password'
    `);

    const checkPasswordHash = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'passwordHash'
    `);

    console.log("password column exists:", checkPassword.rows.length > 0);
    console.log("passwordHash column exists:", checkPasswordHash.rows.length > 0);

    if (checkPasswordHash.rows.length > 0) {
      console.log("\n✅ passwordHash column already exists - no migration needed!");
      return;
    }

    if (checkPassword.rows.length === 0) {
      console.log("\n❌ password column doesn't exist - cannot migrate!");
      return;
    }

    // Rename column
    console.log("\n🔄 Renaming password column to passwordHash...");
    await client.query(`
      ALTER TABLE users
      RENAME COLUMN password TO "passwordHash"
    `);

    console.log("✅ Column renamed successfully!");

    // Verify
    const verify = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'passwordHash'
    `);

    if (verify.rows.length > 0) {
      console.log("\n✅ MIGRATION SUCCESSFUL!");
      console.log("📊 passwordHash column now exists");
    } else {
      console.log("\n❌ MIGRATION FAILED - passwordHash column not found");
    }

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  } finally {
    await client.end();
    console.log("\n🔌 Disconnected from database");
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
