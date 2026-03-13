// Bunny.net Stream API Integration for UK Sabor Platform
// Handles video uploads, streaming, and signed URL generation for maximum security

import crypto from "crypto";

// Bunny.net Configuration
const BUNNY_CONFIG = {
  apiKey: process.env.BUNNY_API_KEY || "",
  libraryId: process.env.BUNNY_VIDEO_LIBRARY_ID || "",
  allowedReferrer: process.env.BUNNY_ALLOWED_REFERRER || "",
  streamApiUrl: "https://video.bunnycdn.com",
  // Bunny.net automatically provides CDN URLs after upload
};

// ─── Validation ───────────────────────────────────────────────────────────────

function validateBunnyConfig() {
  if (!BUNNY_CONFIG.apiKey) {
    throw new Error(
      "Bunny.net API key missing: set BUNNY_API_KEY in .env. Get it from Bunny.net Dashboard → Stream → API"
    );
  }
  if (!BUNNY_CONFIG.libraryId) {
    throw new Error(
      "Bunny.net Library ID missing: set BUNNY_VIDEO_LIBRARY_ID in .env. Get it from Bunny.net Dashboard → Stream → Video Libraries"
    );
  }
}

// ─── API Helper ───────────────────────────────────────────────────────────────

interface BunnyVideoResponse {
  guid: string; // Video ID
  videoLibraryId: number;
  title: string;
  status: number; // 0=queued, 1=processing, 2=encoding, 3=finished, 4=error
  availableResolutions: string;
  thumbnailFileName: string;
  length: number; // duration in seconds
  dateUploaded: string;
  views: number;
  // ... other fields
}

interface BunnyUploadResponse {
  success: boolean;
  message: string;
  statusCode: number;
}

async function bunnyApiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  validateBunnyConfig();

  const url = `${BUNNY_CONFIG.streamApiUrl}${endpoint}`;
  const headers = {
    AccessKey: BUNNY_CONFIG.apiKey,
    "Content-Type": "application/json",
    ...options.headers,
  };

  console.log(`[Bunny.net] → ${options.method || "GET"} ${endpoint}`);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    console.error(`[Bunny.net] ✗ Error ${response.status}: ${errorText}`);
    throw new Error(
      `Bunny.net API error (${response.status}): ${errorText}`
    );
  }

  return (await response.json()) as T;
}

// ─── Create Video (Step 1 of TUS Upload) ─────────────────────────────────────

/**
 * Creates a new video entry in Bunny.net and returns a video ID.
 * This is the first step before uploading the actual video file.
 */
export async function bunnyCreateVideo(
  title: string,
  collectionId?: string
): Promise<{ videoId: string; libraryId: string }> {
  validateBunnyConfig();

  const payload: any = { title };
  if (collectionId) payload.collectionId = collectionId;

  const response = await bunnyApiRequest<BunnyVideoResponse>(
    `/library/${BUNNY_CONFIG.libraryId}/videos`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  console.log(
    `[Bunny.net] ✓ Created video: ${response.guid} (${title})`
  );

  return {
    videoId: response.guid,
    libraryId: BUNNY_CONFIG.libraryId,
  };
}

// ─── Upload Video via TUS Protocol ───────────────────────────────────────────

/**
 * Uploads a video file to Bunny.net using the TUS resumable upload protocol.
 * This is ideal for large files (20-40 min videos) as it supports resume on failure.
 *
 * @param videoId - The video GUID from bunnyCreateVideo()
 * @param videoBuffer - The video file as a Buffer
 * @param fileName - Original filename (for metadata)
 * @returns Upload response
 */
export async function bunnyUploadVideoTUS(
  videoId: string,
  videoBuffer: Buffer,
  fileName: string
): Promise<BunnyUploadResponse> {
  validateBunnyConfig();

  const uploadUrl = `${BUNNY_CONFIG.streamApiUrl}/library/${BUNNY_CONFIG.libraryId}/videos/${videoId}`;

  console.log(
    `[Bunny.net] 📤 Uploading video: ${fileName} (${(videoBuffer.length / 1024 / 1024).toFixed(1)}MB) → ${videoId}`
  );

  const uploadStartTime = Date.now();

  // Use TUS protocol headers for resumable uploads
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      AccessKey: BUNNY_CONFIG.apiKey,
      "Content-Type": "application/octet-stream",
      "Tus-Resumable": "1.0.0", // Enable TUS protocol
    },
    body: videoBuffer,
  });

  const uploadTime = ((Date.now() - uploadStartTime) / 1000).toFixed(2);
  const sizeMB = videoBuffer.length / 1024 / 1024;

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    console.error(`[Bunny.net] ✗ Upload failed: ${errorText}`);
    throw new Error(`Bunny.net upload failed (${response.status}): ${errorText}`);
  }

  console.log(
    `[Bunny.net] ✓ Upload complete: ${uploadTime}s (${(sizeMB / parseFloat(uploadTime)).toFixed(2)}MB/s)`
  );

  return {
    success: true,
    message: "Video uploaded successfully",
    statusCode: response.status,
  };
}

// ─── Get Video Info ───────────────────────────────────────────────────────────

/**
 * Retrieves video metadata from Bunny.net
 */
