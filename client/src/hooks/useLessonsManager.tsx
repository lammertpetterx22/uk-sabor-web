import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface LessonFormData {
  courseId: number;
  title: string;
  description: string;
  bunnyVideoId: string;
  bunnyLibraryId: string;
  position: number;
  durationSeconds?: number;
  isPreview: boolean;
  videoFile?: File | null;
}

export function useLessonsManager(courseId: number | null) {
  const [formData, setFormData] = useState<LessonFormData>({
    courseId: courseId || 0,
    title: "",
    description: "",
    bunnyVideoId: "",
    bunnyLibraryId: "",
    position: 1,
    durationSeconds: undefined,
    isPreview: false,
    videoFile: null,
  });

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  // Mutations
  const uploadVideoMutation = trpc.uploads.uploadVideoToBunny.useMutation();
  const createLessonMutation = trpc.lessons.create.useMutation({
    onSuccess: () => {
      toast.success("✅ Lección creada exitosamente");
      utils.lessons.getByCourseId.invalidate();
      resetForm();
    },
    onError: (err) => {
      toast.error(`Error al crear lección: ${err.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      courseId: courseId || 0,
      title: "",
      description: "",
      bunnyVideoId: "",
      bunnyLibraryId: "",
      position: 1,
      durationSeconds: undefined,
      isPreview: false,
      videoFile: null,
    });
    setEditingLessonId(null);
    setUploadProgress(0);
  };

  const handleVideoUpload = async (file: File) => {
    if (!file.type.startsWith("video/")) {
      toast.error("Por favor selecciona un archivo de video válido");
      return;
    }

    const fileSizeMB = file.size / 1024 / 1024;
    const MAX_VIDEO_SIZE_MB = 2048; // 2GB

    if (fileSizeMB > MAX_VIDEO_SIZE_MB) {
      toast.error(
        `Video demasiado grande: ${fileSizeMB.toFixed(1)}MB. Máximo: ${MAX_VIDEO_SIZE_MB}MB`
      );
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);

      // Read file as base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setUploadProgress(10);
      const base64 = await base64Promise;

      setUploadProgress(30);

      // Upload to Bunny.net
      const result = await uploadVideoMutation.mutateAsync({
        videoBase64: base64,
        fileName: file.name,
        title: formData.title || file.name.replace(/\.[^/.]+$/, ""),
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Update form with video IDs
      setFormData((prev) => ({
        ...prev,
        bunnyVideoId: result.bunnyVideoId,
        bunnyLibraryId: result.bunnyLibraryId,
        videoFile: file,
      }));

      // Clean success message without technical details
      toast.success("✅ Video subido exitosamente", {
        description: "Ahora puedes crear la lección",
        duration: 3000,
      });
    } catch (err: any) {
      toast.error("Error al subir el video", {
        description: "Por favor, intenta de nuevo",
        duration: 5000,
      });
      console.error("[Video Upload] Error:", err);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleCreateLesson = async () => {
    if (!formData.courseId) {
      toast.error("Por favor selecciona un curso primero");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("El título de la lección es requerido");
      return;
    }

    if (!formData.bunnyVideoId || !formData.bunnyLibraryId) {
      toast.error("Por favor sube un video antes de crear la lección");
      return;
    }

    await createLessonMutation.mutateAsync({
      courseId: formData.courseId,
      title: formData.title,
      description: formData.description,
      bunnyVideoId: formData.bunnyVideoId,
      bunnyLibraryId: formData.bunnyLibraryId,
      position: formData.position,
      durationSeconds: formData.durationSeconds,
      isPreview: formData.isPreview,
    });
  };

  return {
    formData,
    setFormData,
    uploading,
    uploadProgress,
    editingLessonId,
    setEditingLessonId,
    handleVideoUpload,
    handleCreateLesson,
    resetForm,
    isCreating: createLessonMutation.isPending,
  };
}
