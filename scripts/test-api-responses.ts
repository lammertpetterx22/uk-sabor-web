/**
 * Test API responses for classes and courses
 *
 * This script simulates API calls to check what data is being returned
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { classes, courses } from "../drizzle/schema";
import { eq, desc, gte, and } from "drizzle-orm";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL is not set");
    process.exit(1);
  }

  const sql = postgres(databaseUrl);
  const db = drizzle(sql);

  console.log("🧪 Testing API queries...\n");
  console.log(`Current time: ${new Date().toISOString()}\n`);

  // Test classes.list (public API - published + future only)
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📚 CLASSES.LIST (Public API)");
  console.log("   Filters: status='published' AND classDate >= NOW()");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const publicClasses = await db
    .select()
    .from(classes)
    .where(and(eq(classes.status, "published"), gte(classes.classDate, new Date())))
    .orderBy(desc(classes.classDate))
    .limit(100);

  if (publicClasses.length === 0) {
    console.log("❌ No classes returned (this is why the page is empty!)");
  } else {
    console.log(`✅ Found ${publicClasses.length} classes:`);
    publicClasses.forEach((cls) => {
      console.log(`   - ID ${cls.id}: "${cls.title}" on ${cls.classDate}`);
    });
  }

  // Test classes.listAll (protected API - all statuses, all dates)
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📚 CLASSES.LISTALL (Admin/Instructor API)");
  console.log("   Filters: NONE (shows all classes)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const allClasses = await db
    .select()
    .from(classes)
    .orderBy(desc(classes.classDate))
    .limit(100);

  if (allClasses.length === 0) {
    console.log("❌ No classes in database");
  } else {
    console.log(`✅ Found ${allClasses.length} classes:`);
    allClasses.forEach((cls) => {
      const isPast = new Date(cls.classDate) < new Date();
      const statusEmoji = isPast ? "⏰ PAST" : "📅 FUTURE";
      console.log(`   ${statusEmoji} - ID ${cls.id}: "${cls.title}" - ${cls.classDate} - Status: ${cls.status}`);
    });
  }

  // Test courses.list (public API - published only)
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📖 COURSES.LIST (Public API)");
  console.log("   Filters: status='published'");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const publicCourses = await db
    .select()
    .from(courses)
    .where(eq(courses.status, "published"))
    .orderBy(desc(courses.createdAt))
    .limit(100);

  if (publicCourses.length === 0) {
    console.log("❌ No courses returned (this is why the page is empty!)");
  } else {
    console.log(`✅ Found ${publicCourses.length} courses:`);
    publicCourses.forEach((course) => {
      console.log(`   - ID ${course.id}: "${course.title}"`);
    });
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 DIAGNOSIS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  if (publicClasses.length === 0 && allClasses.length > 0) {
    console.log("\n⚠️  PROBLEM: Classes exist but are filtered out!");
    console.log("\n🔍 Reasons classes might be hidden:");
    const pastClasses = allClasses.filter(c => new Date(c.classDate) < new Date());
    const draftClasses = allClasses.filter(c => c.status !== 'published');

    if (pastClasses.length > 0) {
      console.log(`   📅 ${pastClasses.length} class(es) are in the PAST (API only shows future classes)`);
      pastClasses.forEach((cls) => {
        console.log(`      - "${cls.title}" was on ${cls.classDate}`);
      });
    }

    if (draftClasses.length > 0) {
      console.log(`   📝 ${draftClasses.length} class(es) are in DRAFT status`);
    }

    console.log("\n💡 SOLUTIONS:");
    if (pastClasses.length > 0) {
      console.log("   1. Create new classes with future dates");
      console.log("   2. Update existing classes to future dates");
    }
    if (draftClasses.length > 0) {
      console.log("   3. Run: npx tsx scripts/fix-draft-status.ts");
    }
  } else if (publicClasses.length > 0) {
    console.log("\n✅ Classes API is working correctly!");
  } else if (allClasses.length === 0) {
    console.log("\n⚠️  No classes exist in database - create some classes!");
  }

  if (publicCourses.length === 0) {
    const allCourses = await db.select().from(courses);
    if (allCourses.length > 0) {
      console.log("\n⚠️  Courses exist but are filtered out (likely draft status)");
      console.log("   Run: npx tsx scripts/fix-draft-status.ts");
    } else {
      console.log("\n⚠️  No courses exist in database - create some courses!");
    }
  } else {
    console.log("\n✅ Courses API is working correctly!");
  }

  await sql.end();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
