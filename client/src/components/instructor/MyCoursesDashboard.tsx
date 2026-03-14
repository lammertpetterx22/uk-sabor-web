import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useLessonsManager } from "@/hooks/useLessonsManager";
import {
  GraduationCap,
  Plus,
  Video,
  Edit2,
  Trash2,
  Loader2,
  Upload,
  X,
  Eye,
  Lock,
  PlayCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowLeft,
  Settings,
  List
} from "lucide-react";
import { toast } from "sonner";
import { ProfessionalUploadProgress } from "@/../components/video/ProfessionalUploadProgress";
import CourseFormCard from "@/components/admin/CourseFormCard";

interface MyCoursesDashboardProps {
  courses: any[];
  isLoadingCourses: boolean;
  onRefresh: () => void;
  isAdmin?: boolean;
  instructors?: any[];
  myInstructorProfile?: any;
}

export default function MyCoursesDashboard({
  courses,
  isLoadingCourses,
  onRefresh,
  isAdmin = false,
  instructors = [],
  myInstructorProfile
}: MyCoursesDashboardProps) {
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [showLessonDialog, setShowLessonDialog] = useState(false);
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [confirmDeleteCourseId, setConfirmDeleteCourseId] = useState<number | null>(null);

  const videoInputRef = useState<HTMLInputElement | null>(null)[1];

  const {
    formData,
    setFormData,
    uploading,
    uploadProgress,
    handleVideoUpload,
    handleCreateLesson,
    resetForm,
    isCreating,
  } = useLessonsManager(selectedCourse?.id || null);

  // Query lessons for selected course
  const { data: lessons, isLoading: isLoadingLessons } = trpc.lessons.getByCourseId.useQuery(
    selectedCourse?.id!,
    {
      enabled: !!selectedCourse?.id,
    }
  );

  // Course mutations
  const deleteCurseMutation = trpc.courses.delete.useMutation({
    onSuccess: () => {
      toast.success("Curso eliminado exitosamente");
      setConfirmDeleteCourseId(null);
      if (selectedCourse?.id === confirmDeleteCourseId) {
        setSelectedCourse(null);
      }
      onRefresh();
    },
    onError: (err) => {
      toast.error(`Error al eliminar: ${err.message}`);
    },
  });

  // Lesson mutations
  const deleteLessonMutation = trpc.lessons.delete.useMutation({
    onSuccess: () => {
      toast.success("Lección eliminada");
      onRefresh();
    },
    onError: (err) => {
      toast.error(`Error: ${err.message}`);
    },
  });

  const handleSelectCourse = (course: any) => {
    setSelectedCourse(course);
    resetForm();
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
    resetForm();
    setShowLessonDialog(false);
  };

  const handleOpenLessonDialog = () => {
    resetForm();
    setEditingLesson(null);
    setShowLessonDialog(true);
  };

  const handleSaveLesson = async () => {
    await handleCreateLesson();
    setShowLessonDialog(false);
    onRefresh();
  };

  const handleDeleteLesson = (lessonId: number) => {
    if (confirm("¿Estás seguro de eliminar esta lección?")) {
      deleteLessonMutation.mutate(lessonId);
    }
  };

  const handleDeleteCourse = (courseId: number) => {
    setConfirmDeleteCourseId(courseId);
  };

  const confirmDeleteCourse = () => {
    if (confirmDeleteCourseId) {
      deleteCurseMutation.mutate(confirmDeleteCourseId);
    }
  };

  const handleOpenCourseDialog = () => {
    setEditingCourse(null);
    setShowCourseDialog(true);
  };

  const handleEditCourse = (course: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCourse(course);
    setShowCourseDialog(true);
  };

  // Main view: Show all courses
  if (!selectedCourse) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <Card className="border-border/50 bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                  <GraduationCap className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <CardTitle className="text-2xl gradient-text">Mis Cursos</CardTitle>
                  <CardDescription>
                    Gestiona tus cursos y sus lecciones
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={handleOpenCourseDialog}
                className="btn-vibrant"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Curso
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Courses Grid */}
        {isLoadingCourses ? (
          <div className="flex justify-center py-16">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-accent mx-auto mb-4" />
              <p className="text-foreground/60">Cargando cursos...</p>
            </div>
          </div>
        ) : courses && courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-accent/50 transition-all cursor-pointer group overflow-hidden"
                onClick={() => handleSelectCourse(course)}
              >
                {/* Course Image */}
                {course.imageUrl && (
                  <div className="relative h-48 w-full overflow-hidden">
                    <img
                      src={course.imageUrl}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <Badge className="bg-black/50 backdrop-blur-sm border-0 text-white">
                        {course.status === "published" ? "Publicado" : "Borrador"}
                      </Badge>
                    </div>
                  </div>
                )}

                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg text-foreground line-clamp-2 group-hover:text-accent transition-colors">
                      {course.title}
                    </h3>
                    {course.description && (
                      <p className="text-sm text-foreground/60 mt-1 line-clamp-2">
                        {course.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {course.danceStyle && (
                      <Badge variant="outline" className="text-xs">
                        {course.danceStyle}
                      </Badge>
                    )}
                    {course.level && (
                      <Badge variant="outline" className="text-xs">
                        {course.level}
                      </Badge>
                    )}
                  </div>

                  <Separator className="bg-border/50" />

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-foreground/60">
                      <Video className="h-4 w-4" />
                      <span>{course._count?.lessons || 0} lecciones</span>
                    </div>
                    <div className="font-semibold text-accent">
                      £{course.price}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1 btn-vibrant" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Gestionar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleEditCourse(course, e)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    {confirmDeleteCourseId === course.id ? (
                      <div className="flex gap-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDeleteCourse();
                          }}
                          disabled={deleteCurseMutation.isPending}
                        >
                          {deleteCurseMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Sí"
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteCourseId(null);
                          }}
                        >
                          No
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCourse(course.id);
                        }}
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-border/50">
            <CardContent className="py-16">
              <div className="text-center">
                <GraduationCap className="h-16 w-16 mx-auto mb-4 text-foreground/20" />
                <h3 className="text-lg font-semibold text-foreground/80 mb-2">
                  No tienes cursos aún
                </h3>
                <p className="text-foreground/60 text-sm mb-4">
                  Crea tu primer curso para comenzar
                </p>
                <Button onClick={handleOpenCourseDialog} className="btn-vibrant">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Mi Primer Curso
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Course Dialog */}
        <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <CourseFormCard
              editingCourse={editingCourse}
              instructors={instructors}
              myInstructorProfile={myInstructorProfile}
              isAdmin={isAdmin}
              onSuccess={() => {
                setShowCourseDialog(false);
                setEditingCourse(null);
                onRefresh();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Detail view: Show selected course with lessons
  return (
    <div className="space-y-6">
      {/* Course Header */}
      <Card className="border-border/50 bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToCourses}
              className="mt-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                  <GraduationCap className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <CardTitle className="text-2xl gradient-text">
                    {selectedCourse.title}
                  </CardTitle>
                  <CardDescription>
                    Gestiona las lecciones de este curso
                  </CardDescription>
                </div>
              </div>

              {selectedCourse.imageUrl && (
                <img
                  src={selectedCourse.imageUrl}
                  alt={selectedCourse.title}
                  className="w-full h-32 object-cover rounded-lg mt-4"
                />
              )}

              {selectedCourse.description && (
                <p className="text-foreground/70 mt-4">
                  {selectedCourse.description}
                </p>
              )}

              <div className="flex items-center gap-3 mt-4">
                <Badge variant="outline">{selectedCourse.level}</Badge>
                <Badge variant="outline">{selectedCourse.danceStyle}</Badge>
                <Badge className="bg-accent/20 text-accent border-accent/30">
                  £{selectedCourse.price}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Lessons Management */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5 text-accent" />
                Lecciones del Curso
              </CardTitle>
              <CardDescription>
                {lessons?.length || 0} lección(es) creada(s)
              </CardDescription>
            </div>
            <Button
              onClick={handleOpenLessonDialog}
              className="btn-vibrant"
            >
              <Plus className="h-4 w-4 mr-2" />
              Añadir Lección
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoadingLessons ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : lessons && lessons.length > 0 ? (
            <div className="space-y-3">
              {lessons.map((lesson: any, index: number) => (
                <div
                  key={lesson.id}
                  className="border-2 border-border/50 rounded-xl p-4 bg-gradient-to-br from-background/50 to-background/30 hover:border-accent/30 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    {/* Lesson Number */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 flex items-center justify-center">
                        <span className="text-lg font-bold text-accent">
                          {lesson.position || index + 1}
                        </span>
                      </div>
                    </div>

                    {/* Lesson Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-foreground text-lg">
                          {lesson.title}
                        </h4>
                        {lesson.isPreview ? (
                          <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
                            <Lock className="h-3 w-3 mr-1" />
                            Privado
                          </Badge>
                        )}
                      </div>

                      {lesson.description && (
                        <p className="text-sm text-foreground/60 mb-3">
                          {lesson.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-foreground/50">
                        {lesson.durationSeconds && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{Math.floor(lesson.durationSeconds / 60)} min</span>
                          </div>
                        )}
                        {lesson.bunnyVideoId && (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            <span className="text-green-500">Video disponible</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // TODO: Implement edit
                          toast.info("Edición próximamente");
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteLesson(lesson.id)}
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 mb-4 border border-accent/20">
                <Video className="h-10 w-10 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground/80 mb-2">
                No hay lecciones aún
              </h3>
              <p className="text-sm text-foreground/60 mb-4">
                Comienza añadiendo tu primera lección a este curso
              </p>
              <Button
                onClick={handleOpenLessonDialog}
                className="btn-vibrant"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Lección
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Lesson Dialog */}
      <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-accent" />
              {editingLesson ? "Editar Lección" : "Nueva Lección"}
            </DialogTitle>
            <DialogDescription>
              Sube un video y completa la información de la lección
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Lesson Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lesson-title">Título de la Lección *</Label>
                  <Input
                    id="lesson-title"
                    placeholder="Ej: Introducción al paso básico"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lesson-position">Posición (orden)</Label>
                  <Input
                    id="lesson-position"
                    type="number"
                    placeholder="1"
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: parseInt(e.target.value) || 1 })
                    }
                    min={1}
                    className="bg-background/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lesson-description">Descripción</Label>
                <Textarea
                  id="lesson-description"
                  placeholder="Describe qué aprenderán en esta lección..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="bg-background/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lesson-duration">Duración (minutos)</Label>
                  <Input
                    id="lesson-duration"
                    type="number"
                    placeholder="10"
                    value={formData.durationSeconds ? Math.floor(formData.durationSeconds / 60) : ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        durationSeconds: e.target.value ? parseInt(e.target.value) * 60 : undefined,
                      })
                    }
                    min={1}
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="opacity-0">Checkbox</Label>
                  <div className="flex items-center gap-3 h-10 px-4 rounded-lg border border-border/50 bg-background/50">
                    <input
                      type="checkbox"
                      id="lesson-preview"
                      checked={formData.isPreview}
                      onChange={(e) => setFormData({ ...formData, isPreview: e.target.checked })}
                      className="w-4 h-4 rounded border-border/50"
                    />
                    <Label htmlFor="lesson-preview" className="cursor-pointer text-sm">
                      Lección gratuita (preview)
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Video Upload */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2 text-base">
                <Video className="h-5 w-5 text-accent" />
                Video de la Lección *
              </Label>

              <ProfessionalUploadProgress
                isUploading={uploading}
                progress={uploadProgress}
                uploadComplete={!!formData.bunnyVideoId}
                uploadType="video"
                fileName={formData.videoFile?.name}
              />

              {!uploading && !formData.bunnyVideoId && (
                <div className="relative border-2 border-dashed border-accent/30 rounded-xl p-10 bg-gradient-to-br from-accent/5 to-transparent hover:border-accent/50 transition-all duration-300">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 mb-4 border border-accent/20">
                      <Upload className="h-10 w-10 text-accent" />
                    </div>
                    <p className="font-semibold text-foreground mb-2">
                      Sube el video de la lección
                    </p>
                    <p className="text-sm text-foreground/60 mb-6">
                      Formatos aceptados: MP4, MOV, AVI, WebM (máx. 2GB)
                    </p>
                    <input
                      ref={(ref) => videoInputRef(ref)}
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleVideoUpload(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                      id="video-upload-input"
                    />
                    <Button
                      type="button"
                      onClick={() => document.getElementById("video-upload-input")?.click()}
                      className="bg-gradient-to-r from-[#FA3698] to-purple-600 hover:from-[#FA3698]/90 hover:to-purple-600/90 text-white border-0 shadow-lg"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Seleccionar Video
                    </Button>
                  </div>
                </div>
              )}

              {!uploading && formData.bunnyVideoId && (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("video-upload-input")?.click()}
                    className="flex-1"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Cambiar Video
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        bunnyVideoId: "",
                        bunnyLibraryId: "",
                        videoFile: null,
                      })
                    }
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Dialog Footer */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowLessonDialog(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveLesson}
              disabled={isCreating || uploading || !formData.bunnyVideoId || !formData.title}
              className="btn-vibrant flex-1"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Guardar Lección
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
