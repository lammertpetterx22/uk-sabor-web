/**
 * Simple database check
 * Run with: npx tsx server/simple-check.ts
 */

import "dotenv/config";
import pkg from "pg";
const { Client } = pkg;

async function simpleCheck() {
  console.log("\n🔍 Simple Database Check");
  console.log("========================\n");

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("✅ Connected to database\n");

    // Check courses
    const coursesResult = await client.query("SELECT id, title, status FROM courses ORDER BY id");
    console.log(`📚 Courses (${coursesResult.rows.length}):`);
    coursesResult.rows.forEach(row => {
      console.log(`   ${row.id}. ${row.title} (${row.status})`);
    });

    // Check lessons
    console.log("\n📝 Lessons:");
    const lessonsResult = await client.query(`
      SELECT id, "courseId", title, "bunnyVideoId", "bunnyLibraryId", "isPreview"
      FROM lessons
      ORDER BY "courseId", position
    `);

    if (lessonsResult.rows.length === 0) {
      console.log("   ⚠️  No lessons found in database");
    } else {
      console.log(`   Found ${lessonsResult.rows.length} lessons:\n`);
      lessonsResult.rows.forEach(row => {
        console.log(`   ${row.id}. ${row.title}`);
        console.log(`      Course ID: ${row.courseId}`);
        console.log(`      Preview: ${row.isPreview ? "Yes" : "No"}`);
        console.log(`      Bunny Video ID: ${row.bunnyVideoId || "❌ NULL"}`);
        console.log(`      Bunny Library ID: ${row.bunnyLibraryId || "❌ NULL"}`);
        console.log("");
      });
    }

    // Check course purchases
    console.log("💰 Course Purchases:");
    const purchasesResult = await client.query(`
      SELECT cp.id, cp."userId", cp."courseId", u.email, c.title
      FROM "coursePurchases" cp
      LEFT JOIN users u ON cp."userId" = u.id
      LEFT JOIN courses c ON cp."courseId" = c.id
      ORDER BY cp."createdAt" DESC
      LIMIT 10
    `);

    if (purchasesResult.rows.length === 0) {
      console.log("   ⚠️  No course purchases found");
    } else {
      console.log(`   Found ${purchasesResult.rows.length} recent purchases:\n`);
      purchasesResult.rows.forEach(row => {
        console.log(`   Purchase ID ${row.id}: ${row.email || "Unknown user"} → ${row.title || "Unknown course"}`);
      });
    }

  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    if (error.detail) console.error("   Detail:", error.detail);
  } finally {
    await client.end();
  }
}

simpleCheck();
