import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  DollarSign,
  Video,
  Image as ImageIcon,
  Upload,
  Loader2,
  X,
  Sparkles,
  Music,
  Signal,
  Clock,
  BookOpen,
  User,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import ImageCropperModal from "@/components/ImageCropperModal";
import { ProfessionalUploadProgress } from "@/../components/video/ProfessionalUploadProgress";
import { useTranslations } from "@/hooks/useTranslations";
import DiscountCodesSection from "./DiscountCodesSection";

interface CourseFormCardProps {
  onSuccess?: () => void;
  editingCourse?: any;
  instructors?: any[];
  myInstructorProfile?: any;
  isAdmin?: boolean;
  checkCourseEntitlement?: () => Promise<any>;
  onUpgradeRequired?: (reason: string) => void;
}

export default function CourseFormCard({
  onSuccess,
  editingCourse,
  instructors,
  myInstructorProfile,
  isAdmin = false,
  checkCourseEntitlement,
  onUpgradeRequired
}: CourseFormCardProps) {
  const { t } = useTranslations();
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const uploadFileMutation = trpc.uploads.uploadFile.useMutation();
  const uploadVideoMutation = trpc.uploads.uploadVideoToBunny.useMutation();

  const createMutation = trpc.courses.create.useMutation({
    onSuccess: () => {
      toast.success(t("admin.courses.toastCreated"));
      resetForm();
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const updateMutation = trpc.courses.update.useMutation({
    onSuccess: () => {
      toast.success(t("admin.courses.toastUpdated"));
      resetForm();
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    danceStyle: "",
    level: "all-levels" as const,
    price: "",
    instructorId: "",
    duration: "",
    lessonsCount: "",
    videoFile: null as File | null,
    videoUrl: "",
    videoPreview: "",
    bunnyVideoId: undefined as string | undefined,
    bunnyLibraryId: undefined as string | undefined,
    imageUrl: "",
    imagePreview: "",
  });

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageUploading, setImageUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  // Auto-fill instructorId for instructor role users
  useEffect(() => {
    if (!isAdmin && myInstructorProfile && !editingCourse) {
      setFormData(prev => ({ ...prev, instructorId: myInstructorProfile.id.toString() }));
    }
  }, [myInstructorProfile, isAdmin, editingCourse]);

  // Populate form when editing
  useEffect(() => {
    if (editingCourse) {
      setFormData({
        title: editingCourse.title || "",
        description: editingCourse.description || "",
        danceStyle: editingCourse.danceStyle || "",
        level: editingCourse.level || "all-levels",
        price: editingCourse.price?.toString() || "",
        instructorId: editingCourse.instructorId?.toString() || "",
        duration: editingCourse.duration || "",
        lessonsCount: editingCourse.lessonsCount?.toString() || "",
        videoFile: null,
        videoUrl: editingCourse.videoUrl || "",
        videoPreview: editingCourse.videoUrl ? "existing" : "",
        bunnyVideoId: undefined,
        bunnyLibraryId: undefined,
        imageUrl: editingCourse.imageUrl || "",
        imagePreview: editingCourse.imageUrl || "",
      });
    }
  }, [editingCourse]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      danceStyle: "",
      level: "all-levels",
      price: "",
      instructorId: !isAdmin && myInstructorProfile ? myInstructorProfile.id.toString() : "",
      duration: "",
      lessonsCount: "",
      videoFile: null,
      videoPreview: "",
      bunnyVideoId: undefined,
      bunnyLibraryId: undefined,
      videoUrl: "",
      imageUrl: "",
      imagePreview: "",
    });
    setUploadProgress(0);
    if (videoInputRef.current) videoInputRef.current.value = "";
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(t("admin.events.errorInvalidImage"));
      return;
    }
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(t("admin.events.errorImageTooLarge", { size: (file.size / 1024 / 1024).toFixed(1) }));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setCropSrc(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedDataUrl: string) => {
    setCropSrc(null);
    setFormData(prev => ({ ...prev, imagePreview: croppedDataUrl, imageUrl: "" }));
    setImageUploading(true);
    try {
      // Generate unique filename: course-{id}-{timestamp}.jpg
      const timestamp = Date.now();
      const uniqueFileName = editingCourse?.id
        ? `course-${editingCourse.id}-${timestamp}.jpg`
        : `course-new-${timestamp}.jpg`;

      const result = await uploadFileMutation.mutateAsync({
        fileBase64: croppedDataUrl,
        fileName: uniqueFileName,
        mimeType: "image/jpeg",
        folder: "courses",
      });
      setFormData(prev => ({ ...prev, imageUrl: result.url }));
      toast.success('Portada subida con éxito');
    } catch (err: any) {
      toast.error('Error al subir: ' + err.message);
      setFormData(prev => ({ ...prev, imagePreview: "", imageUrl: "" }));
    } finally {
      setImageUploading(false);
    }
  };

  const handleVideoUpload = async (file: File) => {
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|mov|avi|webm|mkv|mpeg|flv|3gp|wmv)$/i)) {
      toast.error('Por favor selecciona un archivo de video válido');
      return;
    }

    const MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024;
    const fileSizeMB = file.size / 1024 / 1024;

    if (file.size > MAX_VIDEO_SIZE) {
      toast.error(`El video es demasiado grande (máx. 2GB). Tu archivo: ${fileSizeMB.toFixed(1)}MB`);
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      const reader = new FileReader();

      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentLoaded = Math.round((e.loaded / e.total) * 100 * 0.3);
          setUploadProgress(percentLoaded);
        }
      };

      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        setUploadProgress(40);
        setFormData(prev => ({ ...prev, videoFile: file, videoPreview: file.name }));

        try {
          setUploadProgress(50);
          const result = await uploadVideoMutation.mutateAsync({
            videoBase64: base64,
            fileName: file.name,
            title: formData.title || file.name.replace(/\.[^/.]+$/, ""),
          });

          setUploadProgress(100);
          setFormData(prev => ({
            ...prev,
            bunnyVideoId: result.bunnyVideoId,
            bunnyLibraryId: result.bunnyLibraryId,
            videoUrl: "",
          }));

          toast.success(`¡Video subido exitosamente! (${fileSizeMB.toFixed(1)}MB)`);
        } catch (uploadErr: any) {
          toast.error(`Error al subir el video: ${uploadErr.message}`);
          setFormData(prev => ({ ...prev, videoFile: null, videoPreview: "", videoUrl: "", bunnyVideoId: undefined, bunnyLibraryId: undefined }));
          setUploadProgress(0);
        }
      };

      reader.onerror = () => {
        toast.error('Error al leer el archivo');
        setUploading(false);
        setUploadProgress(0);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Error inesperado al procesar el video');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.price || !formData.instructorId) {
      toast.error(t("validation.fillRequiredFields"));
      return;
    }

    if (!editingCourse && checkCourseEntitlement) {
      try {
        const result = await checkCourseEntitlement();
        const entitlement = result.data;
        if (entitlement && !entitlement.allowed) {
          onUpgradeRequired?.(entitlement.reason ?? t("admin.events.errorPlanLimit"));
          return;
        }
      } catch {
        // Fail open
      }
    }

    const payload = {
      title: formData.title,
      description: formData.description,
      danceStyle: formData.danceStyle,
      level: formData.level,
      price: formData.price,
      instructorId: parseInt(formData.instructorId),
      duration: formData.duration,
      lessonsCount: formData.lessonsCount ? parseInt(formData.lessonsCount) : undefined,
      videoUrl: formData.videoUrl || undefined,
      imageUrl: formData.imageUrl || undefined,
    };

    if (editingCourse) {
      updateMutation.mutate({ id: editingCourse.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Card className="border-border/50 bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-sm shadow-xl">
      <CardHeader className="space-y-3 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <GraduationCap className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <CardTitle className="text-2xl gradient-text">
              {editingCourse ? "Editar Curso" : t("admin.courses.createCourseButton")}
            </CardTitle>
            <CardDescription className="text-foreground/60 mt-1">
              {editingCourse ? "Actualiza la información de tu curso" : "Crea un nuevo curso online para tus estudiantes"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic Information Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-accent" />
            <h3 className="font-semibold text-foreground">Información del Curso</h3>
          </div>

          <div className="space-y-2">
            <Label htmlFor="course-title" className="text-foreground/80 flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5 text-accent" />
              Título del Curso *
            </Label>
            <Input
              id="course-title"
              placeholder="Ej: Bachata Sensual para Principiantes"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-background/50 border-border/50 focus:border-accent transition-colors"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="course-description" className="text-foreground/80">
              Descripción del Curso
            </Label>
            <Textarea
              id="course-description"
              placeholder="Describe qué aprenderán los estudiantes, nivel requerido, duración estimada, etc."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="bg-background/50 border-border/50 focus:border-accent transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course-style" className="text-foreground/80 flex items-center gap-2">
                <Music className="h-3.5 w-3.5 text-accent" />
                Estilo de Baile
              </Label>
              <Input
                id="course-style"
                placeholder="Ej: Salsa, Bachata, Kizomba"
                value={formData.danceStyle}
                onChange={(e) => setFormData({ ...formData, danceStyle: e.target.value })}
                className="bg-background/50 border-border/50 focus:border-accent transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="course-level" className="text-foreground/80 flex items-center gap-2">
                <Signal className="h-3.5 w-3.5 text-accent" />
                Nivel
              </Label>
              <Select value={formData.level} onValueChange={(val: any) => setFormData({ ...formData, level: val })}>
                <SelectTrigger id="course-level" className="bg-background/50 border-border/50 focus:border-accent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-levels">Todos los niveles</SelectItem>
                  <SelectItem value="beginner">Principiante</SelectItem>
                  <SelectItem value="intermediate">Intermedio</SelectItem>
                  <SelectItem value="advanced">Avanzado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course-price" className="text-foreground/80 flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5 text-accent" />
                Precio *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50">£</span>
                <Input
                  id="course-price"
                  type="number"
                  placeholder="49.99"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="bg-background/50 border-border/50 focus:border-accent transition-colors pl-8"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="course-duration" className="text-foreground/80 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-accent" />
                Duración
              </Label>
              <Input
                id="course-duration"
                placeholder="Ej: 8 semanas"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="bg-background/50 border-border/50 focus:border-accent transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="course-lessons" className="text-foreground/80 flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-accent" />
                # Lecciones
              </Label>
              <Input
                id="course-lessons"
                type="number"
                placeholder="12"
                value={formData.lessonsCount}
                onChange={(e) => setFormData({ ...formData, lessonsCount: e.target.value })}
                className="bg-background/50 border-border/50 focus:border-accent transition-colors"
                min="1"
              />
            </div>
          </div>

          {isAdmin && (
            <div className="space-y-2">
              <Label htmlFor="course-instructor" className="text-foreground/80 flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-accent" />
                Instructor *
              </Label>
              <Select value={formData.instructorId} onValueChange={(val) => setFormData({ ...formData, instructorId: val })}>
                <SelectTrigger id="course-instructor" className="bg-background/50 border-border/50 focus:border-accent">
                  <SelectValue placeholder="Selecciona un instructor" />
                </SelectTrigger>
                <SelectContent>
                  {instructors?.map((instructor) => (
                    <SelectItem key={instructor.id} value={instructor.id.toString()}>
                      {instructor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Separator className="bg-border/50" />

        {/* Discount Codes Section */}
        <DiscountCodesSection itemType="course" itemId={editingCourse?.id} />

        <Separator className="bg-border/50" />

        {/* Video Upload Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Video className="h-4 w-4 text-accent" />
            <h3 className="font-semibold text-foreground">Video Promocional (opcional)</h3>
          </div>

          <ProfessionalUploadProgress
            isUploading={uploading}
            progress={uploadProgress}
            uploadComplete={!!formData.bunnyVideoId || !!formData.videoPreview}
            uploadType="video"
            fileName={formData.videoFile?.name}
          />

          {!uploading && !formData.bunnyVideoId && !formData.videoPreview && (
            <div
              className="relative border-2 border-dashed border-accent/30 rounded-xl p-8 bg-gradient-to-br from-accent/5 to-transparent hover:border-accent/50 transition-all duration-300 cursor-pointer group"
              onClick={() => videoInputRef.current?.click()}
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 mb-3 border border-accent/20 group-hover:scale-110 transition-transform duration-300">
                  <Upload className="h-8 w-8 text-accent" />
                </div>
                <p className="font-medium text-foreground mb-1">
                  Sube un video promocional
                </p>
                <p className="text-sm text-foreground/60 mb-4">
                  Máx. 2GB (mp4, mov, avi, webm, etc.)
                </p>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    videoInputRef.current?.click();
                  }}
                  className="bg-gradient-to-r from-[#FA3698] to-purple-600 hover:from-[#FA3698]/90 hover:to-purple-600/90 text-white border-0 shadow-lg shadow-[#FA3698]/25"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Seleccionar Video
                </Button>
              </div>
            </div>
          )}

          {!uploading && (formData.bunnyVideoId || formData.videoPreview) && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => videoInputRef.current?.click()}
                className="flex-1"
              >
                <Video className="h-4 w-4 mr-2" />
                Cambiar Video
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData({ ...formData, bunnyVideoId: undefined, bunnyLibraryId: undefined, videoFile: null, videoPreview: "", videoUrl: "" })}
                className="text-red-600 hover:text-red-700 hover:border-red-300"
              >
                <X className="h-4 w-4" />
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
                e.target.value = "";
              }
            }}
            className="hidden"
          />
        </div>

        <Separator className="bg-border/50" />

        {/* Image Upload Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="h-4 w-4 text-accent" />
            <h3 className="font-semibold text-foreground">Imagen de Portada (opcional)</h3>
          </div>

          {formData.imagePreview ? (
            <div className="space-y-4">
              <div className="relative group rounded-xl overflow-hidden border-2 border-accent/30">
                <img
                  src={formData.imagePreview}
                  alt="Course cover"
                  className="w-full h-48 object-cover"
                />
                {!formData.imageUrl && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-2" />
                      <p className="text-white text-sm font-medium">Subiendo imagen...</p>
                    </div>
                  </div>
                )}
                {formData.imageUrl && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-500 text-white border-0 shadow-lg">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Subida
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={imageUploading}
                  className="flex-1"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Cambiar Imagen
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, imageUrl: "", imagePreview: "" })}
                  className="text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  <X className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="relative border-2 border-dashed border-accent/30 rounded-xl p-6 bg-gradient-to-br from-accent/5 to-transparent hover:border-accent/50 transition-all duration-300 cursor-pointer group"
              onClick={() => imageInputRef.current?.click()}
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 mb-3 border border-accent/20 group-hover:scale-110 transition-transform duration-300">
                  <Upload className="h-7 w-7 text-accent" />
                </div>
                <p className="font-medium text-foreground mb-1 text-sm">
                  Sube una imagen de portada
                </p>
                <p className="text-xs text-foreground/60 mb-3">
                  Máx. 10MB (JPG, PNG, etc.)
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    imageInputRef.current?.click();
                  }}
                  disabled={imageUploading}
                  className="bg-gradient-to-r from-[#FA3698] to-purple-600 hover:from-[#FA3698]/90 hover:to-purple-600/90 text-white border-0"
                >
                  {imageUploading ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3 w-3 mr-2" />
                      Seleccionar Imagen
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleImageSelect(e.target.files[0]);
                e.target.value = "";
              }
            }}
            className="hidden"
          />
        </div>

        {/* Image Cropper Modal */}
        <ImageCropperModal
          imageSrc={cropSrc}
          aspect={16 / 9}
          label={t("admin.courses.cropCover")}
          onCropComplete={handleCropComplete}
          onClose={() => setCropSrc(null)}
        />

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending || uploading || imageUploading}
            className="btn-vibrant flex-1 h-12 text-base font-semibold shadow-lg"
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {editingCourse ? "Actualizando..." : "Creando Curso..."}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                {editingCourse ? "Actualizar Curso" : "Crear Curso"}
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            className="h-12"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        </div>

        <p className="text-xs text-foreground/50 text-center">
          * Campos requeridos
        </p>
      </CardContent>
    </Card>
  );
}
