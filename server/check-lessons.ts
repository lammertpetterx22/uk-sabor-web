/**
 * Check lessons data in database
 * Run with: npx tsx server/check-lessons.ts
 */

import "dotenv/config";
import { getDb } from "./db";
import { lessons, courses } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function checkLessons() {
  console.log("\n🔍 Checking Lessons Data");
  console.log("========================\n");

  const db = await getDb();
  if (!db) {
    console.error("❌ Database not available");
    process.exit(1);
  }

  try {
    // Get all courses
    const allCourses = await db.select().from(courses);

    console.log(`📚 Found ${allCourses.length} courses:\n`);

    for (const course of allCourses) {
      console.log(`\n📖 Course: ${course.title} (ID: ${course.id})`);
      console.log(`   Status: ${course.status}`);
      console.log(`   Price: £${course.price}`);

      // Get lessons for this course
      const courseLessons = await db
        .select()
        .from(lessons)
        .where(eq(lessons.courseId, course.id));

      console.log(`   Lessons: ${courseLessons.length}`);

      if (courseLessons.length === 0) {
        console.log("   ⚠️  No lessons found for this course");
        continue;
      }

      courseLessons.forEach((lesson, idx) => {
        console.log(`\n   ${idx + 1}. ${lesson.title} (ID: ${lesson.id})`);
        console.log(`      Position: ${lesson.position}`);
        console.log(`      Preview: ${lesson.isPreview ? "Yes" : "No"}`);
        console.log(`      Duration: ${lesson.durationSeconds ? lesson.durationSeconds + "s" : "N/A"}`);

        // Check Bunny.net data
        if (lesson.bunnyVideoId && lesson.bunnyLibraryId) {
          console.log(`      ✅ Bunny Video ID: ${lesson.bunnyVideoId}`);
          console.log(`      ✅ Bunny Library ID: ${lesson.bunnyLibraryId}`);

          // Generate test signed URL
          const testUrl = `https://iframe.mediadelivery.net/embed/${lesson.bunnyLibraryId}/${lesson.bunnyVideoId}`;
          console.log(`      🔗 Iframe URL: ${testUrl}`);
        } else {
          console.log(`      ❌ Missing Bunny.net data:`);
          console.log(`         bunnyVideoId: ${lesson.bunnyVideoId || "null"}`);
          console.log(`         bunnyLibraryId: ${lesson.bunnyLibraryId || "null"}`);
        }

        // Check old videoUrl field
        if (lesson.videoUrl) {
          console.log(`      ⚠️  Old videoUrl exists: ${lesson.videoUrl.substring(0, 50)}...`);
        }
      });
    }

    console.log("\n\n📊 Summary:");
    console.log("===========\n");

    const allLessons = await db.select().from(lessons);
    const withBunnyData = allLessons.filter(l => l.bunnyVideoId && l.bunnyLibraryId);
    const withoutBunnyData = allLessons.filter(l => !l.bunnyVideoId || !l.bunnyLibraryId);

    console.log(`Total lessons: ${allLessons.length}`);
    console.log(`✅ With Bunny.net data: ${withBunnyData.length}`);
    console.log(`❌ Missing Bunny.net data: ${withoutBunnyData.length}`);

    if (withoutBunnyData.length > 0) {
      console.log("\n⚠️  Lessons missing Bunny.net data:");
      withoutBunnyData.forEach(l => {
        console.log(`   - ${l.title} (ID: ${l.id}, Course ID: ${l.courseId})`);
      });
      console.log("\n💡 These lessons need to have videos uploaded via Admin Dashboard.");
    }

  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

checkLessons();
