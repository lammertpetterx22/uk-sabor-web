#!/usr/bin/env tsx
/**
 * Remove Malva's attendance record from event #13
 */

import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function removeMalvaAttendance() {
  console.log("🧹 Removing Malva's attendance from event #13...\n");

  const sql = postgres(DATABASE_URL, { max: 1 });

  try {
    // Find Malva's user ID
    const malvaUser = await sql`
      SELECT id, name, email
      FROM users
      WHERE name ILIKE '%malva%'
      LIMIT 1
    `;

    if (malvaUser.length === 0) {
      console.log("❌ Malva user not found");
      await sql.end();
      return;
    }

    const malvaId = malvaUser[0].id;
    console.log(`Found Malva: ${malvaUser[0].name} (${malvaUser[0].email}) - ID: ${malvaId}`);

    // Find attendance record for event #13
    const attendanceRecord = await sql`
      SELECT *
      FROM attendance
      WHERE "userId" = ${malvaId}
      AND "itemType" = 'event'
      AND "itemId" = 13
    `;

    if (attendanceRecord.length === 0) {
      console.log("❌ No attendance record found for Malva at event #13");
      await sql.end();
      return;
    }

    console.log(`\nFound attendance record:`);
    console.log(`  - Checked in at: ${attendanceRecord[0].checkedInAt}`);
    console.log(`  - QR Code ID: ${attendanceRecord[0].qrCodeId}`);

    // Delete the attendance record
    const deleted = await sql`
      DELETE FROM attendance
      WHERE "userId" = ${malvaId}
      AND "itemType" = 'event'
      AND "itemId" = 13
      RETURNING *
    `;

    console.log(`\n✅ Deleted attendance record for Malva at event #13`);

    // Also reset the QR code if it exists
    if (attendanceRecord[0].qrCodeId) {
      const qrReset = await sql`
        UPDATE "qrCodes"
        SET "isUsed" = false, "usedAt" = NULL
        WHERE id = ${attendanceRecord[0].qrCodeId}
        RETURNING *
      `;

      if (qrReset.length > 0) {
        console.log(`✅ Reset QR code #${attendanceRecord[0].qrCodeId} to unused state`);
      }
    }

    console.log(`\n🎉 Done! Malva can now check in again at event #13`);

  } catch (error) {
    console.error("❌ Error removing attendance:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

removeMalvaAttendance().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
