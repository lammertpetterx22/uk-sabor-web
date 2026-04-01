import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

async function cleanTestData() {
  console.log("🧹 Cleaning test data from production database...\n");

  const db = await getDb();
  if (!db) {
    console.error("❌ Database connection not available");
    process.exit(1);
  }

  try {
    // Find and delete test data in courses
    console.log("📚 Checking courses...");
    const deletedCourses = await db.execute(sql`
      DELETE FROM courses
      WHERE LOWER(title) LIKE '%test%'
         OR LOWER(title) LIKE '%dddd%'
         OR LOWER(title) LIKE '%prueba%'
      RETURNING id, title;
    `);

    const courseRows = deletedCourses.rows || [];
    if (courseRows.length > 0) {
      console.log("Deleted " + courseRows.length + " test course(s):");
      console.table(courseRows);
    } else {
      console.log("✅ No test courses found");
    }

    // Find and delete test data in events
    console.log("\n🎉 Checking events...");
    const deletedEvents = await db.execute(sql`
      DELETE FROM events
      WHERE LOWER(title) LIKE '%test%'
         OR LOWER(title) LIKE '%dddd%'
         OR LOWER(title) LIKE '%prueba%'
      RETURNING id, title;
    `);

    const eventRows = deletedEvents.rows || [];
    if (eventRows.length > 0) {
      console.log("Deleted " + eventRows.length + " test event(s):");
      console.table(eventRows);
    } else {
      console.log("✅ No test events found");
    }

    // Find and delete test data in classes
    console.log("\n💃 Checking classes...");
    const deletedClasses = await db.execute(sql`
      DELETE FROM classes
      WHERE LOWER(title) LIKE '%test%'
         OR LOWER(title) LIKE '%dddd%'
         OR LOWER(title) LIKE '%prueba%'
      RETURNING id, title;
    `);

    const classRows = deletedClasses.rows || [];
    if (classRows.length > 0) {
      console.log("Deleted " + classRows.length + " test class(es):");
      console.table(classRows);
    } else {
      console.log("✅ No test classes found");
    }

    const totalDeleted = courseRows.length + eventRows.length + classRows.length;
    console.log("\n✨ Cleanup completed! Total items deleted: " + totalDeleted);
    process.exit(0);
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    process.exit(1);
  }
}

cleanTestData();