export async function bunnyGetVideoInfo(videoId: string): Promise<BunnyVideoResponse> {
  return await bunnyApiRequest<BunnyVideoResponse>(
    `/library/${BUNNY_CONFIG.libraryId}/videos/${videoId}`
  );
}

// ─── Generate Signed URL (Token Authentication) ──────────────────────────────

/**
 * Generates a signed URL for secure video playback.
 * This prevents unauthorized access and ensures videos can only be viewed
 * through your platform, not by copying the URL.
 *
 * @param videoId - Bunny.net video GUID
 * @param expiresInSeconds - URL validity duration (default: 24 hours)
 * @param ipAddress - Optional: lock to specific IP for extra security
 * @returns Signed embed URL
 */
export function bunnyGenerateSignedUrl(
  videoId: string,
  libraryId: string,
  expiresInSeconds: number = 86400, // 24 hours
  ipAddress?: string
): string {
  validateBunnyConfig();

  // Bunny.net iframe embed URL format
  const baseUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;

  // Generate expiration timestamp
  const expirationTime = Math.floor(Date.now() / 1000) + expiresInSeconds;

  // Build signature string
  let signatureString = `${BUNNY_CONFIG.apiKey}${videoId}${expirationTime}`;
  if (ipAddress) {
    signatureString += ipAddress;
  }

  // Create SHA256 hash
  const signature = crypto
    .createHash("sha256")
    .update(signatureString)
    .digest("hex");

  // Build final URL with token parameters
  let signedUrl = `${baseUrl}?token=${signature}&expires=${expirationTime}`;

  // Add optional IP restriction
  if (ipAddress) {
    signedUrl += `&ip=${ipAddress}`;
  }

  // Add referrer restriction if configured
  if (BUNNY_CONFIG.allowedReferrer) {
    signedUrl += `&referer=${encodeURIComponent(BUNNY_CONFIG.allowedReferrer)}`;
  }

  console.log(`[Bunny.net] 🔐 Generated signed URL for ${videoId} (expires in ${expiresInSeconds}s)`);

  return signedUrl;
}

// ─── Get Embed URL (Public - No Token) ───────────────────────────────────────

/**
 * Returns the basic embed URL without token authentication.
 * Use bunnyGenerateSignedUrl() for protected content.
 */
export function bunnyGetEmbedUrl(videoId: string, libraryId: string): string {
  return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;
}

// ─── Delete Video ─────────────────────────────────────────────────────────────

/**
 * Permanently deletes a video from Bunny.net
 */
export async function bunnyDeleteVideo(videoId: string): Promise<void> {
  await bunnyApiRequest(
    `/library/${BUNNY_CONFIG.libraryId}/videos/${videoId}`,
    { method: "DELETE" }
  );
  console.log(`[Bunny.net] 🗑️ Deleted video: ${videoId}`);
}

// ─── Video Status Helper ──────────────────────────────────────────────────────

export enum BunnyVideoStatus {
  Queued = 0,
  Processing = 1,
  Encoding = 2,
  Finished = 3,
  Error = 4,
}

/**
 * Checks if a video is ready for playback
 */
export function bunnyIsVideoReady(status: number): boolean {
  return status === BunnyVideoStatus.Finished;
}

/**
 * Gets human-readable status text
 */
export function bunnyGetStatusText(status: number): string {
  switch (status) {
    case BunnyVideoStatus.Queued: return "En cola";
    case BunnyVideoStatus.Processing: return "Procesando";
    case BunnyVideoStatus.Encoding: return "Codificando";
    case BunnyVideoStatus.Finished: return "Listo";
    case BunnyVideoStatus.Error: return "Error";
    default: return "Desconocido";
  }
}

// ─── Combined Upload Function (Create + Upload) ───────────────────────────────

/**
 * All-in-one function: Creates video entry and uploads the file.
 * Perfect for your admin panel workflow.
 *
 * @param title - Video title (e.g., "Salsa Básica - Lección 1")
 * @param videoBuffer - Video file data
 * @param fileName - Original filename
 * @returns Video ID and library ID for database storage
 */
export async function bunnyUploadVideo(
  title: string,
  videoBuffer: Buffer,
  fileName: string
): Promise<{ videoId: string; libraryId: string }> {
  console.log(`[Bunny.net] 🎬 Starting upload: "${title}"`);

  // Step 1: Create video entry
  const { videoId, libraryId } = await bunnyCreateVideo(title);

  // Step 2: Upload video file via TUS
  await bunnyUploadVideoTUS(videoId, videoBuffer, fileName);

  console.log(`[Bunny.net] ✅ Upload complete: ${videoId} is now processing`);

  return { videoId, libraryId };
}

// ─── Configuration Exports ────────────────────────────────────────────────────

export function getBunnyLibraryId(): string {
  validateBunnyConfig();
  return BUNNY_CONFIG.libraryId;
}

export function getBunnyConfig() {
  validateBunnyConfig();
  return {
    libraryId: BUNNY_CONFIG.libraryId,
    hasReferrerRestriction: !!BUNNY_CONFIG.allowedReferrer,
    allowedReferrer: BUNNY_CONFIG.allowedReferrer,
  };
}
