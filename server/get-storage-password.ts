/**
 * Get Storage Zone password/API key
 * Run with: npx tsx server/get-storage-password.ts
 */

import "dotenv/config";

const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
const STORAGE_ZONE_NAME = process.env.BUNNY_STORAGE_ZONE || "uk-sabor";

interface StorageZone {
  Id: number;
  UserId: string;
  Name: string;
  Password: string;
  DateModified: string;
  Deleted: boolean;
  StorageUsed: number;
  FilesStored: number;
  Region: string;
  ReplicationRegions: string[];
  PullZones: any[];
  ReadOnlyPassword: string;
  Custom404FilePath: string | null;
  ReplicationChangeInProgress: boolean;
  Discount: number;
}

async function getStorageZoneDetails() {
  console.log("\n🔑 Retrieving Storage Zone Credentials");
  console.log("=======================================\n");

  if (!BUNNY_API_KEY) {
    console.error("❌ BUNNY_API_KEY not found in .env");
    process.exit(1);
  }

  try {
    // List all storage zones
    const response = await fetch("https://api.bunny.net/storagezone", {
      headers: {
        AccessKey: BUNNY_API_KEY,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${error}`);
    }

    const zones: StorageZone[] = await response.json();

    const zone = zones.find((z) => z.Name === STORAGE_ZONE_NAME);

    if (!zone) {
      console.error(`❌ Storage zone "${STORAGE_ZONE_NAME}" not found`);
      console.log("\nAvailable zones:");
      zones.forEach((z) => console.log(`  - ${z.Name}`));
      process.exit(1);
    }

    console.log(`✅ Found storage zone: ${zone.Name}\n`);
    console.log("📋 Storage Zone Details:");
    console.log(`   ID: ${zone.Id}`);
    console.log(`   Region: ${zone.Region}`);
    console.log(`   Files Stored: ${zone.FilesStored}`);
    console.log(`   Storage Used: ${(zone.StorageUsed / 1024 / 1024).toFixed(2)} MB`);

    console.log("\n🔐 API Credentials:");
    console.log(`   Storage Zone Name: ${zone.Name}`);
    console.log(`   Password (Read/Write): ${zone.Password}`);
    console.log(`   Read-Only Password: ${zone.ReadOnlyPassword}`);

    console.log("\n📝 Add this to your .env file:");
    console.log(`BUNNY_STORAGE_API_KEY=${zone.Password}`);

    console.log("\n🔗 Connection Details:");
    console.log(`   FTP Hostname: storage.bunnycdn.com`);
    console.log(`   FTP Username: ${zone.Name}`);
    console.log(`   FTP Password: ${zone.Password}`);
    console.log(`   CDN URL: https://${zone.Name}.b-cdn.net`);
    console.log(`   API Upload URL: https://storage.bunnycdn.com/${zone.Name}/`);

    console.log("\n✅ Use the Password above as the AccessKey for uploads!");
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

getStorageZoneDetails();
