// Quick test script to verify Bunny.net connection
// Run with: npx tsx scripts/test-bunny-connection.ts

import { getBunnyConfig } from "../server/bunny";

async function testBunnyConnection() {
  console.log("🔍 Testing Bunny.net connection...\n");

  try {
    const config = getBunnyConfig();

    console.log("✅ Bunny.net Configuration:");
    console.log(`   Library ID: ${config.libraryId}`);
    console.log(`   Has Referrer Restriction: ${config.hasReferrerRestriction}`);
    console.log(`   Allowed Referrer: ${config.allowedReferrer || 'None'}`);

    console.log("\n✅ Connection test PASSED!");
    console.log("🎉 Your Bunny.net is ready to use!");
    console.log("\n📝 Next steps:");
    console.log("   1. Apply database migration: npx drizzle-kit push");
    console.log("   2. Upload your first video via admin panel");
    console.log("   3. Test playback with BunnyVideoPlayer component");

  } catch (error) {
    console.error("❌ Connection test FAILED:");
    console.error((error as Error).message);
    console.log("\n💡 Fix:");
    console.log("   - Check that BUNNY_API_KEY is set in .env");
    console.log("   - Check that BUNNY_VIDEO_LIBRARY_ID is set in .env");
  }
}

testBunnyConnection();
