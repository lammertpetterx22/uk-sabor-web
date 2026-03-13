// Storage system for UK Sabor Platform
// Uses AWS S3 for images and static files
// NOTE: Videos now use Bunny.net Stream (see server/bunny.ts)

import { s3Upload, s3GetUrl } from './s3';

// Detect which storage backend to use
function isS3Configured(): boolean {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.S3_BUCKET_NAME
  );
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

/**
 * Upload file to S3 storage.
 * ⚠️ For videos, use Bunny.net instead (see server/bunny.ts and server/features/uploads.ts)
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  // ✅ Use AWS S3 if configured
  if (isS3Configured()) {
    console.log(`[Storage] Using AWS S3 for upload: ${relKey}`);
    return await s3Upload(relKey, data, contentType);
  }

  // If S3 is not configured, throw an error
  throw new Error(
    "AWS S3 not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and S3_BUCKET_NAME in .env"
  );
}

/**
 * Get public URL for a file in S3 storage.
 * ⚠️ For videos, use Bunny.net instead (see server/bunny.ts)
 */
export async function storageGet(relKey: string): Promise<{ key: string; url: string; }> {
  const key = normalizeKey(relKey);

  // ✅ Use AWS S3 if configured
  if (isS3Configured()) {
    return {
      key,
      url: s3GetUrl(key),
    };
  }

  // If S3 is not configured, throw an error
  throw new Error(
    "AWS S3 not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and S3_BUCKET_NAME in .env"
  );
}
