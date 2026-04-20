import { useState, useRef, useEffect, useMemo } from "react";
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
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import ImageCropperModal from "@/components/ImageCropperModal";
import ModernImageUpload from "@/components/ModernImageUpload";
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
  const [step, setStep] = useState(0);

  const steps = useMemo(() => {
    const base = [
      { key: "basics", label: "Basics", icon: Sparkles,     color: "blue" },
      { key: "video",  label: "Video",  icon: Video,        color: "amber" },
      { key: "image",  label: "Cover",  icon: ImageIcon,    color: "indigo" },
    ];
    if (editingCourse?.id) {
      base.push({ key: "discounts", label: "Discounts", icon: Tag, color: "rose" });
    }
    return base;
  }, [editingCourse?.id]);

  const currentStep = steps[step];
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

          toast.success(`¡Video subido successfully! (${fileSizeMB.toFixed(1)}MB)`);
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
    <div className="space-y-6">
      {/* ───────── Step Indicator ───────── */}
      <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {steps.map((s, idx) => {
            const active = idx === step;
            const done = idx < step;
            const disabled = !editingCourse?.id && idx > 2;
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => !disabled && setStep(idx)}
                disabled={disabled}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  active
                    ? "bg-gradient-to-r from-[#FA3698]/20 to-purple-500/20 text-foreground border border-[#FA3698]/40"
                    : done
                      ? "text-green-400 hover:bg-white/5"
                      : disabled
                        ? "text-foreground/30 cursor-not-allowed"
                        : "text-foreground/60 hover:bg-white/5"
                }`}
              >
                <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                  active ? "bg-[#FA3698] text-white" : done ? "bg-green-500/20 text-green-400" : "bg-white/10 text-foreground/50"
                }`}>
                  {done ? <Check className="h-3 w-3" /> : idx + 1}
                </span>
                <Icon className="h-3.5 w-3.5" />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ───────── Step 0: Basic Information ───────── */}
      {step === 0 && (
      <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/[0.06] to-transparent p-5 md:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/15">
            <Sparkles className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Course Information</h3>
            <p className="text-xs text-foreground/50">Title, instructor and details about what students will learn</p>
          </div>
        </div>

          <div className="space-y-2">
            <Label htmlFor="course-title" className="text-foreground/80 flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5 text-accent" />
              Title del Course *
            </Label>
            <Input
              id="course-title"
              placeholder="Ej: Bachata Sensual para Beginners"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-background/50 border-border/50 focus:border-accent transition-colors"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="course-description" className="text-foreground/80">
              Description del Course
            </Label>
            <Textarea
              id="course-description"
              placeholder="Describe qué aprenderán los students, nivel requerido, duración estimada, etc."
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
                Dance Style
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
                Level
              </Label>
              <Select value={formData.level} onValueChange={(val: any) => setFormData({ ...formData, level: val })}>
                <SelectTrigger id="course-level" className="bg-background/50 border-border/50 focus:border-accent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-levels">All levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course-price" className="text-foreground/80 flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5 text-accent" />
                Price *
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
                Duration
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
                # Lessons
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
                  <SelectValue placeholder="Select an instructor" />
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
      )}

      {/* ───────── Discounts (edit-only, step 3) ───────── */}
      {step === 3 && editingCourse?.id && (
      <div className="rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/[0.06] to-transparent p-5 md:p-6">
        <DiscountCodesSection itemType="course" itemId={editingCourse.id} />
      </div>
      )}

      {/* ───────── Step 1: Video ───────── */}
      {step === 1 && (
      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.06] to-transparent p-5 md:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/15">
            <Video className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Promotional Video (Optional)</h3>
            <p className="text-xs text-foreground/50">Upload a preview or teaser video for the course landing page</p>
          </div>
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
              className="relative border-2 border-dashed border-accent/30 rounded-xl p-8 bg-gradient-to-br from-accent/5 to-transparent hover:border-accent/50 transition-all duration-300 courser-pointer group"
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
                  Selectr Video
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
      )}

      {/* ───────── Step 2: Cover Image ───────── */}
      {step === 2 && (
      <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.06] to-transparent p-5 md:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/15">
            <ImageIcon className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Cover Image (Optional)</h3>
            <p className="text-xs text-foreground/50">Landscape thumbnail shown on the course card</p>
          </div>
        </div>

        <ModernImageUpload
          previewUrl={formData.imagePreview || undefined}
          uploading={!!formData.imagePreview && !formData.imageUrl}
          onFileSelected={handleImageSelect}
          onRemove={() => setFormData({ ...formData, imageUrl: "", imagePreview: "" })}
          aspect="16/9"
          accent="indigo"
          label="Upload a course cover"
          helper="Landscape thumbnail shown on the course card."
        />
      </div>
      )}

      {/* Image Cropper Modal */}
      <ImageCropperModal
        imageSrc={cropSrc}
        aspect={16 / 9}
        label={t("admin.courses.cropCover")}
        onCropComplete={handleCropComplete}
        onClose={() => setCropSrc(null)}
      />

      {/* ───────── Sticky Action Bar ───────── */}
      <div className="sticky bottom-0 -mx-4 md:-mx-0 bg-background/95 backdrop-blur-md border-t border-border/40 px-4 py-3 mt-2 flex items-center justify-between gap-3 z-10">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          className="h-11 px-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="text-xs text-foreground/50 hidden sm:block">
          Step {step + 1} of {steps.length} · <span className="font-semibold text-foreground/70">{currentStep.label}</span>
        </div>
        <div className="flex gap-2">
          {step < 2 ? (
            <Button type="button" onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))} className="btn-vibrant h-11 px-6">
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : step === 2 ? (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending || uploading || imageUploading}
              className="btn-vibrant h-11 px-6 text-sm font-semibold shadow-lg"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {editingCourse ? "Updating…" : "Publishing…"}</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> {editingCourse ? "Save Changes" : "Publish Course"}</>
              )}
            </Button>
          ) : (
            <Button type="button" onClick={resetForm} className="btn-vibrant h-11 px-6">Done</Button>
          )}
        </div>
      </div>
    </div>
  );
}
