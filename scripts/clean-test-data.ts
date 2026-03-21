/**
 * Script to clean placeholder/test data from the database
 *
 * Issues identified in QA report:
 * - Course descriptions containing "Lorem Ipsum"
 * - Inconsistent lesson counts (e.g., 12 vs 1)
 * - Empty class calendars
 *
 * Run this script to identify and optionally remove test data
 */

import { db } from "../server/db";
import { courses, classes, events, lessons } from "../server/db/schema";
import { sql } from "drizzle-orm";
import { like } from "drizzle-orm";

async function identifyTestData() {
  console.log("🔍 Scanning for test/placeholder data...\n");

  // 1. Find courses with Lorem Ipsum
  console.log("📚 COURSES with Lorem Ipsum:");
  const loremCourses = await db
    .select()
    .from(courses)
    .where(
      sql`LOWER(${courses.description}) LIKE '%lorem%' OR LOWER(${courses.description}) LIKE '%ipsum%'`
    );

  if (loremCourses.length > 0) {
    console.log(`Found ${loremCourses.length} courses with placeholder text:`);
    loremCourses.forEach(c => {
      console.log(`  - ID ${c.id}: "${c.title}" (${c.description?.substring(0, 50)}...)`);
    });
  } else {
    console.log("  ✅ No courses with Lorem Ipsum found");
  }

  // 2. Find courses with inconsistent lesson counts
  console.log("\n📊 COURSES with inconsistent lesson counts:");
  const coursesWithLessons = await db.execute(sql`
    SELECT
      c.id,
      c.title,
      c.lessons_count as declared_count,
      COUNT(l.id) as actual_count
    FROM courses c
    LEFT JOIN lessons l ON c.id = l.course_id
    GROUP BY c.id, c.title, c.lessons_count
    HAVING c.lessons_count != COUNT(l.id)
  `);

  if (coursesWithLessons.rows.length > 0) {
    console.log(`Found ${coursesWithLessons.rows.length} courses with mismatched counts:`);
    coursesWithLessons.rows.forEach((row: any) => {
      console.log(`  - ID ${row.id}: "${row.title}" (declared: ${row.declared_count}, actual: ${row.actual_count})`);
    });
  } else {
    console.log("  ✅ All courses have consistent lesson counts");
  }

  // 3. Find empty class calendars
  console.log("\n📅 CLASSES status:");
  const allClasses = await db.select().from(classes);
  const futureClasses = allClasses.filter(c => new Date(c.startDate) > new Date());

  console.log(`  Total classes: ${allClasses.length}`);
  console.log(`  Future classes: ${futureClasses.length}`);

  if (futureClasses.length === 0) {
    console.log("  ⚠️  No upcoming classes found (calendar appears empty)");
  } else {
    console.log("  ✅ Calendar has upcoming classes");
  }

  // 4. Find events with placeholder data
  console.log("\n🎉 EVENTS with Lorem Ipsum:");
  const loremEvents = await db
    .select()
    .from(events)
    .where(
      sql`LOWER(${events.description}) LIKE '%lorem%' OR LOWER(${events.description}) LIKE '%ipsum%'`
    );

  if (loremEvents.length > 0) {
    console.log(`Found ${loremEvents.length} events with placeholder text:`);
    loremEvents.forEach(e => {
      console.log(`  - ID ${e.id}: "${e.name}" (${e.description?.substring(0, 50)}...)`);
    });
  } else {
    console.log("  ✅ No events with Lorem Ipsum found");
  }

  console.log("\n" + "=".repeat(60));
  console.log("📝 RECOMMENDATIONS:");
  console.log("=".repeat(60));

  const issuesFound = loremCourses.length + loremEvents.length +
                      (coursesWithLessons.rows.length as number) +
                      (futureClasses.length === 0 ? 1 : 0);

  if (issuesFound > 0) {
    console.log("❌ Issues found. Please clean test data before going live:");
    console.log("   1. Update course/event descriptions to remove Lorem Ipsum");
    console.log("   2. Fix lesson counts to match actual lessons");
    console.log("   3. Add real upcoming classes to the calendar");
    console.log("\n   Run with --fix flag to attempt automatic cleanup (CAUTION!)");
  } else {
    console.log("✅ No obvious test data found. Database looks production-ready!");
  }
}

async function fixTestData() {
  console.log("⚠️  AUTOMATIC CLEANUP NOT IMPLEMENTED");
  console.log("Please manually review and update test data using the admin panel.");
  console.log("This is safer than automatic deletion.");
}

// Main execution
const args = process.argv.slice(2);
const shouldFix = args.includes("--fix");

identifyTestData()
  .then(() => {
    if (shouldFix) {
      return fixTestData();
    }
  })
  .then(() => {
    console.log("\n✅ Scan complete");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
