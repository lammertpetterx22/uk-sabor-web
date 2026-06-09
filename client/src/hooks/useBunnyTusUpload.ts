import { useState, useCallback } from "react";
import * as tus from "tus-js-client";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface UploadResult {
  bunnyVideoId: string;
  bunnyLibraryId: string;
}

interface UseBunnyTusUploadReturn {
  uploadVideo: (file: File, title: string) => Promise<UploadResult | null>;
  uploading: boolean;
  uploadProgress: number;
}

export function useBunnyTusUpload(): UseBunnyTusUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const getCredentials = trpc.uploads.getVideoUploadCredentials.useMutation();

  const uploadVideo = useCallback(
    async (file: File, title: string): Promise<UploadResult | null> => {
      const MAX_SIZE_GB = 10;
      if (file.size > MAX_SIZE_GB * 1024 * 1024 * 1024) {
        toast.error(`Video too large (max ${MAX_SIZE_GB}GB). Your file: ${(file.size / 1024 / 1024 / 1024).toFixed(2)}GB`);
        return null;
      }

      setUploading(true);
      setUploadProgress(0);

      try {
        const creds = await getCredentials.mutateAsync({ title, fileName: file.name });

        return await new Promise<UploadResult | null>((resolve, reject) => {
          const upload = new tus.Upload(file, {
            endpoint: creds.tusEndpoint,
            retryDelays: [0, 3000, 5000, 10000, 20000],
            chunkSize: 50 * 1024 * 1024, // 50 MB chunks
            headers: {
              AuthorizationSignature: creds.authSignature,
              AuthorizationExpire: String(creds.authExpiration),
              VideoId: creds.videoId,
              LibraryId: creds.libraryId,
            },
            metadata: {
              filetype: file.type || "video/mp4",
              title: title,
            },
            onError(err) {
              console.error("[TUS Upload] Error:", err);
              toast.error(`Upload failed: ${err.message}`);
              setUploading(false);
              setUploadProgress(0);
              reject(err);
            },
            onProgress(bytesUploaded, bytesTotal) {
              const pct = Math.round((bytesUploaded / bytesTotal) * 100);
              setUploadProgress(pct);
            },
            onSuccess() {
              setUploadProgress(100);
              setUploading(false);
              resolve({ bunnyVideoId: creds.videoId, bunnyLibraryId: creds.libraryId });
            },
          });

          upload.start();
        });
      } catch (err: any) {
        toast.error(`Upload error: ${err.message || "Unknown error"}`);
        setUploading(false);
        setUploadProgress(0);
        return null;
      }
    },
    [getCredentials]
  );

  return { uploadVideo, uploading, uploadProgress };
}
