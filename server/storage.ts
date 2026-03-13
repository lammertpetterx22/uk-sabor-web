// Storage system for UK Sabor Platform
// Uses Bunny.net Stream for ALL video content
// This file is kept for backward compatibility with legacy image references

import { bunnyUploadVideo } from './bunny';

/**
 * @deprecated Use Bunny.net directly for all new uploads
 * This function is kept only for legacy image compatibility
 *
 * For videos: Use trpc.uploads.uploadVideoToBunny
 * For images: Upload directly to Bunny.net or use a CDN
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  console.warn(`[Storage] DEPRECATED: storagePut() called with ${relKey}`);
  console.warn(`[Storage] Please migrate to Bunny.net API directly`);

  throw new Error(
    "AWS S3 and Forge storage have been removed. Use Bunny.net Stream API for video uploads. " +
    "Call trpc.uploads.uploadVideoToBunny instead."
  );
}

/**
 * @deprecated Use Bunny.net signed URLs for video playback
 * This function is kept only for legacy compatibility
 */
export async function storageGet(relKey: string): Promise<{ key: string; url: string; }> {
  console.warn(`[Storage] DEPRECATED: storageGet() called with ${relKey}`);
  console.warn(`[Storage] Please use Bunny.net signed URLs via trpc.uploads.getBunnySignedUrl`);

  throw new Error(
    "AWS S3 and Forge storage have been removed. Use Bunny.net Stream API for videos. " +
    "Call trpc.uploads.getBunnySignedUrl to get secure video URLs."
  );
}
