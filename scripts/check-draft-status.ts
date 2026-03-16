/**
 * Check and fix classes/courses with draft status
 *
 * This script:
 * 1. Queries all classes and courses from the database
 * 2. Shows their current status
 * 3. Optionally updates draft items to published
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { classes, courses } from "../drizzle/schema";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL is not set");
    process.exit(1);
  }

  const sql = postgres(databaseUrl);
  const db = drizzle(sql);

  console.log("🔍 Checking classes and courses status...\n");

  // Check classes
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📚 CLASSES");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const allClasses = await db.select().from(classes);

  if (allClasses.length === 0) {
    console.log("⚠️  No classes found in database");
  } else {
    console.log(`Total classes: ${allClasses.length}\n`);

    const classesByStatus = allClasses.reduce((acc, cls) => {
      const status = cls.status || 'null';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log("Status breakdown:");
    Object.entries(classesByStatus).forEach(([status, count]) => {
      const emoji = status === 'published' ? '✅' : status === 'draft' ? '📝' : '❓';
      console.log(`  ${emoji} ${status}: ${count}`);
    });

    console.log("\nClasses list:");
    allClasses.forEach((cls) => {
      const statusEmoji = cls.status === 'published' ? '✅' : cls.status === 'draft' ? '📝' : '❓';
      console.log(`  ${statusEmoji} ID ${cls.id}: "${cls.title}" - Status: ${cls.status || 'null'} - Date: ${cls.classDate}`);
    });
  }

  // Check courses
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📖 COURSES");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const allCourses = await db.select().from(courses);

  if (allCourses.length === 0) {
    console.log("⚠️  No courses found in database");
  } else {
    console.log(`Total courses: ${allCourses.length}\n`);

    const coursesByStatus = allCourses.reduce((acc, course) => {
      const status = course.status || 'null';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log("Status breakdown:");
    Object.entries(coursesByStatus).forEach(([status, count]) => {
      const emoji = status === 'published' ? '✅' : status === 'draft' ? '📝' : '❓';
      console.log(`  ${emoji} ${status}: ${count}`);
    });

    console.log("\nCourses list:");
    allCourses.forEach((course) => {
      const statusEmoji = course.status === 'published' ? '✅' : course.status === 'draft' ? '📝' : '❓';
      console.log(`  ${statusEmoji} ID ${course.id}: "${course.title}" - Status: ${course.status || 'null'}`);
    });
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 SUMMARY");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const draftClasses = allClasses.filter(c => c.status === 'draft');
  const draftCourses = allCourses.filter(c => c.status === 'draft');

  console.log(`Total classes: ${allClasses.length}`);
  console.log(`Total courses: ${allCourses.length}`);
  console.log(`\n🔴 Draft classes: ${draftClasses.length}`);
  console.log(`🔴 Draft courses: ${draftCourses.length}`);

  if (draftClasses.length > 0 || draftCourses.length > 0) {
    console.log("\n⚠️  PROBLEM IDENTIFIED:");
    console.log("   Classes/courses with 'draft' status won't appear in public listings!");
    console.log("   The API only returns items with status='published'");
    console.log("\n💡 SOLUTION:");
    console.log("   Run: npx tsx scripts/fix-draft-status.ts");
  } else {
    console.log("\n✅ All classes and courses are published!");
  }

  await sql.end();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
