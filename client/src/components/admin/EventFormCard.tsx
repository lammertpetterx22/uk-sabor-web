import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Image as ImageIcon,
  Upload,
  Loader2,
  X,
  Sparkles,
  CreditCard,
  Banknote,
  Building2,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import ImageCropperModal from "@/components/ImageCropperModal";
import { useTranslations } from "@/hooks/useTranslations";
import DiscountCodesSection from "./DiscountCodesSection";
import GuestListSection from "./GuestListSection";
import RrpAssignmentSection from "./RrpAssignmentSection";

interface EventFormCardProps {
  editingEvent?: any;
  onSuccess?: () => void;
  checkEventEntitlement?: () => Promise<any>;
  onUpgradeRequired?: (reason: string) => void;
}

export default function EventFormCard({
  editingEvent,
  onSuccess,
  checkEventEntitlement,
  onUpgradeRequired
}: EventFormCardProps) {
  const { t } = useTranslations();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const uploadFileMutation = trpc.uploads.uploadFile.useMutation();
  const createMutation = trpc.admin.createEvent.useMutation({
    onSuccess: () => {
      toast.success(t("admin.events.toastCreated"));
      resetForm();
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const updateMutation = trpc.admin.updateEvent.useMutation({
    onSuccess: () => {
      toast.success("✅ Event updated successfully");
      resetForm();
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const [formData, setFormData] = useState(() => {
    if (editingEvent) {
      return {
        title: editingEvent.title || "",
        description: editingEvent.description || "",
        venue: editingEvent.venue || "",
        city: editingEvent.city || "",
        eventDate: editingEvent.eventDate ? new Date(editingEvent.eventDate).toISOString().slice(0, 16) : "",
        ticketPrice: editingEvent.ticketPrice?.toString() || "",
        maxTickets: editingEvent.maxTickets?.toString() || "",
        imageUrl: editingEvent.imageUrl || "",
        imagePreview: editingEvent.imageUrl || "",
        bannerUrl: editingEvent.bannerUrl || "",
        bannerPreview: editingEvent.bannerUrl || "",
        paymentMethod: (editingEvent.paymentMethod || "online") as "online" | "cash" | "both",
        showLowTicketAlert: editingEvent.showLowTicketAlert || false,
      };
    }
    return {
      title: "",
      description: "",
      venue: "",
      city: "",
      eventDate: "",
      ticketPrice: "",
      maxTickets: "",
      imageUrl: "",
      imagePreview: "",
      bannerUrl: "",
      bannerPreview: "",
      paymentMethod: "online" as "online" | "cash" | "both",
      showLowTicketAlert: false,
    };
  });

  const [uploading, setUploading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropSrcBanner, setCropSrcBanner] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      venue: "",
      city: "",
      eventDate: "",
      ticketPrice: "",
      maxTickets: "",
      imageUrl: "",
      imagePreview: "",
      bannerUrl: "",
      bannerPreview: "",
      paymentMethod: "online",
      showLowTicketAlert: false,
    });
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (bannerInputRef.current) bannerInputRef.current.value = "";
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
      // Generate unique filename: event-{id}-{timonthtamp}.jpg
      const timonthtamp = Date.now();
      const uniqueFileName = editingEvent?.id
        ? `event-${editingEvent.id}-${timonthtamp}.jpg`
        : `event-new-${timonthtamp}.jpg`;

      const result = await uploadFileMutation.mutateAsync({
        fileBase64: croppedDataUrl,
        fileName: uniqueFileName,
        mimeType: "image/jpeg",
        folder: "events",
      });
      setFormData(prev => ({ ...prev, imageUrl: result.url }));
      toast.success(t("upload.imageUploadedSuccess"));
    } catch (uploadErr: any) {
      toast.error(t("admin.events.errorUpload", { message: uploadErr.message }));
      setFormData(prev => ({ ...prev, imagePreview: "", imageUrl: "" }));
    } finally {
      setUploading(false);
    }
  };

  const handleBannerSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum 10MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setCropSrcBanner(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleBannerCropComplete = async (croppedDataUrl: string) => {
    setCropSrcBanner(null);
    setFormData(prev => ({ ...prev, bannerPreview: croppedDataUrl, bannerUrl: "" }));
    setUploadingBanner(true);
    try {
      const timonthtamp = Date.now();
      const uniqueFileName = editingEvent?.id
        ? `event-banner-${editingEvent.id}-${timonthtamp}.jpg`
        : `event-banner-new-${timonthtamp}.jpg`;

      const result = await uploadFileMutation.mutateAsync({
        fileBase64: croppedDataUrl,
        fileName: uniqueFileName,
        mimeType: "image/jpeg",
        folder: "events",
      });
      setFormData(prev => ({ ...prev, bannerUrl: result.url }));
      toast.success("✅ Banner uploaded successfully");
    } catch (uploadErr: any) {
      toast.error(`Error uploading banner: ${uploadErr.message}`);
      setFormData(prev => ({ ...prev, bannerPreview: "", bannerUrl: "" }));
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!formData.title || !formData.venue || !formData.eventDate || !formData.ticketPrice) {
      toast.error(t("validation.fillRequiredFields"));
      return;
    }

    // If editing, update existing event
    if (editingEvent) {
      updateMutation.mutate({
        id: editingEvent.id,
        title: formData.title,
        description: formData.description,
        venue: formData.venue,
        city: formData.city,
        eventDate: formData.eventDate,
        ticketPrice: formData.ticketPrice,
        maxTickets: formData.maxTickets ? parseInt(formData.maxTickets) : undefined,
        imageUrl: formData.imageUrl,
        bannerUrl: formData.bannerUrl,
        paymentMethod: formData.paymentMethod,
        showLowTicketAlert: formData.showLowTicketAlert,
      });
      return;
    }

    // Check entitlement only for new events
    if (checkEventEntitlement) {
      try {
        const result = await checkEventEntitlement();
        const entitlement = result.data;
        if (entitlement && !entitlement.allowed) {
          onUpgradeRequired?.(entitlement.reason ?? t("admin.events.errorPlanLimit"));
          return;
        }
      } catch {
        // Fail open if entitlement check fails
      }
    }

    createMutation.mutate({
      title: formData.title,
      description: formData.description,
      venue: formData.venue,
      city: formData.city,
      eventDate: formData.eventDate,
      ticketPrice: formData.ticketPrice,
      maxTickets: formData.maxTickets ? parseInt(formData.maxTickets) : undefined,
      imageUrl: formData.imageUrl,
      bannerUrl: formData.bannerUrl,
      paymentMethod: formData.paymentMethod,
      showLowTicketAlert: formData.showLowTicketAlert,
    });
  };

  return (
    <div className="space-y-6">
      {/* ───────── Basic Information ───────── */}
      <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/[0.06] to-transparent p-5 md:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/15">
            <Sparkles className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Basic Information</h3>
            <p className="text-xs text-foreground/50">Name your event and tell people what it's about</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="event-title" className="text-foreground/70 text-xs uppercase tracking-wider font-semibold">
            Event Title <span className="text-[#FA3698]">*</span>
          </Label>
          <Input
            id="event-title"
            placeholder="e.g. Salsa Night - Summer Festival"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="bg-background/60 border-border/40 focus:border-blue-500/60 h-11 text-base"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="event-venue" className="text-foreground/70 text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Building2 className="h-3 w-3" /> Venue <span className="text-[#FA3698]">*</span>
            </Label>
            <Input
              id="event-venue"
              placeholder="e.g. Revolución de Cuba"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              className="bg-background/60 border-border/40 focus:border-blue-500/60 h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-city" className="text-foreground/70 text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <MapPin className="h-3 w-3" /> City
            </Label>
            <Input
              id="event-city"
              placeholder="e.g. Newcastle"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="bg-background/60 border-border/40 focus:border-blue-500/60 h-11"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="event-description" className="text-foreground/70 text-xs uppercase tracking-wider font-semibold">
            Description
          </Label>
          <Textarea
            id="event-description"
            placeholder="Describe your event: music style, dance level, atmosphere..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="bg-background/60 border-border/40 focus:border-blue-500/60 resize-none"
          />
        </div>
      </div>

      {/* ───────── Date & Tickets ───────── */}
      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.06] to-transparent p-5 md:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/15">
            <Clock className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Date and Tickets</h3>
            <p className="text-xs text-foreground/50">When is it? How much? How many seats?</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="event-date" className="text-foreground/70 text-xs uppercase tracking-wider font-semibold">
              Date & Time <span className="text-[#FA3698]">*</span>
            </Label>
            <Input
              id="event-date"
              type="datetime-local"
              value={formData.eventDate}
              onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
              className="bg-background/60 border-border/40 focus:border-amber-500/60 h-11"
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-price" className="text-foreground/70 text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <DollarSign className="h-3 w-3" /> Ticket Price <span className="text-[#FA3698]">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/60 font-semibold">£</span>
              <Input
                id="event-price"
                type="number"
                placeholder="25.00"
                value={formData.ticketPrice}
                onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value })}
                className="bg-background/60 border-border/40 focus:border-amber-500/60 pl-8 h-11"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-max-tickets" className="text-foreground/70 text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Users className="h-3 w-3" /> Max. Tickets
            </Label>
            <Input
              id="event-max-tickets"
              type="number"
              placeholder="100"
              value={formData.maxTickets}
              onChange={(e) => setFormData({ ...formData, maxTickets: e.target.value })}
              className="bg-background/60 border-border/40 focus:border-amber-500/60 h-11"
              min="1"
            />
          </div>
        </div>

        <label htmlFor="show-low-ticket-alert" className="flex items-center gap-3 p-3 rounded-xl bg-background/40 border border-border/40 cursor-pointer hover:border-amber-500/40 transition-colors">
          <input
            type="checkbox"
            id="show-low-ticket-alert"
            checked={formData.showLowTicketAlert}
            onChange={(e) => setFormData({ ...formData, showLowTicketAlert: e.target.checked })}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm text-foreground/80">Show "Only X tickets left" alert when fewer than 20 remain</span>
        </label>
      </div>

      {/* ───────── Payment Method ───────── */}
      <div className="rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/[0.06] to-transparent p-5 md:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-green-500/15">
            <CreditCard className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Payment Method</h3>
            <p className="text-xs text-foreground/50">How will people pay for tickets?</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { value: "online" as const, icon: CreditCard, label: "Online", desc: "Card via Stripe" },
            { value: "cash"   as const, icon: Banknote,   label: "Cash",   desc: "Pay at the door" },
            { value: "both"   as const, icon: CreditCard, label: "Both",   desc: "Online or at door" },
          ].map(({ value, icon: Icon, label, desc }) => {
            const active = formData.paymentMethod === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setFormData({ ...formData, paymentMethod: value })}
                className={`p-4 rounded-xl border-2 transition-all text-center ${
                  active
                    ? "border-green-500 bg-green-500/10 shadow-lg shadow-green-500/10"
                    : "border-border/40 bg-background/40 hover:border-green-500/40"
                }`}
              >
                <Icon className={`h-6 w-6 mx-auto mb-2 ${active ? "text-green-400" : "text-foreground/50"}`} />
                <p className={`text-sm font-semibold ${active ? "text-green-400" : "text-foreground/80"}`}>{label}</p>
                <p className="text-xs text-foreground/50 mt-0.5">{desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ───────── Discount Codes ───────── */}
      <div className="rounded-2xl border border-pink-500/20 bg-gradient-to-br from-pink-500/[0.06] to-transparent p-5 md:p-6">
        <DiscountCodesSection itemType="event" itemId={editingEvent?.id} />
      </div>

      {/* ───────── Guest List ───────── */}
      <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/[0.06] to-transparent p-5 md:p-6">
        <GuestListSection eventId={editingEvent?.id} />
      </div>

      {/* ───────── RRP ───────── */}
      <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.06] to-transparent p-5 md:p-6">
        <RrpAssignmentSection eventId={editingEvent?.id} />
      </div>

      {/* ───────── Images ───────── */}
      <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.06] to-transparent p-5 md:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/15">
            <ImageIcon className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Images</h3>
            <p className="text-xs text-foreground/50">Cover flyer (vertical) and optional landscape banner</p>
          </div>
        </div>

        {/* Cover Image (Flyer - Vertical 17:25) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-foreground/70 font-semibold">Cover Flyer</span>
            <span className="text-xs text-foreground/40">17:25 vertical</span>
          </div>

          {formData.imagePreview ? (
            <div className="space-y-4">
              <div className="relative w-full aspect-[17/25] rounded-xl overflow-hidden border-2 border-accent/30">
                <img
                  src={formData.imagePreview}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
                {!formData.imageUrl && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="text-center">
                      <Loader2 className="h-10 w-10 animate-spin text-white mx-auto mb-3" />
                      <p className="text-white font-medium">Uploading image...</p>
                    </div>
                  </div>
                )}
                {formData.imageUrl && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-green-500 text-white border-0 shadow-lg">
                      ✓ Upload complete
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
                  disabled={!formData.imageUrl}
                  className="flex-1"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Change Image
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, imageUrl: "", imagePreview: "" })}
                  className="text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  <X className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="relative border-2 border-dashed border-accent/30 rounded-xl p-10 bg-gradient-to-br from-accent/5 to-transparent hover:border-accent/50 transition-all duration-300 courser-pointer group"
              onClick={() => imageInputRef.current?.click()}
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 mb-4 border border-accent/20 group-hover:scale-110 transition-transform duration-300">
                  <Upload className="h-10 w-10 text-accent" />
                </div>
                <p className="font-semibold text-foreground mb-2">
                  Drag an image here
                </p>
                <p className="text-sm text-foreground/60 mb-6">
                  or click to select (max. 10MB)
                </p>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    imageInputRef.current?.click();
                  }}
                  disabled={uploading}
                  className="bg-gradient-to-r from-[#FA3698] to-purple-600 hover:from-[#FA3698]/90 hover:to-purple-600/90 text-white border-0 shadow-lg shadow-[#FA3698]/25"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Select Image
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

        {/* Cover Image Cropper Modal — forces flyer ratio (17:25 = 680×1012px) */}
        <ImageCropperModal
          imageSrc={cropSrc}
          aspect={17 / 25}
          label="Crop Cover (Flyer format)"
          onCropComplete={handleCropComplete}
          onClose={() => setCropSrc(null)}
        />

        {/* Banner (Horizontal 16:9) */}
        <div className="space-y-3 pt-4 border-t border-border/30">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-foreground/70 font-semibold">Landscape Banner</span>
            <span className="text-xs text-foreground/40">16:9 · optional</span>
          </div>

          {formData.bannerPreview ? (
            <div className="space-y-4">
              <div className="relative group rounded-xl overflow-hidden border-2 border-blue-500/30">
                <img
                  src={formData.bannerPreview}
                  alt="Banner preview"
                  className="w-full h-48 object-cover"
                />
                {!formData.bannerUrl && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="text-center">
                      <Loader2 className="h-10 w-10 animate-spin text-white mx-auto mb-3" />
                      <p className="text-white font-medium">Uploading...nner...</p>
                    </div>
                  </div>
                )}
                {formData.bannerUrl && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-blue-500 text-white border-0 shadow-lg">
                      ✓ Banner uploaded
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={!formData.bannerUrl}
                  className="flex-1"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Change Banner
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, bannerUrl: "", bannerPreview: "" })}
                  className="text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  <X className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="relative border-2 border-dashed border-blue-500/30 rounded-xl p-8 bg-gradient-to-br from-blue-500/5 to-transparent hover:border-blue-500/50 transition-all duration-300 courser-pointer group"
              onClick={() => bannerInputRef.current?.click()}
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 mb-3 border border-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                  <Upload className="h-8 w-8 text-blue-500" />
                </div>
                <p className="font-semibold text-foreground mb-1">
                  Upload landscape banner
                </p>
                <p className="text-xs text-foreground/50 mb-4">
                  Landscape format (16:9) • Max. 10MB
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    bannerInputRef.current?.click();
                  }}
                  disabled={uploadingBanner}
                  className="border-blue-500/50 text-blue-500 hover:bg-blue-500/10"
                  size="sm"
                >
                  {uploadingBanner ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Select Banner
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleBannerSelect(e.target.files[0]);
                e.target.value = "";
              }
            }}
            className="hidden"
          />
        </div>

        {/* Banner Cropper Modal (Landscape 16:9) */}
        <ImageCropperModal
          imageSrc={cropSrcBanner}
          aspect={16 / 9}
          label="Crop Banner (Landscape)"
          onCropComplete={handleBannerCropComplete}
          onClose={() => setCropSrcBanner(null)}
        />
      </div>

      {/* ───────── Sticky Action Bar ───────── */}
      <div className="sticky bottom-0 -mx-4 md:-mx-0 bg-background/95 backdrop-blur-md border-t border-border/40 px-4 py-4 mt-2 flex flex-col sm:flex-row gap-3 items-center sm:justify-between z-10">
        <p className="text-xs text-foreground/40 order-last sm:order-first">
          <span className="text-[#FA3698]">*</span> Required fields
        </p>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            className="h-11 px-5"
          >
            <X className="h-4 w-4 mr-2" /> Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCreateEvent}
            disabled={createMutation.isPending || updateMutation.isPending || uploading || uploadingBanner}
            className="btn-vibrant flex-1 sm:flex-none h-11 px-8 text-sm font-semibold shadow-lg"
          >
            {(createMutation.isPending || updateMutation.isPending) ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {editingEvent ? "Updating…" : "Creating…"}</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" /> {editingEvent ? "Update Event" : "Publish Event"}</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
