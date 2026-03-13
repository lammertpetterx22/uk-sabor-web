import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { storagePut } from "../storage";
import { bunnyUploadVideo, bunnyGetVideoInfo, bunnyGenerateSignedUrl, getBunnyLibraryId } from "../bunny";

function randomSuffix() {
  return Math.random().toString(36).substring(2, 10);
}

export const uploadsRouter = router({
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

  /**
   * Generic file upload - uploads base64 data to S3 and returns CDN URL.
   * Use this BEFORE creating/updating records so you have the URL ready.
   * NOTE: For videos, use uploadVideoToBunny instead.
   */
  uploadFile: protectedProcedure
    .input(
      z.object({
        fileBase64: z.string().describe("Base64 encoded file data (without data: prefix)"),
        fileName: z.string(),
        mimeType: z.string().default("image/jpeg"),
        folder: z.string().default("uploads"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Only admin or instructor can upload
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "instructor") {
        throw new Error("Only admins and instructors can upload files");
      }

      // Strip data URL prefix if present (e.g. "data:image/png;base64,")
      let base64Data = input.fileBase64;
      if (base64Data.includes(",")) {
        base64Data = base64Data.split(",")[1];
      }

      const buffer = Buffer.from(base64Data, "base64");
      const fileSizeMB = buffer.length / 1024 / 1024;

      // SECURITY: Server-side file size validation
      const isVideo = input.mimeType.startsWith("video/") || input.folder.includes("videos");
      const isImage = input.mimeType.startsWith("image/") || input.folder.includes("images");

      if (isVideo) {
        const MAX_VIDEO_SIZE_MB = 1024; // 1GB
        if (fileSizeMB > MAX_VIDEO_SIZE_MB) {
          throw new Error(
            `Video demasiado grande: ${fileSizeMB.toFixed(1)}MB. Máximo permitido: ${MAX_VIDEO_SIZE_MB}MB (1GB)`
          );
        }
        console.log(`[Upload] ✅ Video validated: ${fileSizeMB.toFixed(1)}MB (${input.fileName})`);
      } else if (isImage) {
        const MAX_IMAGE_SIZE_MB = 10; // 10MB
        if (fileSizeMB > MAX_IMAGE_SIZE_MB) {
          throw new Error(
            `Imagen demasiado grande: ${fileSizeMB.toFixed(1)}MB. Máximo permitido: ${MAX_IMAGE_SIZE_MB}MB`
          );
        }
        console.log(`[Upload] ✅ Image validated: ${fileSizeMB.toFixed(1)}MB (${input.fileName})`);
      } else {
        // Generic file limit: 50MB
        const MAX_FILE_SIZE_MB = 50;
        if (fileSizeMB > MAX_FILE_SIZE_MB) {
          throw new Error(
            `Archivo demasiado grande: ${fileSizeMB.toFixed(1)}MB. Máximo permitido: ${MAX_FILE_SIZE_MB}MB`
          );
        }
        console.log(`[Upload] ✅ File validated: ${fileSizeMB.toFixed(1)}MB (${input.fileName})`);
      }

      // Sanitize filename
      const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileKey = `${input.folder}/${Date.now()}-${randomSuffix()}-${safeName}`;

      // Detect mime type from data URL if not specified
      let mimeType = input.mimeType;
      if (input.fileBase64.startsWith("data:")) {
        const match = input.fileBase64.match(/^data:([^;]+);/);
        if (match) mimeType = match[1];
      }

      console.log(`[Upload] 📤 Uploading to S3: ${fileKey} (${fileSizeMB.toFixed(1)}MB, ${mimeType})`);
      const uploadStartTime = Date.now();

      const { url } = await storagePut(fileKey, buffer, mimeType);

      const uploadTime = ((Date.now() - uploadStartTime) / 1000).toFixed(2);
      console.log(`[Upload] ✅ Upload complete: ${uploadTime}s (${(fileSizeMB / parseFloat(uploadTime)).toFixed(2)}MB/s)`);

      return { success: true, url, fileKey };
    }),

  // Legacy procedures kept for backward compatibility
  uploadCourseVideo: protectedProcedure
    .input(
      z.object({
        courseId: z.number(),
        videoBase64: z.string(),
        fileName: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "instructor") {
        throw new Error("Only admins and instructors can upload videos");
      }
      let base64Data = input.videoBase64;
      if (base64Data.includes(",")) base64Data = base64Data.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileKey = `courses/${input.courseId}/videos/${Date.now()}-${randomSuffix()}-${safeName}`;
      const { url } = await storagePut(fileKey, buffer, "video/mp4");
      return { success: true, url, fileKey };
    }),

  uploadEventImage: protectedProcedure
    .input(
      z.object({
        eventId: z.number(),
        imageBase64: z.string(),
        fileName: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Only admins can upload images");
      }
      let base64Data = input.imageBase64;
      if (base64Data.includes(",")) base64Data = base64Data.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileKey = `events/${input.eventId}/images/${Date.now()}-${randomSuffix()}-${safeName}`;
      const { url } = await storagePut(fileKey, buffer, "image/jpeg");
      return { success: true, url, fileKey };
    }),

  uploadInstructorPhoto: protectedProcedure
    .input(
      z.object({
        instructorId: z.number(),
        photoBase64: z.string(),
        fileName: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Only admins can upload photos");
      }
      let base64Data = input.photoBase64;
      if (base64Data.includes(",")) base64Data = base64Data.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileKey = `instructors/${input.instructorId}/photos/${Date.now()}-${randomSuffix()}-${safeName}`;
      const { url } = await storagePut(fileKey, buffer, "image/jpeg");
      return { success: true, url, fileKey };
    }),
});
