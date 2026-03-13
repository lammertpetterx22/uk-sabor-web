import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { bunnyUploadVideo, bunnyGetVideoInfo, bunnyGenerateSignedUrl, getBunnyLibraryId } from "../bunny";

// Bunny.net Storage configuration for images/files
const BUNNY_STORAGE_CONFIG = {
  apiKey: process.env.BUNNY_STORAGE_API_KEY || process.env.BUNNY_API_KEY || "",
  storageZone: process.env.BUNNY_STORAGE_ZONE || "uk-sabor",
  cdnUrl: process.env.BUNNY_CDN_URL || "https://uk-sabor.b-cdn.net",
  storageUrl: "https://storage.bunnycdn.com",
};

/**
 * Upload a file (image, document, etc.) to Bunny.net Storage
 */
async function bunnyUploadFile(
  fileBuffer: Buffer,
  fileName: string,
  folder: string = ""
): Promise<{ url: string }> {
  const apiKey = BUNNY_STORAGE_CONFIG.apiKey;
  const storageZone = BUNNY_STORAGE_CONFIG.storageZone;

  if (!apiKey) {
    throw new Error("BUNNY_API_KEY no está configurado");
  }

  // Build the path: /storageZone/folder/filename
  const path = folder ? `/${storageZone}/${folder}/${fileName}` : `/${storageZone}/${fileName}`;
  const uploadUrl = `${BUNNY_STORAGE_CONFIG.storageUrl}${path}`;

  console.log(`[Bunny Storage] 📤 Uploading: ${fileName} to ${folder || 'root'}`);

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      AccessKey: apiKey,
      "Content-Type": "application/octet-stream",
    },
    body: new Uint8Array(fileBuffer),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    console.error(`[Bunny Storage] ✗ Upload failed: ${errorText}`);
    throw new Error(`Failed to upload to Bunny.net Storage: ${errorText}`);
  }

  const publicUrl = folder
    ? `${BUNNY_STORAGE_CONFIG.cdnUrl}/${folder}/${fileName}`
    : `${BUNNY_STORAGE_CONFIG.cdnUrl}/${fileName}`;

  console.log(`[Bunny Storage] ✅ Upload complete: ${publicUrl}`);

  return { url: publicUrl };
}

export const uploadsRouter = router({
  /**
   * Upload a general file (image, document, etc.) to Bunny.net Storage.
   * Used for event flyers, instructor photos, course covers, etc.
   */
  uploadFile: protectedProcedure
    .input(
      z.object({
        fileBase64: z.string().describe("Base64 encoded file data"),
        fileName: z.string(),
        mimeType: z.string().optional(),
        folder: z.string().optional().describe("Storage folder (e.g., 'events', 'instructors')"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Only admin or instructor can upload files
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "instructor") {
        throw new Error("Only admins and instructors can upload files");
      }

      console.log(`[Upload] 📁 Starting file upload: ${input.fileName}`);

      // Strip data URL prefix if present
      let base64Data = input.fileBase64;
      if (base64Data.includes(",")) {
        base64Data = base64Data.split(",")[1];
      }

      const buffer = Buffer.from(base64Data, "base64");
      const fileSizeMB = buffer.length / 1024 / 1024;

      // Validate file size (max 50MB for images/documents)
      const MAX_FILE_SIZE_MB = 50;
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        throw new Error(
          `File too large: ${fileSizeMB.toFixed(1)}MB. Maximum: ${MAX_FILE_SIZE_MB}MB`
        );
      }

      console.log(`[Upload] ✅ File validated: ${fileSizeMB.toFixed(2)}MB`);

      // Upload to Bunny.net Storage
      const result = await bunnyUploadFile(buffer, input.fileName, input.folder);

      console.log(`[Upload] ✅ Upload complete: ${result.url}`);

      return {
        success: true,
        url: result.url,
        message: "File uploaded successfully",
      };
    }),

  /**
   * Upload video to Bunny.net Stream (for lessons and recorded classes).
   * Supports large files (20-40 min) via TUS resumable upload.
   * Returns bunnyVideoId and bunnyLibraryId for database storage.
   */
  uploadVideoToBunny: protectedProcedure
    .input(
      z.object({
        videoBase64: z.string().describe("Base64 encoded video data (without data: prefix)"),
        fileName: z.string(),
        title: z.string().describe("Video title (e.g., 'Salsa Básica - Lección 1')"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Only admin or instructor can upload videos
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "instructor") {
        throw new Error("Only admins and instructors can upload videos");
      }

      console.log(`[Upload] 🎬 Starting Bunny.net video upload: ${input.title}`);

      // Strip data URL prefix if present
      let base64Data = input.videoBase64;
      if (base64Data.includes(",")) {
        base64Data = base64Data.split(",")[1];
      }

      const buffer = Buffer.from(base64Data, "base64");
      const fileSizeMB = buffer.length / 1024 / 1024;

      // Validate video size
      const MAX_VIDEO_SIZE_MB = 2048; // 2GB limit for Bunny.net
      if (fileSizeMB > MAX_VIDEO_SIZE_MB) {
        throw new Error(
          `Video demasiado grande: ${fileSizeMB.toFixed(1)}MB. Máximo permitido: ${MAX_VIDEO_SIZE_MB}MB (2GB)`
        );
      }

      console.log(`[Upload] ✅ Video validated: ${fileSizeMB.toFixed(1)}MB (${input.fileName})`);

      // Upload to Bunny.net
      const { videoId, libraryId } = await bunnyUploadVideo(
        input.title,
        buffer,
        input.fileName
      );

      console.log(`[Upload] ✅ Bunny.net upload complete: ${videoId}`);

      return {
        success: true,
        bunnyVideoId: videoId,
        bunnyLibraryId: libraryId,
        message: "Video subido exitosamente. Bunny.net está procesando el video.",
      };
    }),

  /**
   * Get Bunny.net video status and info
   */
  getBunnyVideoStatus: protectedProcedure
    .input(
      z.object({
        bunnyVideoId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const videoInfo = await bunnyGetVideoInfo(input.bunnyVideoId);
      return {
        videoId: videoInfo.guid,
        status: videoInfo.status,
        durationSeconds: videoInfo.length,
        thumbnail: videoInfo.thumbnailFileName,
        views: videoInfo.views,
        isReady: videoInfo.status === 3, // 3 = finished/ready
      };
    }),

  /**
   * Generate signed URL for secure video playback
   */
  getBunnySignedUrl: protectedProcedure
    .input(
      z.object({
        bunnyVideoId: z.string(),
        bunnyLibraryId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const libraryId = input.bunnyLibraryId || getBunnyLibraryId();

      // Get user's IP for extra security (optional)
      const ipAddress = ctx.req?.headers?.["x-forwarded-for"] as string | undefined;

      // Generate signed URL valid for 24 hours
      const signedUrl = bunnyGenerateSignedUrl(
        input.bunnyVideoId,
        libraryId,
        86400, // 24 hours
        ipAddress
      );

      return {
        signedUrl,
        expiresIn: 86400,
      };
    }),
});
