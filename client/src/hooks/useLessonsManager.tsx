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
        `Video demasiado grande: ${fileSizeMB.toFixed(1)}MB. Máximo permitido: ${MAX_VIDEO_SIZE_MB}MB (2GB)`
      );
      return;
    }

    setUploading(true);
    toast.info(`📹 Preparando video: ${file.name} (${fileSizeMB.toFixed(1)}MB)`, {
      duration: 3000,
    });

    try {
      const uploadStartTime = Date.now();

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

      const base64 = await base64Promise;

      toast.info("☁️ Subiendo a Bunny.net...", { duration: 3000 });

      // Upload to Bunny.net
      const result = await uploadVideoMutation.mutateAsync({
        videoBase64: base64,
        fileName: file.name,
        title: formData.title || file.name.replace(/\.[^/.]+$/, ""),
      });

      const totalTime = ((Date.now() - uploadStartTime) / 1000).toFixed(1);
      const uploadSpeed = (fileSizeMB / parseFloat(totalTime)).toFixed(2);

      // Update form with video IDs
      setFormData((prev) => ({
        ...prev,
        bunnyVideoId: result.bunnyVideoId,
        bunnyLibraryId: result.bunnyLibraryId,
        videoFile: file,
      }));

      toast.success(
        `✅ ¡Video subido exitosamente a Bunny.net!\n\n` +
          `📁 ${file.name}\n` +
          `📦 ${fileSizeMB.toFixed(1)}MB\n` +
          `⏱️ ${totalTime}s (${uploadSpeed}MB/s)\n` +
          `🎬 Video ID: ${result.bunnyVideoId.substring(0, 20)}...\n\n` +
          `⚠️ El video se está procesando en Bunny.net`,
        { duration: 10000 }
      );

      console.log(`[Video Upload] ✅ SUCCESS - Bunny Video ID: ${result.bunnyVideoId}`);
    } catch (err: any) {
      console.error("[Video Upload] ❌ Upload failed:", err);
      toast.error(`Error al subir video: ${err.message}`);
    } finally {
      setUploading(false);
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
    editingLessonId,
    setEditingLessonId,
    handleVideoUpload,
    handleCreateLesson,
    resetForm,
    isCreating: createLessonMutation.isPending,
  };
}
