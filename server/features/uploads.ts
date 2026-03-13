import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { bunnyUploadVideo, bunnyGetVideoInfo, bunnyGenerateSignedUrl, getBunnyLibraryId } from "../bunny";

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
});
