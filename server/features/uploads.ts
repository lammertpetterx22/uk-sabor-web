import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { storagePut } from "../storage";

function randomSuffix() {
  return Math.random().toString(36).substring(2, 10);
}

export const uploadsRouter = router({
  /**
   * Generic file upload - uploads base64 data to S3 and returns CDN URL.
   * Use this BEFORE creating/updating records so you have the URL ready.
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

      // Sanitize filename
      const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileKey = `${input.folder}/${Date.now()}-${randomSuffix()}-${safeName}`;

      // Detect mime type from data URL if not specified
      let mimeType = input.mimeType;
      if (input.fileBase64.startsWith("data:")) {
        const match = input.fileBase64.match(/^data:([^;]+);/);
        if (match) mimeType = match[1];
      }

      const { url } = await storagePut(fileKey, buffer, mimeType);

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
