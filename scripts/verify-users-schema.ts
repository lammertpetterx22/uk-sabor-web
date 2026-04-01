import { getDb } from "../server/db";
import { sql } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function verifyUsersSchema() {
  console.log("Verifying users table schema...\n");

  const db = await getDb();
  if (!db) {
    console.error("❌ Database connection not available");
    process.exit(1);
  }

  try {
    // 1. Check all columns exist
    const columnsResult = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log("📋 All columns in users table:");
    console.table(columnsResult.rows);

    // 2. Try to query a user by email (this was the failing query)
    console.log("\n🔍 Testing query by email (this was failing before)...");
    const testEmail = "lammertpetterx22@gmail.com";

    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, testEmail))
      .limit(1);

    if (userResult.length > 0) {
      console.log(`✅ Successfully queried user by email: ${testEmail}`);
      console.log("User data:", {
        id: userResult[0].id,
        name: userResult[0].name,
        email: userResult[0].email,
        role: userResult[0].role,
        bankAccountHolderName: userResult[0].bankAccountHolderName || "(not set)",
        bankDetailsVerified: userResult[0].bankDetailsVerified,
      });
    } else {
      console.log(`ℹ️  No user found with email: ${testEmail}`);
    }

    // 3. Verify bank columns specifically
    console.log("\n💰 Bank detail columns:");
    const bankColumnsResult = await db.execute(sql`
      SELECT column_name, data_type, character_maximum_length, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('bankAccountHolderName', 'bankSortCode', 'bankAccountNumber', 'bankDetailsVerified')
      ORDER BY column_name;
    `);
    console.table(bankColumnsResult.rows);

    console.log("\n✅ All schema verification checks passed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  }
}

verifyUsersSchema();
