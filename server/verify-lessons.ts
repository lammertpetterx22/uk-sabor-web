/**
 * Verify lessons have Bunny.net data
 * Run with: npx tsx server/verify-lessons.ts
 */

import "dotenv/config";
import { getDb } from "./db";
import { lessons, courses, coursePurchases, users } from "../drizzle/schema";
import { sql } from "drizzle-orm";

async function verifyLessons() {
  console.log("\n🔍 Verifying Lessons and Bunny.net Data");
  console.log("========================================\n");

  const db = await getDb();
  if (!db) {
    console.error("❌ Database not available");
    process.exit(1);
  }

  try {
    // Get all courses with raw SQL to avoid any schema issues
    const coursesData = await db.execute(sql`
      SELECT id, title, status, price, "videoUrl", "bunnyVideoId", "bunnyLibraryId"
      FROM courses
      ORDER BY id
    `);

    console.log(`📚 Courses found: ${coursesData.length}\n`);

    for (const course of coursesData as any[]) {
      console.log(`\n📖 Course ID ${course.id}: ${course.title}`);
      console.log(`   Status: ${course.status}`);
      console.log(`   Price: £${course.price}`);

      // Get lessons for this course
      const lessonsData = await db.execute(sql`
        SELECT id, title, position, "isPreview", "bunnyVideoId", "bunnyLibraryId", "videoUrl"
        FROM lessons
        WHERE "courseId" = ${course.id}
        ORDER BY position
      `);

      if (lessonsData.length === 0) {
        console.log(`   ⚠️  No lessons found`);
        continue;
      }

      console.log(`   Lessons: ${lessonsData.length}`);

      for (const lesson of lessonsData as any[]) {
        console.log(`\n   ${lesson.position}. ${lesson.title} (ID: ${lesson.id})`);
        console.log(`      Preview: ${lesson.isPreview ? "✅ Yes" : "No"}`);

        if (lesson.bunnyVideoId && lesson.bunnyLibraryId) {
          console.log(`      ✅ Bunny Video ID: ${lesson.bunnyVideoId}`);
          console.log(`      ✅ Bunny Library ID: ${lesson.bunnyLibraryId}`);

          // Test URL generation
          const testUrl = `https://iframe.mediadelivery.net/embed/${lesson.bunnyLibraryId}/${lesson.bunnyVideoId}`;
          console.log(`      🔗 Would generate: ${testUrl.substring(0, 80)}...`);
        } else {
          console.log(`      ❌ Missing Bunny.net data!`);
          if (lesson.bunnyVideoId) console.log(`         Has bunnyVideoId: ${lesson.bunnyVideoId}`);
          if (lesson.bunnyLibraryId) console.log(`         Has bunnyLibraryId: ${lesson.bunnyLibraryId}`);
          if (!lesson.bunnyVideoId && !lesson.bunnyLibraryId) {
            console.log(`         🚨 NO VIDEO DATA - needs to be uploaded!`);
          }
        }

        if (lesson.videoUrl) {
          console.log(`      ⚠️  Old videoUrl field: ${lesson.videoUrl.substring(0, 50)}...`);
        }
      }
    }

    // Check purchases
    console.log("\n\n💰 Course Purchases:");
    console.log("===================\n");

    const purchasesData = await db.execute(sql`
      SELECT cp.id, cp."userId", cp."courseId", u.email, c.title as "courseTitle"
      FROM "coursePurchases" cp
      LEFT JOIN users u ON cp."userId" = u.id
      LEFT JOIN courses c ON cp."courseId" = c.id
      ORDER BY cp."purchasedAt" DESC
      LIMIT 10
    `);

    if (purchasesData.length === 0) {
      console.log("⚠️  No purchases found\n");
    } else {
      console.log(`Found ${purchasesData.length} recent purchases:\n`);
      for (const purchase of purchasesData as any[]) {
        console.log(`   • ${purchase.email || "Unknown"} purchased "${purchase.courseTitle || "Unknown course"}"`);
        console.log(`     Purchase ID: ${purchase.id}, Course ID: ${purchase.courseId}`);
      }
    }

    console.log("\n✅ Verification complete!");

  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
}

verifyLessons();
