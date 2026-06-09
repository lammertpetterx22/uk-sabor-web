import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { useBunnyTusUpload } from "@/hooks/useBunnyTusUpload";

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

  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const { uploadVideo: uploadVideoTUS, uploading, uploadProgress } = useBunnyTusUpload();

  const createLessonMutation = trpc.lessons.create.useMutation({
    onSuccess: () => {
      toast.success("✅ Lesson creada successfully");
      utils.lessons.getByCourseId.invalidate();
      resetForm();
    },
    onError: (err) => {
      toast.error(`Error al crear lesson: ${err.message}`);
    },
  });

  // const updateLessonMutation = trpc.lessons.update.useMutation({
  //   onSuccess: () => {
  //     toast.success("✅ Lesson actualizada successfully");
  //     utils.lessons.getByCourseId.invalidate();
  //     resetForm();
  //   },
  //   onError: (err: any) => {
  //     toast.error(`Error al actualizar lesson: ${err.message}`);
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
  };

  const handleVideoUpload = async (file: File) => {
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a valid video file");
      return;
    }

    // Show file name immediately — don't wait for upload to finish
    setFormData((prev) => ({ ...prev, videoFile: file }));

    const title = formData.title || file.name.replace(/\.[^/.]+$/, "");
    const result = await uploadVideoTUS(file, title);

    if (result) {
      setFormData((prev) => ({
        ...prev,
        bunnyVideoId: result.bunnyVideoId,
        bunnyLibraryId: result.bunnyLibraryId,
      }));
      toast.success("Video uploaded successfully", { duration: 3000 });
    } else {
      setFormData((prev) => ({ ...prev, videoFile: null }));
    }
  };

  const handleCreateLesson = async () => {
    if (!formData.courseId) {
      toast.error("Please select a course first");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("El título de la lesson es requerido");
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
