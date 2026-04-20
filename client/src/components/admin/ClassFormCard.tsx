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
  Clock,
  DollarSign,
  Image as ImageIcon,
  Upload,
  Loader2,
  X,
  Sparkles,
  Music,
  Signal,
  Users,
  Calendar,
  MapPin,
  User,
  CheckCircle,
  CreditCard,
  Banknote,
  PartyPopper,
  FileText,
  Download,
  ArrowLeft,
  ArrowRight,
  Check,
  Tag,
  Ticket,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import DiscountCodesSection from "./DiscountCodesSection";
import TicketTiersSection from "./TicketTiersSection";
import ImageCropperModal from "@/components/ImageCropperModal";
import ModernImageUpload from "@/components/ModernImageUpload";
import { useTranslations } from "@/hooks/useTranslations";

interface ClassFormCardProps {
  onSuccess?: () => void;
  editingClass?: any;
  instructors?: any[];
  myInstructorProfile?: any;
  isAdmin?: boolean;
  checkClassEntitlement?: () => Promise<any>;
  onUpgradeRequired?: (reason: string) => void;
}

export default function ClassFormCard({
  onSuccess,
  editingClass,
  instructors,
  myInstructorProfile,
  isAdmin = false,
  checkClassEntitlement,
  onUpgradeRequired
}: ClassFormCardProps) {
  const { t } = useTranslations();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const materialsInputRef = useRef<HTMLInputElement>(null);

  const uploadFileMutation = trpc.uploads.uploadFile.useMutation();

  const createMutation = trpc.classes.create.useMutation({
    onSuccess: () => {
      toast.success(t("admin.classes.toastCreated"));
      resetForm();
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const updateMutation = trpc.classes.update.useMutation({
    onSuccess: () => {
      toast.success(t("admin.classes.toastUpdated"));
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
    level: "all-levels",
    price: "",
    instructorId: "",
    classDate: "",
    duration: "",
    maxParticipants: "",
    imageUrl: "",
    imagePreview: "",
    hasSocial: false,
    socialTime: "",
    socialLocation: "",
    socialDescription: "",
    paymentMethod: "online" as "online" | "cash" | "both",
    materialsUrl: "",
    materialsFileName: "",
  });

  const [uploading, setUploading] = useState(false);
  const [uploadingMaterials, setUploadingMaterials] = useState(false);
  const [step, setStep] = useState(0);

  const steps = useMemo(() => {
    const base = [
      { key: "basics",   label: "Basics",   icon: Sparkles,    color: "blue" },
      { key: "schedule", label: "Schedule", icon: Clock,       color: "amber" },
      { key: "payment",  label: "Payment",  icon: CreditCard,  color: "green" },
      { key: "social",   label: "Social",   icon: PartyPopper, color: "pink" },
      { key: "image",    label: "Image",    icon: ImageIcon,   color: "indigo" },
      { key: "files",    label: "Materials", icon: FileText,    color: "teal" },
    ];
    if (editingClass?.id) {
      base.push({ key: "tiers",     label: "Ticket Types", icon: Ticket, color: "cyan" });
      base.push({ key: "discounts", label: "Discounts",    icon: Tag,    color: "rose" });
    }
    return base;
  }, [editingClass?.id]);

  const currentStep = steps[step];
  const isLastCoreStep = step === 5;
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  // Auto-fill instructorId for instructor role users
  useEffect(() => {
    if (!isAdmin && myInstructorProfile && !editingClass) {
      setFormData(prev => ({ ...prev, instructorId: myInstructorProfile.id.toString() }));
    }
  }, [myInstructorProfile, isAdmin, editingClass]);

  // Populate form when editing
  useEffect(() => {
    if (editingClass) {
      const d = new Date(editingClass.classDate);
      const pad = (n: number) => String(n).padStart(2, "0");
      const localDateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

      setFormData({
        title: editingClass.title || "",
        description: editingClass.description || "",
        danceStyle: editingClass.danceStyle || "",
        level: editingClass.level || "all-levels",
        price: editingClass.price?.toString() || "",
        instructorId: editingClass.instructorId?.toString() || "",
        classDate: localDateStr,
        duration: editingClass.duration?.toString() || "",
        maxParticipants: editingClass.maxParticipants?.toString() || "",
        imageUrl: editingClass.imageUrl || "",
        imagePreview: editingClass.imageUrl || "",
        hasSocial: editingClass.hasSocial || false,
        socialTime: editingClass.socialTime || "",
        socialLocation: editingClass.socialLocation || "",
        socialDescription: editingClass.socialDescription || "",
        paymentMethod: (editingClass.paymentMethod || "online") as "online" | "cash" | "both",
        materialsUrl: editingClass.materialsUrl || "",
        materialsFileName: editingClass.materialsFileName || "",
      });
    }
  }, [editingClass]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      danceStyle: "",
      level: "all-levels",
      price: "",
      instructorId: !isAdmin && myInstructorProfile ? myInstructorProfile.id.toString() : "",
      classDate: "",
      duration: "",
      maxParticipants: "",
      imageUrl: "",
      imagePreview: "",
      hasSocial: false,
      socialTime: "",
      socialLocation: "",
      socialDescription: "",
      paymentMethod: "online",
      materialsUrl: "",
      materialsFileName: "",
    });
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (materialsInputRef.current) materialsInputRef.current.value = "";
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
    setUploading(true);
    try {
      // Generate unique filename: class-{id}-{timestamp}.jpg
      const timestamp = Date.now();
      const uniqueFileName = editingClass?.id
        ? `class-${editingClass.id}-${timestamp}.jpg`
        : `class-new-${timestamp}.jpg`;

      const result = await uploadFileMutation.mutateAsync({
        fileBase64: croppedDataUrl,
        fileName: uniqueFileName,
        mimeType: "image/jpeg",
        folder: "classes",
      });
      setFormData(prev => ({ ...prev, imageUrl: result.url }));
      toast.success(t("upload.imageUploadedSuccess"));
    } catch (uploadErr: any) {
      toast.error('Error uploading: ' + uploadErr.message);
      setFormData(prev => ({ ...prev, imagePreview: "", imageUrl: "" }));
    } finally {
      setUploading(false);
    }
  };

  const handleMaterialsUpload = async (file: File) => {
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/zip',
      'application/x-zip-compressed',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select a valid file (PDF, ZIP, DOC, or DOCX)");
      return;
    }

    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File too large. Maximum size is 50MB. Your file: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
      return;
    }

    setUploadingMaterials(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;

        const timestamp = Date.now();
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueFileName = editingClass?.id
          ? `class-${editingClass.id}-materials-${timestamp}-${sanitizedFileName}`
          : `class-new-materials-${timestamp}-${sanitizedFileName}`;

        try {
          const result = await uploadFileMutation.mutateAsync({
            fileBase64: base64,
            fileName: uniqueFileName,
            mimeType: file.type,
            folder: "class-materials",
          });

          setFormData(prev => ({
            ...prev,
            materialsUrl: result.url,
            materialsFileName: file.name
          }));
          toast.success("Materials uploaded successfully!");
        } catch (uploadErr: any) {
          toast.error('Error uploading materials: ' + uploadErr.message);
        } finally {
          setUploadingMaterials(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error('Error reading file: ' + err.message);
      setUploadingMaterials(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.price || !formData.instructorId || !formData.classDate) {
      toast.error(t("validation.fillRequiredFields"));
      return;
    }

    if (!editingClass && checkClassEntitlement) {
      try {
        const result = await checkClassEntitlement();
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
      level: formData.level as any,
      price: formData.price,
      instructorId: parseInt(formData.instructorId),
      classDate: formData.classDate,
      duration: formData.duration ? parseInt(formData.duration) : undefined,
      maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
      imageUrl: formData.imageUrl || undefined,
      hasSocial: formData.hasSocial,
      socialTime: formData.socialTime || undefined,
      socialLocation: formData.socialLocation || undefined,
      socialDescription: formData.socialDescription || undefined,
      paymentMethod: formData.paymentMethod,
      materialsUrl: formData.materialsUrl || undefined,
      materialsFileName: formData.materialsFileName || undefined,
    };

    if (editingClass) {
      updateMutation.mutate({ id: editingClass.id, ...payload });
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
            const disabled = !editingClass?.id && idx > 5;
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
            <h3 className="font-semibold text-foreground">Class Information</h3>
            <p className="text-xs text-foreground/50">Name your class and tell students what it's about</p>
          </div>
        </div>

          <div className="space-y-2">
            <Label htmlFor="class-title" className="text-foreground/80 flex items-center gap-2">
              <Music className="h-3.5 w-3.5 text-accent" />
              Title de la Class *
            </Label>
            <Input
              id="class-title"
              placeholder="Ej: Salsa On2 - Level Intermediate"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-background/50 border-border/50 focus:border-accent transition-colors"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="class-description" className="text-foreground/80">
              Description
            </Label>
            <Textarea
              id="class-description"
              placeholder="Describe la class: qué se va a enseñar, requisitos, qué traer, etc."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="bg-background/50 border-border/50 focus:border-accent transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="class-style" className="text-foreground/80 flex items-center gap-2">
                <Music className="h-3.5 w-3.5 text-accent" />
                Dance Style
              </Label>
              <Input
                id="class-style"
                placeholder="Ej: Salsa, Bachata, Kizomba"
                value={formData.danceStyle}
                onChange={(e) => setFormData({ ...formData, danceStyle: e.target.value })}
                className="bg-background/50 border-border/50 focus:border-accent transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="class-level" className="text-foreground/80 flex items-center gap-2">
                <Signal className="h-3.5 w-3.5 text-accent" />
                Level
              </Label>
              <Select value={formData.level} onValueChange={(val: any) => setFormData({ ...formData, level: val })}>
                <SelectTrigger id="class-level" className="bg-background/50 border-border/50 focus:border-accent">
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

          {isAdmin && (
            <div className="space-y-2">
              <Label htmlFor="class-instructor" className="text-foreground/80 flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-accent" />
                Instructor *
              </Label>
              <Select value={formData.instructorId} onValueChange={(val) => setFormData({ ...formData, instructorId: val })}>
                <SelectTrigger id="class-instructor" className="bg-background/50 border-border/50 focus:border-accent">
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

      {/* ───────── Step 1: Schedule & Pricing ───────── */}
      {step === 1 && (
      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.06] to-transparent p-5 md:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/15">
            <Clock className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Schedule &amp; Pricing</h3>
            <p className="text-xs text-foreground/50">When is the class, how much, and how many seats</p>
          </div>
        </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="class-date" className="text-foreground/80">
                Date and Time *
              </Label>
              <Input
                id="class-date"
                type="datetime-local"
                value={formData.classDate}
                onChange={(e) => setFormData({ ...formData, classDate: e.target.value })}
                className="bg-background/50 border-border/50 focus:border-accent transition-colors"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="class-duration" className="text-foreground/80 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-accent" />
                Duration (minutes)
              </Label>
              <Input
                id="class-duration"
                type="number"
                placeholder="90"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="bg-background/50 border-border/50 focus:border-accent transition-colors"
                min="15"
                step="15"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="class-price" className="text-foreground/80 flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5 text-accent" />
                Price *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50">£</span>
                <Input
                  id="class-price"
                  type="number"
                  placeholder="15.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="bg-background/50 border-border/50 focus:border-accent transition-colors pl-8"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="class-max" className="text-foreground/80 flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-accent" />
                Máx. Participbefore
              </Label>
              <Input
                id="class-max"
                type="number"
                placeholder="20"
                value={formData.maxParticipants}
                onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                className="bg-background/50 border-border/50 focus:border-accent transition-colors"
                min="1"
              />
            </div>
          </div>
        </div>
      )}

      {/* ───────── Step 2: Payment Method ───────── */}
      {step === 2 && (
      <div className="rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/[0.06] to-transparent p-5 md:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-green-500/15">
            <CreditCard className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Payment Method</h3>
            <p className="text-xs text-foreground/50">How will students pay?</p>
          </div>
        </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, paymentMethod: "online" })}
              className={`p-3 rounded-xl border-2 transition-all ${
                formData.paymentMethod === "online"
                  ? "border-accent bg-accent/10"
                  : "border-border/50 bg-background/30 hover:border-accent/50"
              }`}
            >
              <CreditCard className={`h-4 w-4 mx-auto mb-1 ${formData.paymentMethod === "online" ? "text-accent" : "text-foreground/50"}`} />
              <p className={`text-xs font-medium ${formData.paymentMethod === "online" ? "text-accent" : "text-foreground/70"}`}>
                Online
              </p>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, paymentMethod: "cash" })}
              className={`p-3 rounded-xl border-2 transition-all ${
                formData.paymentMethod === "cash"
                  ? "border-accent bg-accent/10"
                  : "border-border/50 bg-background/30 hover:border-accent/50"
              }`}
            >
              <Banknote className={`h-4 w-4 mx-auto mb-1 ${formData.paymentMethod === "cash" ? "text-accent" : "text-foreground/50"}`} />
              <p className={`text-xs font-medium ${formData.paymentMethod === "cash" ? "text-accent" : "text-foreground/70"}`}>
                Cash
              </p>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, paymentMethod: "both" })}
              className={`p-3 rounded-xl border-2 transition-all ${
                formData.paymentMethod === "both"
                  ? "border-accent bg-accent/10"
                  : "border-border/50 bg-background/30 hover:border-accent/50"
              }`}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <CreditCard className={`h-3 w-3 ${formData.paymentMethod === "both" ? "text-accent" : "text-foreground/50"}`} />
                <Banknote className={`h-3 w-3 ${formData.paymentMethod === "both" ? "text-accent" : "text-foreground/50"}`} />
              </div>
              <p className={`text-xs font-medium ${formData.paymentMethod === "both" ? "text-accent" : "text-foreground/70"}`}>
                Both
              </p>
            </button>
          </div>
        </div>
      )}

      {/* ───────── Ticket Types (edit-only) ───────── */}
      {steps[step]?.key === "tiers" && editingClass?.id && (
      <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.06] to-transparent p-5 md:p-6">
        <TicketTiersSection parentType="class" classId={editingClass.id} flatTicketPrice={formData.price} />
      </div>
      )}

      {/* ───────── Discounts (edit-only) ───────── */}
      {steps[step]?.key === "discounts" && editingClass?.id && (
      <div className="rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/[0.06] to-transparent p-5 md:p-6">
        <DiscountCodesSection itemType="class" itemId={editingClass.id} />
      </div>
      )}

      {/* ───────── Step 3: Social Dancing ───────── */}
      {step === 3 && (
      <div className="rounded-2xl border border-pink-500/20 bg-gradient-to-br from-pink-500/[0.06] to-transparent p-5 md:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-pink-500/15">
            <PartyPopper className="h-5 w-5 text-pink-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Social Dancing (Optional)</h3>
            <p className="text-xs text-foreground/50">Skip this if there's no social after class</p>
          </div>
        </div>

          <div className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-background/30">
            <input
              type="checkbox"
              id="has-social"
              checked={formData.hasSocial}
              onChange={(e) => setFormData({ ...formData, hasSocial: e.target.checked })}
              className="w-5 h-5 rounded border-border/50 text-accent focus:ring-accent"
            />
            <Label htmlFor="has-social" className="text-foreground/80 courser-pointer flex-1">
              Esta class incluye social dancing after
            </Label>
          </div>

          {formData.hasSocial && (
            <div className="space-y-4 pl-4 border-l-2 border-accent/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="social-time" className="text-foreground/80 flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-accent" />
                    Hora del Social
                  </Label>
                  <Input
                    id="social-time"
                    placeholder="Ej: 21:00 - 23:00"
                    value={formData.socialTime}
                    onChange={(e) => setFormData({ ...formData, socialTime: e.target.value })}
                    className="bg-background/50 border-border/50 focus:border-accent transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="social-location" className="text-foreground/80 flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-accent" />
                    Ubicación del Social
                  </Label>
                  <Input
                    id="social-location"
                    placeholder="Ej: Mismo local"
                    value={formData.socialLocation}
                    onChange={(e) => setFormData({ ...formData, socialLocation: e.target.value })}
                    className="bg-background/50 border-border/50 focus:border-accent transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="social-description" className="text-foreground/80">
                  Detalles del Social
                </Label>
                <Textarea
                  id="social-description"
                  placeholder="Describe el social: música, ambiente, costo adicional, etc."
                  value={formData.socialDescription}
                  onChange={(e) => setFormData({ ...formData, socialDescription: e.target.value })}
                  rows={2}
                  className="bg-background/50 border-border/50 focus:border-accent transition-colors resize-none"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────── Step 4: Image ───────── */}
      {step === 4 && (
      <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.06] to-transparent p-5 md:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/15">
            <ImageIcon className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Class Image (Optional)</h3>
            <p className="text-xs text-foreground/50">Landscape image displayed on the class card</p>
          </div>
        </div>

        <ModernImageUpload
          previewUrl={formData.imagePreview || undefined}
          uploading={!!formData.imagePreview && !formData.imageUrl}
          onFileSelected={handleImageSelect}
          onRemove={() => setFormData({ ...formData, imageUrl: "", imagePreview: "" })}
          aspect="16/9"
          accent="indigo"
          label="Upload a class image"
          helper="Landscape photo shown on the class card and detail page."
        />
      </div>
      )}

      {/* ───────── Step 5: Materials ───────── */}
      {step === 5 && (
      <div className="rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-500/[0.06] to-transparent p-5 md:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/15">
            <FileText className="h-5 w-5 text-teal-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Class Materials (Optional)</h3>
            <p className="text-xs text-foreground/50">PDFs, worksheets or resources students can download</p>
          </div>
        </div>

          <p className="text-sm text-foreground/60">
            Upload PDF, ZIP, DOC, or DOCX files (max 50MB) that students can download after purchasing the class.
          </p>

          {formData.materialsUrl ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-accent/30 bg-accent/5">
                <FileText className="h-5 w-5 text-accent flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {formData.materialsFileName || "Materials uploaded"}
                  </p>
                  <p className="text-xs text-foreground/50">
                    Click 'Remove' to upload a different file
                  </p>
                </div>
                <Badge className="bg-green-500 text-white border-0">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Uploaded
                </Badge>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(formData.materialsUrl, '_blank')}
                  className="flex-1"
                >
                  <Download className="h-3 w-3 mr-2" />
                  Preview
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, materialsUrl: "", materialsFileName: "" })}
                  className="flex-1 border-red-500/30 text-red-500 hover:bg-red-500/10"
                  disabled={uploadingMaterials}
                >
                  <X className="h-3 w-3 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => materialsInputRef.current?.click()}
              className="relative group courser-pointer rounded-xl border-2 border-dashed border-border/50 bg-background/30 hover:border-accent/50 hover:bg-accent/5 transition-all p-8"
            >
              <div className="text-center">
                {uploadingMaterials ? (
                  <>
                    <Loader2 className="h-10 w-10 mx-auto mb-3 text-accent animate-spin" />
                    <p className="text-sm font-medium text-foreground mb-1">Uploading materials...</p>
                    <p className="text-xs text-foreground/50">Please wait</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-10 w-10 mx-auto mb-3 text-foreground/40 group-hover:text-accent transition-colors" />
                    <p className="text-sm font-medium text-foreground/70 group-hover:text-accent transition-colors mb-1">
                      Click to upload class materials
                    </p>
                    <p className="text-xs text-foreground/50">
                      PDF, ZIP, DOC, DOCX (max 50MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          <input
            ref={materialsInputRef}
            type="file"
            accept=".pdf,.zip,.doc,.docx"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleMaterialsUpload(e.target.files[0]);
                e.target.value = "";
              }
            }}
            className="hidden"
            disabled={uploadingMaterials}
          />
        </div>
      )}

      {/* Image Cropper Modal */}
      <ImageCropperModal
        imageSrc={cropSrc}
        aspect={16 / 9}
        label="Crop the class image"
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
          {step < 5 ? (
            <Button type="button" onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))} className="btn-vibrant h-11 px-6">
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : step === 5 ? (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending || uploading}
              className="btn-vibrant h-11 px-6 text-sm font-semibold shadow-lg"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {editingClass ? "Updating…" : "Publishing…"}</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> {editingClass ? "Save Changes" : "Publish Class"}</>
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
