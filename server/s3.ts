// AWS S3 Storage for UK Sabor Platform
// Handles file uploads to S3 with CloudFront CDN URLs

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// S3 Configuration
const S3_CONFIG = {
  region: process.env.AWS_REGION || "eu-west-1",
  bucket: process.env.S3_BUCKET_NAME || "",
  cdnUrl: process.env.CLOUDFRONT_CDN_URL || "", // e.g., "https://d1234567890.cloudfront.net"
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
};

// Initialize S3 Client
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    // Validate configuration
    if (!S3_CONFIG.credentials.accessKeyId || !S3_CONFIG.credentials.secretAccessKey) {
      throw new Error(
        "AWS credentials missing: set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env"
      );
    }
    if (!S3_CONFIG.bucket) {
      throw new Error("S3 bucket missing: set S3_BUCKET_NAME in .env");
    }

    s3Client = new S3Client({
      region: S3_CONFIG.region,
      credentials: S3_CONFIG.credentials,
    });

    console.log(`[S3] ✅ Initialized S3 client for bucket: ${S3_CONFIG.bucket} (${S3_CONFIG.region})`);
  }

  return s3Client;
}

/**
 * Upload a file to S3 and return the CDN URL
 * @param key - S3 object key (e.g., "courses/123/videos/video.mp4")
 * @param data - File data (Buffer, Uint8Array, or string)
 * @param contentType - MIME type (e.g., "video/mp4", "image/jpeg")
 * @returns Object with key and public URL (CloudFront CDN or S3 direct)
 */
export async function s3Upload(
  key: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const client = getS3Client();
  const normalizedKey = key.replace(/^\/+/, ""); // Remove leading slashes

  // Convert data to Buffer if needed
  const body = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);

  // Upload to S3
  const command = new PutObjectCommand({
    Bucket: S3_CONFIG.bucket,
    Key: normalizedKey,
    Body: body,
    ContentType: contentType,
    CacheControl: "max-age=31536000", // 1 year cache for static assets
  });

  await client.send(command);

  // Build URL (prefer CloudFront CDN if configured, otherwise direct S3)
  let url: string;
  if (S3_CONFIG.cdnUrl) {
    // Use CloudFront CDN
    url = `${S3_CONFIG.cdnUrl.replace(/\/+$/, "")}/${normalizedKey}`;
  } else {
    // Fallback to direct S3 URL
    url = `https://${S3_CONFIG.bucket}.s3.${S3_CONFIG.region}.amazonaws.com/${normalizedKey}`;
  }

  console.log(`[S3] ✅ Uploaded: ${normalizedKey} → ${url}`);
  return { key: normalizedKey, url };
}

/**
 * Get the public URL for an S3 object
 * @param key - S3 object key
 * @returns Public URL (CloudFront CDN or S3 direct)
 */
export function s3GetUrl(key: string): string {
  const normalizedKey = key.replace(/^\/+/, "");

  if (S3_CONFIG.cdnUrl) {
    return `${S3_CONFIG.cdnUrl.replace(/\/+$/, "")}/${normalizedKey}`;
  } else {
    return `https://${S3_CONFIG.bucket}.s3.${S3_CONFIG.region}.amazonaws.com/${normalizedKey}`;
  }
}
