import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useLessonsManager } from "@/hooks/useLessonsManager";
import { Loader2, Plus, Video, Upload, X, Trash2, Eye, Lock, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface LessonsManagerProps {
  courses: any[];
  isLoadingCourses: boolean;
}

export default function LessonsManager({ courses, isLoadingCourses }: LessonsManagerProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const {
    formData,
    setFormData,
    uploading,
    handleVideoUpload,
    handleCreateLesson,
    resetForm,
    isCreating,
  } = useLessonsManager(selectedCourseId);

  // Query lessons for selected course
  const { data: lessons, isLoading: isLoadingLessons } = trpc.lessons.getByCourseId.useQuery(
    selectedCourseId!,
    {
      enabled: !!selectedCourseId,
    }
  );

  const handleCourseSelect = (courseId: string) => {
    const id = parseInt(courseId);
    setSelectedCourseId(id);
    setFormData((prev) => ({ ...prev, courseId: id }));
    resetForm();
  };

  const selectedCourse = courses?.find((c) => c.id === selectedCourseId);

  return (
    <div className="space-y-6">
      {/* Course Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Lecciones</CardTitle>
          <CardDescription>Sube videos y crea lecciones para tus cursos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground/70 mb-2 block">
                Selecciona un curso
              </label>
              <Select
                value={selectedCourseId?.toString() || ""}
                onValueChange={handleCourseSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Elige un curso..." />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingCourses ? (
                    <div className="p-4 text-center">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : courses?.length === 0 ? (
                    <div className="p-4 text-center text-sm text-foreground/60">
                      No hay cursos disponibles
                    </div>
                  ) : (
                    courses?.map((course) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedCourse && (
              <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  {selectedCourse.imageUrl && (
                    <img
                      src={selectedCourse.imageUrl}
                      alt={selectedCourse.title}
                      className="w-20 h-20 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{selectedCourse.title}</h3>
                    <p className="text-sm text-foreground/60 mt-1">
                      {selectedCourse.description || "Sin descripción"}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{selectedCourse.level || "all-levels"}</Badge>
                      <Badge variant="outline">{selectedCourse.danceStyle || "Salsa"}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Lesson Form */}
      {selectedCourseId && (
        <Card>
          <CardHeader>
            <CardTitle>Crear Nueva Lección</CardTitle>
            <CardDescription>
              Sube un video y agrega la información de la lección
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Título de la lección *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Posición (orden)"
                value={formData.position}
                onChange={(e) =>
                  setFormData({ ...formData, position: parseInt(e.target.value) || 1 })
                }
                min={1}
              />
            </div>

            <Textarea
              placeholder="Descripción de la lección (opcional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="number"
                placeholder="Duración en segundos (opcional)"
                value={formData.durationSeconds || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    durationSeconds: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPreview"
                  checked={formData.isPreview}
                  onChange={(e) => setFormData({ ...formData, isPreview: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isPreview" className="text-sm text-foreground/70">
                  Lección de vista previa (gratuita)
                </label>
              </div>
            </div>

            {/* Video Upload */}
            <div className="border-2 border-dashed border-accent/30 rounded-lg p-6">
              <p className="text-sm font-medium text-foreground/70 mb-3">Video de la lección *</p>
              {formData.bunnyVideoId ? (
                <div className="space-y-3">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-green-600">Video subido exitosamente</p>
                        <p className="text-sm text-foreground/60 mt-1">
                          Video ID: {formData.bunnyVideoId.substring(0, 30)}...
                        </p>
                        {formData.videoFile && (
                          <p className="text-sm text-foreground/60">
                            Archivo: {formData.videoFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => videoInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Cambiar Video
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          bunnyVideoId: "",
                          bunnyLibraryId: "",
                          videoFile: null,
                        })
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Video className="h-12 w-12 mx-auto mb-3 text-accent/40" />
                  <p className="text-foreground/60 mb-4">
                    Sube un video (máx. 2GB) para esta lección
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Seleccionar Video
                      </>
                    )}
                  </Button>
                </div>
              )}
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleVideoUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreateLesson}
                disabled={isCreating || uploading || !formData.bunnyVideoId}
                className="btn-vibrant flex-1"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Lección
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lessons List */}
      {selectedCourseId && (
        <Card>
          <CardHeader>
            <CardTitle>Lecciones del Curso</CardTitle>
            <CardDescription>
              {lessons?.length || 0} lección(es) creada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingLessons ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
              </div>
            ) : lessons && lessons.length > 0 ? (
              <div className="space-y-3">
                {lessons.map((lesson: any) => (
                  <div
                    key={lesson.id}
                    className="border border-border/50 rounded-lg p-4 hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center text-sm font-semibold text-accent">
                        {lesson.position}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-foreground">{lesson.title}</h4>
                          {lesson.isPreview ? (
                            <Badge variant="outline" className="text-green-500 border-green-500">
                              <Eye className="h-3 w-3 mr-1" />
                              Preview
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                              <Lock className="h-3 w-3 mr-1" />
                              Privado
                            </Badge>
                          )}
                        </div>
                        {lesson.description && (
                          <p className="text-sm text-foreground/60 mb-2">{lesson.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-foreground/50">
                          {lesson.durationSeconds && (
                            <span>⏱️ {Math.floor(lesson.durationSeconds / 60)} min</span>
                          )}
                          {lesson.bunnyVideoId && (
                            <span className="truncate">
                              🎬 {lesson.bunnyVideoId.substring(0, 20)}...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-foreground/60">
                <Video className="h-12 w-12 mx-auto mb-3 text-accent/30" />
                <p>No hay lecciones creadas aún</p>
                <p className="text-sm mt-1">Crea tu primera lección usando el formulario de arriba</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
