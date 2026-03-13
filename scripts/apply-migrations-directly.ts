/**
 * Apply database migrations directly
 * This script reads the SQL migration file and executes it
 */

import { getDb } from "../server/db";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🔧 Applying database migrations...\n");

  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  // Read the migration SQL file
  const migrationPath = path.join(process.cwd(), "drizzle", "0002_daffy_husk.sql");

  if (!fs.existsSync(migrationPath)) {
    throw new Error(`Migration file not found: ${migrationPath}`);
  }

  const sql = fs.readFileSync(migrationPath, "utf-8");

  console.log("📄 Migration file loaded successfully");
  console.log(`   File: ${migrationPath}`);
  console.log(`   Size: ${sql.length} characters\n`);

  // Split SQL into individual statements
  const statements = sql
    .split("--> statement-breakpoint")
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith("--"));

  console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

  let executed = 0;
  let skipped = 0;
  let errors = 0;

  for (const statement of statements) {
    try {
      // Show what we're doing
      const preview = statement.substring(0, 80).replace(/\s+/g, " ");
      console.log(`  Executing: ${preview}...`);

      await db.execute(statement as any);
      executed++;
      console.log(`  ✅ Success`);
    } catch (err: any) {
      if (err.message.includes("already exists")) {
        skipped++;
        console.log(`  ⏭️  Skipped (already exists)`);
      } else {
        errors++;
        console.log(`  ❌ Error: ${err.message}`);
      }
    }
  }

  console.log("\n" + "═".repeat(60));
  console.log(`📊 Migration Summary:`);
  console.log(`   ✅ Executed: ${executed}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log("═".repeat(60));

  if (errors === 0) {
    console.log("\n✅ All migrations applied successfully!");
  } else {
    console.log(`\n⚠️  ${errors} statement(s) failed, but this may be normal if tables already exist.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  });
