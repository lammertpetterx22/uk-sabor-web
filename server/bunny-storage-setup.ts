/**
 * Bunny.net Storage Zone Setup Script
 *
 * This script checks if a storage zone exists and creates one if needed.
 * Run with: npx tsx server/bunny-storage-setup.ts
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

async function bunnyApiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!BUNNY_API_KEY) {
    throw new Error("❌ BUNNY_API_KEY not found in .env file");
  }

  const url = `https://api.bunny.net${endpoint}`;
  const headers = {
    AccessKey: BUNNY_API_KEY,
    "Content-Type": "application/json",
    ...options.headers,
  };

  console.log(`[Bunny API] → ${options.method || "GET"} ${endpoint}`);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    console.error(`[Bunny API] ✗ Error ${response.status}: ${errorText}`);
    throw new Error(`Bunny.net API error (${response.status}): ${errorText}`);
  }

  return (await response.json()) as T;
}

/**
 * List all storage zones in the account
 */
async function listStorageZones(): Promise<StorageZone[]> {
  return await bunnyApiRequest<StorageZone[]>("/storagezone");
}

/**
 * Create a new storage zone
 * Valid regions: DE (Frankfurt), UK (London), NY (New York), LA (Los Angeles),
 *                SG (Singapore), SE (Stockholm), BR (São Paulo), JH (Johannesburg), SYD (Sydney)
 */
async function createStorageZone(
  name: string,
  region: string = "DE" // DE = Europe (Frankfurt, Germany)
): Promise<StorageZone> {
  console.log(`\n📦 Creating storage zone: ${name} (region: ${region})`);

  const payload = {
    Name: name,
    Region: region.toUpperCase(), // Ensure uppercase
    ReplicationRegions: [], // Can add: ["NY", "SG"] for geo-replication
    ZoneTier: 0, // 0 = Standard tier
  };

  return await bunnyApiRequest<StorageZone>("/storagezone", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Main setup function
 */
async function setupStorageZone() {
  console.log("\n🐰 Bunny.net Storage Zone Setup");
  console.log("================================\n");

  try {
    // Step 1: List existing storage zones
    console.log("📋 Checking existing storage zones...");
    const zones = await listStorageZones();

    console.log(`\n✅ Found ${zones.length} storage zone(s):`);
    zones.forEach((zone) => {
      console.log(`   - ${zone.Name} (${zone.Region}) - ${zone.FilesStored} files, ${(zone.StorageUsed / 1024 / 1024).toFixed(2)}MB used`);
    });

    // Step 2: Check if our zone exists
    const existingZone = zones.find((z) => z.Name === STORAGE_ZONE_NAME);

    if (existingZone) {
      console.log(`\n✅ Storage zone "${STORAGE_ZONE_NAME}" already exists!`);
      console.log(`   Region: ${existingZone.Region}`);
      console.log(`   CDN URL: https://${STORAGE_ZONE_NAME}.b-cdn.net`);
      console.log(`   Storage API: https://storage.bunnycdn.com/${STORAGE_ZONE_NAME}/`);

      console.log("\n✅ No action needed. Your .env configuration is correct:");
      console.log(`   BUNNY_STORAGE_ZONE=${STORAGE_ZONE_NAME}`);
      console.log(`   BUNNY_CDN_URL=https://${STORAGE_ZONE_NAME}.b-cdn.net`);

      return existingZone;
    }

    // Step 3: Create new storage zone if it doesn't exist
    console.log(`\n⚠️  Storage zone "${STORAGE_ZONE_NAME}" not found.`);
    console.log("Creating new storage zone...\n");

    const newZone = await createStorageZone(STORAGE_ZONE_NAME, "DE");

    console.log("\n✅ Storage zone created successfully!");
    console.log(`   Name: ${newZone.Name}`);
    console.log(`   Region: ${newZone.Region}`);
    console.log(`   CDN URL: https://${newZone.Name}.b-cdn.net`);
    console.log(`   Storage API: https://storage.bunnycdn.com/${newZone.Name}/`);

    console.log("\n📝 Update your .env file with:");
    console.log(`   BUNNY_STORAGE_ZONE=${newZone.Name}`);
    console.log(`   BUNNY_CDN_URL=https://${newZone.Name}.b-cdn.net`);

    return newZone;
  } catch (error: any) {
    console.error("\n❌ Error during setup:");
    console.error(error.message);

    if (error.message.includes("401")) {
      console.error("\n💡 Your BUNNY_API_KEY might be invalid. Check:");
      console.error("   1. Go to https://dash.bunny.net/account/settings");
      console.error("   2. Find your Account API Key (not the Storage API Key)");
      console.error("   3. Update BUNNY_API_KEY in .env");
    }

    process.exit(1);
  }
}

// Run the setup
setupStorageZone().then(() => {
  console.log("\n🎉 Setup complete!\n");
});
