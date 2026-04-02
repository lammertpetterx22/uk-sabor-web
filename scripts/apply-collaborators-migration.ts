#!/usr/bin/env tsx
/**
 * Apply collaborators table migration to production database
 */

import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function applyMigration() {
  console.log("🚀 Applying collaborators table migration...\n");

  const sql = postgres(DATABASE_URL, { max: 1 });

  try {
    // Check if table already exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'collaborators'
      );
    `;

    if (tableExists[0].exists) {
      console.log("✅ Table 'collaborators' already exists. Skipping migration.");
      await sql.end();
      return;
    }

    // Create the collaborators table
    await sql`
      CREATE TABLE "collaborators" (
        "id" serial PRIMARY KEY NOT NULL,
        "itemType" varchar(20) NOT NULL,
        "itemId" integer NOT NULL,
        "creatorId" integer NOT NULL,
        "collaboratorId" integer NOT NULL,
        "creatorPercentage" integer DEFAULT 50 NOT NULL,
        "collaboratorPercentage" integer DEFAULT 50 NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      );
    `;

    console.log("✅ Created table 'collaborators'");

    // Create indexes
    await sql`
      CREATE INDEX "collaborators_item_idx" ON "collaborators" USING btree ("itemType","itemId");
    `;
    console.log("✅ Created index 'collaborators_item_idx'");

    await sql`
      CREATE INDEX "collaborators_creator_idx" ON "collaborators" USING btree ("creatorId");
    `;
    console.log("✅ Created index 'collaborators_creator_idx'");

    await sql`
      CREATE INDEX "collaborators_collaborator_idx" ON "collaborators" USING btree ("collaboratorId");
    `;
    console.log("✅ Created index 'collaborators_collaborator_idx'");

    console.log("\n🎉 Migration completed successfully!");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

applyMigration().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
