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

export function useBunnyTusUpload(): UseBunnyTusUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadVideo = useCallback(async (file: File, title: string): Promise<UploadResult | null> => {
    const MAX_SIZE_GB = 10;
    if (file.size > MAX_SIZE_GB * 1024 * 1024 * 1024) {
      toast.error(`Video too large (max ${MAX_SIZE_GB}GB). Your file: ${(file.size / 1024 / 1024 / 1024).toFixed(2)}GB`);
      return null;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Use XMLHttpRequest so we can track upload progress
      const result = await new Promise<UploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve({ bunnyVideoId: data.bunnyVideoId, bunnyLibraryId: data.bunnyLibraryId });
            } catch {
              reject(new Error("Invalid server response"));
            }
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              reject(new Error(err.error || `Upload failed (${xhr.status})`));
            } catch {
              reject(new Error(`Upload failed (${xhr.status})`));
            }
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
        xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

        xhr.open("POST", "/api/upload-video-stream");
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
        xhr.setRequestHeader("X-Video-Title", title);
        xhr.setRequestHeader("X-Video-Filename", file.name);
        xhr.withCredentials = true; // Send session cookie
        xhr.send(file);
      });

      setUploadProgress(100);
      return result;
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
