#!/usr/bin/env tsx
/**
 * Clean test attendance records from production database
 */

import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function cleanTestAttendance() {
  console.log("🧹 Cleaning test attendance records...\n");

  const sql = postgres(DATABASE_URL, { max: 1 });

  try {
    // Get all attendance records
    const allRecords = await sql`
      SELECT a.*, u.email, u.name
      FROM attendance a
      LEFT JOIN users u ON a."userId" = u.id
      ORDER BY a."checkedInAt" DESC
    `;

    console.log(`Found ${allRecords.length} attendance records total\n`);

    if (allRecords.length === 0) {
      console.log("✅ No attendance records found");
      await sql.end();
      return;
    }

    // Show all records
    console.log("📋 Current attendance records:");
    allRecords.forEach((record, index) => {
      console.log(`${index + 1}. User: ${record.name || record.email || `ID ${record.userId}`}`);
      console.log(`   Item: ${record.itemType} #${record.itemId}`);
      console.log(`   Checked in: ${record.checkedInAt}`);
      console.log(`   QR Code ID: ${record.qrCodeId || 'N/A'}`);
      console.log('');
    });

    // Check for test/invalid data
    const testRecords = allRecords.filter(r =>
      r.email?.includes('test') ||
      r.email?.includes('demo') ||
      r.name?.toLowerCase().includes('test') ||
      r.name?.toLowerCase().includes('demo')
    );

    if (testRecords.length > 0) {
      console.log(`\n⚠️  Found ${testRecords.length} potential test records:`);
      testRecords.forEach(r => {
        console.log(`   - ${r.name || r.email} (${r.itemType} #${r.itemId})`);
      });

      // Delete test records
      const testIds = testRecords.map(r => r.id);
      const deleted = await sql`
        DELETE FROM attendance
        WHERE id = ANY(${testIds})
        RETURNING *
      `;

      console.log(`\n✅ Deleted ${deleted.length} test attendance records`);
    } else {
      console.log("\n✅ No test records found to clean");
    }

    // Final count
    const finalRecords = await sql`SELECT COUNT(*) as count FROM attendance`;
    console.log(`\n📊 Final count: ${finalRecords[0].count} attendance records remaining`);

  } catch (error) {
    console.error("❌ Error cleaning attendance:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

cleanTestAttendance().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
