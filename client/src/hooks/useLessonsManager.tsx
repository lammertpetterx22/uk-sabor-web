import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

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

  // const updateLessonMutation = trpc.lessons.update.useMutation({
  //   onSuccess: () => {
  //     toast.success("✅ Lección actualizada exitosamente");
  //     utils.lessons.getByCourseId.invalidate();
  //     resetForm();
  //   },
  //   onError: (err: any) => {
  //     toast.error(`Error al actualizar lección: ${err.message}`);
  //   },
  // });

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
      toast.error("Please select a valid video file");
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

      // Upload video
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

      toast.success("Video cargado exitosamente", {
        description: "Ahora puedes completar la información de la lección",
        duration: 3000,
      });
    } catch (err: any) {
      toast.error("Error al procesar el video", {
        description: "Please verify the file and try again",
        duration: 5000,
      });
      logger.error('[Video Upload] Error', err);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleCreateLesson = async () => {
    if (!formData.courseId) {
      toast.error("Please select a course first");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("El título de la lección es requerido");
      return;
    }

    // Video is required only when creating, not when editing
    if (!editingLessonId && (!formData.bunnyVideoId || !formData.bunnyLibraryId)) {
      toast.error("Please upload a video before creating the lesson");
      return;
    }

    if (editingLessonId) {
      // Update existing lesson
      // await updateLessonMutation.mutateAsync({
      //   id: editingLessonId,
      //   title: formData.title,
      //   description: formData.description,
      //   position: formData.position,
      //   durationSeconds: formData.durationSeconds,
      //   isPreview: formData.isPreview,
      //   // Only update video if a new one was uploaded
      //   ...(formData.videoFile && {
      //     bunnyVideoId: formData.bunnyVideoId,
      //     bunnyLibraryId: formData.bunnyLibraryId,
      //   }),
      // });
      toast.error("Updating lessons is not implemented yet");
    } else {
      // Create new lesson
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
    }
  };

  const loadLessonForEdit = (lesson: any) => {
    setEditingLessonId(lesson.id);
    setFormData({
      courseId: lesson.courseId,
      title: lesson.title || "",
      description: lesson.description || "",
      bunnyVideoId: lesson.bunnyVideoId || "",
      bunnyLibraryId: lesson.bunnyLibraryId || "",
      position: lesson.position || 1,
      durationSeconds: lesson.durationSeconds,
      isPreview: lesson.isPreview || false,
      videoFile: null, // Don't load existing video file
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
    loadLessonForEdit,
    resetForm,
    isCreating: createLessonMutation.isPending,
  };
}
