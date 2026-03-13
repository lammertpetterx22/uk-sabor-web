/**
 * Setup Pull Zone for Bunny.net Storage
 * Run with: npx tsx server/setup-pull-zone.ts
 */

import "dotenv/config";

const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
const STORAGE_ZONE_NAME = process.env.BUNNY_STORAGE_ZONE || "uk-sabor";

interface StorageZone {
  Id: number;
  Name: string;
  PullZones: PullZone[];
}

interface PullZone {
  Id: number;
  Name: string;
  Hostnames: { Value: string }[];
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

async function setupPullZone() {
  console.log("\n🔗 Bunny.net Pull Zone Setup");
  console.log("=============================\n");

  try {
    // Get storage zone details
    console.log("📋 Checking storage zone...");
    const zones = await bunnyApiRequest<StorageZone[]>("/storagezone");
    const storageZone = zones.find((z) => z.Name === STORAGE_ZONE_NAME);

    if (!storageZone) {
      throw new Error(`Storage zone "${STORAGE_ZONE_NAME}" not found`);
    }

    console.log(`✅ Found storage zone: ${storageZone.Name}`);

    // Check if Pull Zone already exists
    if (storageZone.PullZones && storageZone.PullZones.length > 0) {
      console.log("\n✅ Pull Zone already exists!");
      storageZone.PullZones.forEach((pz) => {
        console.log(`\n   Name: ${pz.Name}`);
        console.log(`   ID: ${pz.Id}`);
        if (pz.Hostnames && pz.Hostnames.length > 0) {
          console.log(`   Hostnames:`);
          pz.Hostnames.forEach((h) => {
            console.log(`     - https://${h.Value}`);
          });
        }
      });

      console.log("\n📝 Your .env configuration is correct:");
      console.log(`   BUNNY_CDN_URL=https://${STORAGE_ZONE_NAME}.b-cdn.net`);

      return;
    }

    // Create Pull Zone
    console.log("\n📦 Creating Pull Zone...");

    const pullZonePayload = {
      Name: STORAGE_ZONE_NAME,
      OriginUrl: `https://storage.bunnycdn.com/${STORAGE_ZONE_NAME}/`,
      StorageZoneId: storageZone.Id,
      Type: 0, // 0 = Standard
    };

    const newPullZone = await bunnyApiRequest<PullZone>("/pullzone", {
      method: "POST",
      body: JSON.stringify(pullZonePayload),
    });

    console.log("\n✅ Pull Zone created successfully!");
    console.log(`   Name: ${newPullZone.Name}`);
    console.log(`   ID: ${newPullZone.Id}`);

    if (newPullZone.Hostnames && newPullZone.Hostnames.length > 0) {
      console.log(`   CDN URL: https://${newPullZone.Hostnames[0].Value}`);
    }

    console.log("\n📝 Your files are now accessible at:");
    console.log(`   https://${STORAGE_ZONE_NAME}.b-cdn.net/[path]/[filename]`);

    console.log("\n✅ Configuration complete!");
  } catch (error: any) {
    console.error("\n❌ Error during setup:");
    console.error(error.message);
    process.exit(1);
  }
}

setupPullZone();
