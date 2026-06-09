import { useState, useCallback } from "react";
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

const CHUNK_SIZE = 20 * 1024 * 1024; // 20MB per chunk — safe below Koyeb's proxy limit

export function useBunnyTusUpload(): UseBunnyTusUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadVideo = useCallback(async (file: File, title: string): Promise<UploadResult | null> => {
    if (file.size > 10 * 1024 * 1024 * 1024) {
      toast.error(`Video too large (max 10GB). Your file: ${(file.size / 1024 / 1024 / 1024).toFixed(2)}GB`);
      return null;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // 1. Init: create Bunny video + TUS session on the server
      const initRes = await fetch("/api/upload-video-init", {
        method: "POST",
        headers: {
          "X-Video-Title": encodeURIComponent(title),
          "X-Video-Filename": encodeURIComponent(file.name),
          "X-Video-Size": String(file.size),
          "X-Video-Type": file.type || "video/mp4",
        },
        credentials: "include",
      });

      if (!initRes.ok) {
        const err = await initRes.json().catch(() => ({})) as any;
        throw new Error(err.error || `Upload init failed (${initRes.status})`);
      }

      const { videoId, libraryId } = await initRes.json();

      // 2. Upload file in 10MB chunks, tracking progress manually
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);
        const buffer = await chunk.arrayBuffer();

        // Retry each chunk up to 3 times
        let lastErr: Error | null = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const chunkRes = await fetch("/api/upload-video-chunk", {
              method: "POST",
              headers: {
                "Content-Type": "application/octet-stream",
                "X-Video-Id": videoId,
                "X-Chunk-Offset": String(start),
              },
              body: buffer,
              credentials: "include",
            });

            if (!chunkRes.ok) {
              const err = await chunkRes.json().catch(() => ({})) as any;
              throw new Error(err.error || `Chunk failed (${chunkRes.status})`);
            }

            lastErr = null;
            break;
          } catch (err: any) {
            lastErr = err;
            if (attempt < 2) await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          }
        }

        if (lastErr) throw lastErr;

        // Progress = bytes sent so far / total
        setUploadProgress(Math.round((end / file.size) * 100));
      }

      setUploadProgress(100);
      return { bunnyVideoId: videoId, bunnyLibraryId: libraryId };
    } catch (err: any) {
      toast.error(`Upload error: ${err.message || "Unknown error"}`);
      return null;
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  }, []);

  return { uploadVideo, uploading, uploadProgress };
}
