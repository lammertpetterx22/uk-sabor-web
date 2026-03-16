/**
 * Fix classes/courses with draft status by updating them to published
 *
 * This script updates all draft classes and courses to published status
 * so they appear in public listings.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { classes, courses } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL is not set");
    process.exit(1);
  }

  const sql = postgres(databaseUrl);
  const db = drizzle(sql);

  console.log("🔧 Fixing draft classes and courses...\n");

  // Update draft classes
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📚 UPDATING CLASSES");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const draftClasses = await db.select().from(classes).where(eq(classes.status, 'draft'));

  if (draftClasses.length === 0) {
    console.log("✅ No draft classes found - all good!");
  } else {
    console.log(`Found ${draftClasses.length} draft classes:\n`);

    draftClasses.forEach((cls) => {
      console.log(`  📝 ID ${cls.id}: "${cls.title}"`);
    });

    console.log(`\n🔄 Updating ${draftClasses.length} classes to published status...`);

    await db
      .update(classes)
      .set({ status: 'published' })
      .where(eq(classes.status, 'draft'));

    console.log(`✅ Updated ${draftClasses.length} classes to published!`);
  }

  // Update draft courses
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📖 UPDATING COURSES");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const draftCourses = await db.select().from(courses).where(eq(courses.status, 'draft'));

  if (draftCourses.length === 0) {
    console.log("✅ No draft courses found - all good!");
  } else {
    console.log(`Found ${draftCourses.length} draft courses:\n`);

    draftCourses.forEach((course) => {
      console.log(`  📝 ID ${course.id}: "${course.title}"`);
    });

    console.log(`\n🔄 Updating ${draftCourses.length} courses to published status...`);

    await db
      .update(courses)
      .set({ status: 'published' })
      .where(eq(courses.status, 'draft'));

    console.log(`✅ Updated ${draftCourses.length} courses to published!`);
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎉 DONE!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const totalUpdated = draftClasses.length + draftCourses.length;

  if (totalUpdated > 0) {
    console.log(`\n✅ Successfully updated ${totalUpdated} items to published status!`);
    console.log("\n📱 Your classes and courses should now appear on the website!");
    console.log("   Visit: /classes and /courses to verify");
  } else {
    console.log("\n✅ Everything was already published!");
  }

  await sql.end();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
