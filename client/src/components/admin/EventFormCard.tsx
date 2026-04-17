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
      toast.success("✅ Evento actualizado exitosamente");
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
      // Generate unique filename: event-{id}-{timestamp}.jpg
      const timestamp = Date.now();
      const uniqueFileName = editingEvent?.id
        ? `event-${editingEvent.id}-${timestamp}.jpg`
        : `event-new-${timestamp}.jpg`;

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
      toast.error(`La imagen es demasiado grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo 10MB.`);
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
      const timestamp = Date.now();
      const uniqueFileName = editingEvent?.id
        ? `event-banner-${editingEvent.id}-${timestamp}.jpg`
        : `event-banner-new-${timestamp}.jpg`;

      const result = await uploadFileMutation.mutateAsync({
        fileBase64: croppedDataUrl,
        fileName: uniqueFileName,
        mimeType: "image/jpeg",
        folder: "events",
      });
      setFormData(prev => ({ ...prev, bannerUrl: result.url }));
      toast.success("✅ Banner subido exitosamente");
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
    <Card className="border-border/50 bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-sm shadow-xl">
      <CardHeader className="space-y-3 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
            <Calendar className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <CardTitle className="text-2xl gradient-text">
              {editingEvent ? "Editar Evento" : t("admin.events.createNewEvent")}
            </CardTitle>
            <CardDescription className="text-foreground/60 mt-1">
              {editingEvent ? "Actualiza la información del evento" : t("admin.events.createDescription")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic Information Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-accent" />
            <h3 className="font-semibold text-foreground">Información Básica</h3>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-title" className="text-foreground/80 flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-accent" />
              Título del Evento *
            </Label>
            <Input
              id="event-title"
              placeholder="Ej: Salsa Night - Festival de Verano"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-background/50 border-border/50 focus:border-accent transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-venue" className="text-foreground/80 flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-accent" />
                Lugar *
              </Label>
              <Input
                id="event-venue"
                placeholder="Ej: Teatro Principal"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="bg-background/50 border-border/50 focus:border-accent transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-city" className="text-foreground/80 flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-accent" />
                Ciudad
              </Label>
              <Input
                id="event-city"
                placeholder="Ej: Madrid"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="bg-background/50 border-border/50 focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-description" className="text-foreground/80">
              Descripción del Evento
            </Label>
            <Textarea
              id="event-description"
              placeholder="Describe tu evento: qué tipo de música, nivel de baile, ambiente, etc."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="bg-background/50 border-border/50 focus:border-accent transition-colors resize-none"
            />
          </div>
        </div>

        <Separator className="bg-border/50" />

        {/* Date & Tickets Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-accent" />
            <h3 className="font-semibold text-foreground">Fecha y Entradas</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="event-date" className="text-foreground/80">
                Fecha y Hora *
              </Label>
              <Input
                id="event-date"
                type="datetime-local"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                className="bg-background/50 border-border/50 focus:border-accent transition-colors"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-price" className="text-foreground/80 flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5 text-accent" />
                Precio de Entrada *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50">£</span>
                <Input
                  id="event-price"
                  type="number"
                  placeholder="25.00"
                  value={formData.ticketPrice}
                  onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value })}
                  className="bg-background/50 border-border/50 focus:border-accent transition-colors pl-8"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-max-tickets" className="text-foreground/80 flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-accent" />
                Máx. Entradas
              </Label>
              <Input
                id="event-max-tickets"
                type="number"
                placeholder="100"
                value={formData.maxTickets}
                onChange={(e) => setFormData({ ...formData, maxTickets: e.target.value })}
                className="bg-background/50 border-border/50 focus:border-accent transition-colors"
                min="1"
              />
            </div>
          </div>
        </div>

        <Separator className="bg-border/50" />

        {/* Payment Method Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-4 w-4 text-accent" />
            <h3 className="font-semibold text-foreground">Método de Pago</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, paymentMethod: "online" })}
              className={`p-4 rounded-xl border-2 transition-all ${
                formData.paymentMethod === "online"
                  ? "border-accent bg-accent/10"
                  : "border-border/50 bg-background/30 hover:border-accent/50"
              }`}
            >
              <CreditCard className={`h-5 w-5 mx-auto mb-2 ${formData.paymentMethod === "online" ? "text-accent" : "text-foreground/50"}`} />
              <p className={`text-sm font-medium ${formData.paymentMethod === "online" ? "text-accent" : "text-foreground/70"}`}>
                Online
              </p>
              <p className="text-xs text-foreground/50 mt-1">Pago en línea</p>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, paymentMethod: "cash" })}
              className={`p-4 rounded-xl border-2 transition-all ${
                formData.paymentMethod === "cash"
                  ? "border-accent bg-accent/10"
                  : "border-border/50 bg-background/30 hover:border-accent/50"
              }`}
            >
              <Banknote className={`h-5 w-5 mx-auto mb-2 ${formData.paymentMethod === "cash" ? "text-accent" : "text-foreground/50"}`} />
              <p className={`text-sm font-medium ${formData.paymentMethod === "cash" ? "text-accent" : "text-foreground/70"}`}>
                Efectivo
              </p>
              <p className="text-xs text-foreground/50 mt-1">Pago en puerta</p>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, paymentMethod: "both" })}
              className={`p-4 rounded-xl border-2 transition-all ${
                formData.paymentMethod === "both"
                  ? "border-accent bg-accent/10"
                  : "border-border/50 bg-background/30 hover:border-accent/50"
              }`}
            >
              <div className="flex items-center justify-center gap-1 mb-2">
                <CreditCard className={`h-4 w-4 ${formData.paymentMethod === "both" ? "text-accent" : "text-foreground/50"}`} />
                <Banknote className={`h-4 w-4 ${formData.paymentMethod === "both" ? "text-accent" : "text-foreground/50"}`} />
              </div>
              <p className={`text-sm font-medium ${formData.paymentMethod === "both" ? "text-accent" : "text-foreground/70"}`}>
                Ambos
              </p>
              <p className="text-xs text-foreground/50 mt-1">Online y efectivo</p>
            </button>
          </div>

          {/* Low Ticket Alert Option */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-background/30 border border-border/50">
            <input
              type="checkbox"
              id="show-low-ticket-alert"
              checked={formData.showLowTicketAlert}
              onChange={(e) => setFormData({ ...formData, showLowTicketAlert: e.target.checked })}
              className="w-4 h-4 text-accent bg-background border-border/50 rounded focus:ring-accent focus:ring-2"
            />
            <label htmlFor="show-low-ticket-alert" className="text-sm text-foreground/80 cursor-pointer">
              Mostrar alerta "Solo quedan X entradas" cuando queden ≤20 tickets
            </label>
          </div>
        </div>

        <Separator className="bg-border/50" />

        {/* Discount Codes Section */}
        <DiscountCodesSection itemType="event" itemId={editingEvent?.id} />

        <Separator className="bg-border/50" />

        {/* Guest List Section (only for existing events) */}
        <GuestListSection eventId={editingEvent?.id} />

        <Separator className="bg-border/50" />

        {/* Cover Image Upload Section (Flyer/Portada - Vertical 17:25) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ImageIcon className="h-4 w-4 text-accent" />
            <h3 className="font-semibold text-foreground">Portada del Evento (Flyer)</h3>
          </div>
          <p className="text-xs text-foreground/50 -mt-2">Imagen vertical para las tarjetas de eventos (1275×1875px, ratio 17:25). Se recorta automáticamente.</p>

          {formData.imagePreview ? (
            <div className="space-y-4">
              <div className="relative w-full aspect-[17/25] rounded-xl overflow-hidden border-2 border-accent/30">
                <img
                  src={formData.imagePreview}
                  alt="Preview portada"
                  className="w-full h-full object-cover"
                />
                {!formData.imageUrl && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="text-center">
                      <Loader2 className="h-10 w-10 animate-spin text-white mx-auto mb-3" />
                      <p className="text-white font-medium">Subiendo imagen...</p>
                    </div>
                  </div>
                )}
                {formData.imageUrl && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-green-500 text-white border-0 shadow-lg">
                      ✓ Subida completada
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
              className="relative border-2 border-dashed border-accent/30 rounded-xl p-10 bg-gradient-to-br from-accent/5 to-transparent hover:border-accent/50 transition-all duration-300 cursor-pointer group"
              onClick={() => imageInputRef.current?.click()}
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 mb-4 border border-accent/20 group-hover:scale-110 transition-transform duration-300">
                  <Upload className="h-10 w-10 text-accent" />
                </div>
                <p className="font-semibold text-foreground mb-2">
                  Arrastra una imagen aquí
                </p>
                <p className="text-sm text-foreground/60 mb-6">
                  o haz clic para seleccionar (máx. 10MB)
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
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
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

        {/* Cover Image Cropper Modal — forces flyer ratio (17:25 = 680×1012px) */}
        <ImageCropperModal
          imageSrc={cropSrc}
          aspect={17 / 25}
          label="Recortar Portada (Formato Flyer)"
          onCropComplete={handleCropComplete}
          onClose={() => setCropSrc(null)}
        />

        <Separator className="bg-border/50" />

        {/* Banner Image Upload Section (Horizontal 16:9) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ImageIcon className="h-4 w-4 text-blue-500" />
            <h3 className="font-semibold text-foreground">Banner del Evento (Horizontal)</h3>
          </div>
          <p className="text-xs text-foreground/50 -mt-2">Imagen horizontal que se muestra en la página de detalle del evento (formato panorámico 16:9)</p>

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
                      <p className="text-white font-medium">Subiendo banner...</p>
                    </div>
                  </div>
                )}
                {formData.bannerUrl && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-blue-500 text-white border-0 shadow-lg">
                      ✓ Banner subido
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
                  Cambiar Banner
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, bannerUrl: "", bannerPreview: "" })}
                  className="text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  <X className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="relative border-2 border-dashed border-blue-500/30 rounded-xl p-8 bg-gradient-to-br from-blue-500/5 to-transparent hover:border-blue-500/50 transition-all duration-300 cursor-pointer group"
              onClick={() => bannerInputRef.current?.click()}
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 mb-3 border border-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                  <Upload className="h-8 w-8 text-blue-500" />
                </div>
                <p className="font-semibold text-foreground mb-1">
                  Subir Banner Horizontal
                </p>
                <p className="text-xs text-foreground/50 mb-4">
                  Formato panorámico (16:9) • Máx. 10MB
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
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Seleccionar Banner
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
          label="Recortar Banner (Horizontal)"
          onCropComplete={handleBannerCropComplete}
          onClose={() => setCropSrcBanner(null)}
        />

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            onClick={handleCreateEvent}
            disabled={createMutation.isPending || updateMutation.isPending || uploading || uploadingBanner}
            className="btn-vibrant flex-1 h-12 text-base font-semibold shadow-lg"
          >
            {(createMutation.isPending || updateMutation.isPending) ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {editingEvent ? "Actualizando..." : "Creando Evento..."}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                {editingEvent ? "Actualizar Evento" : "Crear Evento"}
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
