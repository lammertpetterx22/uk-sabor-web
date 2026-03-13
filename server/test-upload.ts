/**
 * Test script for Bunny.net Storage upload
 * Run with: npx tsx server/test-upload.ts
 */

import "dotenv/config";

const BUNNY_STORAGE_CONFIG = {
  apiKey: process.env.BUNNY_STORAGE_API_KEY || process.env.BUNNY_API_KEY || "",
  storageZone: process.env.BUNNY_STORAGE_ZONE || "uk-sabor",
  cdnUrl: process.env.BUNNY_CDN_URL || "https://uk-sabor.b-cdn.net",
  storageUrl: "https://storage.bunnycdn.com",
};

async function testUpload() {
  console.log("\n🧪 Testing Bunny.net Storage Upload");
  console.log("====================================\n");

  console.log("Configuration:");
  console.log(`  Storage Zone: ${BUNNY_STORAGE_CONFIG.storageZone}`);
  console.log(`  CDN URL: ${BUNNY_STORAGE_CONFIG.cdnUrl}`);
  console.log(`  API Key: ${BUNNY_STORAGE_CONFIG.apiKey.substring(0, 10)}...`);

  // Create a simple test file (1x1 pixel red PNG)
  const testImageBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
  const buffer = Buffer.from(testImageBase64, "base64");

  const fileName = `test-${Date.now()}.png`;
  const folder = "test";

  console.log(`\n📤 Uploading test file: ${fileName}`);
  console.log(`   Folder: ${folder}`);
  console.log(`   Size: ${buffer.length} bytes`);

  try {
    // Build the upload URL
    const path = `/${BUNNY_STORAGE_CONFIG.storageZone}/${folder}/${fileName}`;
    const uploadUrl = `${BUNNY_STORAGE_CONFIG.storageUrl}${path}`;

    console.log(`\n🔗 Upload URL: ${uploadUrl}`);

    // Upload the file
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        AccessKey: BUNNY_STORAGE_CONFIG.apiKey,
        "Content-Type": "application/octet-stream",
      },
      body: new Uint8Array(buffer),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      console.error(`\n❌ Upload failed: ${errorText}`);
      throw new Error(`Failed to upload: ${errorText}`);
    }

    const publicUrl = `${BUNNY_STORAGE_CONFIG.cdnUrl}/${folder}/${fileName}`;

    console.log("\n✅ Upload successful!");
    console.log(`   Public URL: ${publicUrl}`);

    // Wait a moment for CDN propagation
    console.log("\n⏳ Waiting 2 seconds for CDN propagation...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Try to fetch the file from CDN
    console.log("\n🌐 Testing CDN access...");
    const cdnResponse = await fetch(publicUrl);

    if (cdnResponse.ok) {
      console.log("✅ File accessible from CDN!");
      console.log(`   Status: ${cdnResponse.status}`);
      console.log(`   Content-Type: ${cdnResponse.headers.get("content-type")}`);
    } else {
      console.log(
        `⚠️  File not yet available on CDN (${cdnResponse.status}). This is normal - it may take a few minutes.`
      );
    }

    console.log("\n🎉 Test complete! The upload system is working.");
    console.log(`\n💡 You can view the test file at:\n   ${publicUrl}`);
  } catch (error: any) {
    console.error("\n❌ Test failed:");
    console.error(error.message);

    if (error.message.includes("401")) {
      console.error("\n💡 Authentication failed. Possible issues:");
      console.error("   1. Invalid BUNNY_API_KEY in .env");
      console.error("   2. Storage zone 'uk-sabor' doesn't exist");
      console.error("   3. API key doesn't have permission for this storage zone");
    }

    process.exit(1);
  }
}

testUpload();
