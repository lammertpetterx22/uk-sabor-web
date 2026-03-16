import { useState, useCallback, useRef, useEffect } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Upload,
  X,
  Check,
  Image as ImageIcon,
  Info,
  Lightbulb,
  User,
  BookOpen,
  Calendar,
  GraduationCap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

const getRadianAngle = (degreeValue: number): number => {
  return (degreeValue * Math.PI) / 180;
};

const rotateSize = (width: number, height: number, rotation: number) => {
  const rotRad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
};

/**
 * High-quality image crop function with format options
 * Supports JPEG and WebP export
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  flip = { horizontal: false, vertical: false },
  format: "jpeg" | "webp" = "jpeg",
  quality = 0.95
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  const rotRad = getRadianAngle(rotation);
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d");

  if (!croppedCtx) {
    return null;
  }

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    croppedCanvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      format === "webp" ? "image/webp" : "image/jpeg",
      quality
    );
  });
}

// ============================================================================
// PRESET SYSTEM
// ============================================================================

export type CropCategory = "profile" | "teacher_cover" | "course_card" | "event_banner" | "free";

export interface CropPreset {
  id: CropCategory;
  label: string;
  aspectRatio: number | null;
  recommendedWidth: number;
  recommendedHeight: number;
  icon: React.ReactNode;
  color: string;
  description: string;
  proTip: string;
}

export const CROP_PRESETS: CropPreset[] = [
  {
    id: "profile",
    label: "Profile Picture",
    aspectRatio: 1,
    recommendedWidth: 500,
    recommendedHeight: 500,
    icon: <User className="w-4 h-4" />,
    color: "bg-blue-500",
    description: "Square format perfect for avatars and profile photos",
    proTip: "Use a close-up photo with your face centered for best results"
  },
  {
    id: "teacher_cover",
    label: "Teacher Cover",
    aspectRatio: 16 / 9,
    recommendedWidth: 1920,
    recommendedHeight: 1080,
    icon: <GraduationCap className="w-4 h-4" />,
    color: "bg-purple-500",
    description: "Widescreen format for teacher profile banners",
    proTip: "Recommended: 1920×1080px for crisp, professional covers"
  },
  {
    id: "course_card",
    label: "Course Card",
    aspectRatio: 4 / 3,
    recommendedWidth: 800,
    recommendedHeight: 600,
    icon: <BookOpen className="w-4 h-4" />,
    color: "bg-green-500",
    description: "Standard photo format for course thumbnails",
    proTip: "Recommended: 800×600px - Perfect for course listings"
  },
  {
    id: "event_banner",
    label: "Event Banner",
    aspectRatio: 21 / 9,
    recommendedWidth: 2560,
    recommendedHeight: 1080,
    icon: <Calendar className="w-4 h-4" />,
    color: "bg-orange-500",
    description: "Ultra-wide format for event headers",
    proTip: "Recommended: 2560×1080px - Ultra-wide for stunning event banners"
  },
  {
    id: "free",
    label: "Free Crop",
    aspectRatio: null,
    recommendedWidth: 1200,
    recommendedHeight: 1200,
    icon: <ImageIcon className="w-4 h-4" />,
    color: "bg-gray-500",
    description: "No restrictions - crop to any size",
    proTip: "Total freedom - crop to any dimension you need"
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface ImageCropperProProps {
  onCropComplete: (croppedImageBlob: Blob, croppedImageUrl: string, preset: CropPreset) => void;
  onCancel?: () => void;
  defaultPreset?: CropCategory;
  className?: string;
  showRecommendations?: boolean;
  exportFormat?: "jpeg" | "webp";
  exportQuality?: number;
}

export default function ImageCropperPro({
  onCropComplete,
  onCancel,
  defaultPreset = "teacher_cover",
  className,
  showRecommendations = true,
  exportFormat = "jpeg",
  exportQuality = 0.95,
}: ImageCropperProProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<CropPreset>(
    CROP_PRESETS.find(p => p.id === defaultPreset) || CROP_PRESETS[1]
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-center and fit when preset changes
  useEffect(() => {
    if (imageSrc) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    }
  }, [selectedPreset, imageSrc]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("File is too large. Maximum size is 10MB.");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file.");
        return;
      }

      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result as string);
      });
      reader.readAsDataURL(file);
    }
  }, []);

  const onCropCompleteCallback = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleCropAndSave = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedImageBlob = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
        { horizontal: false, vertical: false },
        exportFormat,
        exportQuality
      );

      if (croppedImageBlob) {
        const croppedImageUrl = URL.createObjectURL(croppedImageBlob);
        onCropComplete(croppedImageBlob, croppedImageUrl, selectedPreset);
      }
    } catch (e) {
      logger.error('Error cropping image', e);
      alert("Failed to crop image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [imageSrc, croppedAreaPixels, rotation, onCropComplete, selectedPreset, exportFormat, exportQuality]);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handleReset = useCallback(() => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return (
    <Card className={cn("w-full shadow-2xl glass-dark", className)}>
      <CardHeader className="border-b brand-gradient-bg">
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-white/10">
            <ImageIcon className="w-5 h-5 text-white" />
          </div>
          Professional Image Cropper
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* File Input (Hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="hidden"
        />

        {!imageSrc ? (
          // ====================================================================
          // UPLOAD AREA
          // ====================================================================
          <div className="space-y-6">
            {/* Upload Zone - Neutral Placeholder */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative border-2 border-dashed border-border hover:border-accent rounded-xl p-12 text-center cursor-pointer transition-all hover:bg-accent/5 group"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                  <User className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Click to upload picture</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose an image from your device
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports: JPG, PNG, WEBP (max 10MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Preset Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Info className="w-4 h-4" />
                Select Image Purpose
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {CROP_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPreset(preset)}
                    className={cn(
                      "p-4 rounded-lg border-2 text-left transition-all hover:shadow-lg",
                      selectedPreset.id === preset.id
                        ? "border-accent bg-accent/10 shadow-lg"
                        : "border-border hover:border-accent/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-lg text-white", preset.color)}>
                        {preset.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm mb-1">{preset.label}</div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {preset.description}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {preset.aspectRatio
                            ? `${preset.recommendedWidth}×${preset.recommendedHeight}px`
                            : "Any size"}
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Size Recommendation Table */}
            {showRecommendations && (
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  Recommended Image Sizes
                </Label>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold">Category</th>
                        <th className="px-4 py-2 text-left font-semibold">Aspect Ratio</th>
                        <th className="px-4 py-2 text-left font-semibold">Recommended Resolution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {CROP_PRESETS.filter(p => p.id !== "free").map((preset) => (
                        <tr
                          key={preset.id}
                          className={cn(
                            "hover:bg-muted/30 transition-colors",
                            selectedPreset.id === preset.id && "bg-accent/5"
                          )}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={cn("p-1.5 rounded text-white", preset.color)}>
                                {preset.icon}
                              </div>
                              <span className="font-medium">{preset.label}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {preset.aspectRatio === 1 && "1:1"}
                            {preset.aspectRatio === 16/9 && "16:9"}
                            {preset.aspectRatio === 4/3 && "4:3"}
                            {preset.aspectRatio === 21/9 && "21:9"}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {preset.recommendedWidth} × {preset.recommendedHeight} px
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          // ====================================================================
          // CROPPER AREA
          // ====================================================================
          <div className="space-y-6">
            {/* Current Preset Info */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
              <div className={cn("p-2 rounded-lg text-white flex-shrink-0", selectedPreset.color)}>
                {selectedPreset.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold mb-1">{selectedPreset.label}</div>
                <div className="text-sm text-muted-foreground mb-2">
                  {selectedPreset.description}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Lightbulb className="w-3 h-3 text-yellow-500" />
                  <span className="text-muted-foreground">{selectedPreset.proTip}</span>
                </div>
              </div>
            </div>

            {/* Cropper Container */}
            <div className="relative w-full bg-black/90 rounded-xl overflow-hidden" style={{ height: "400px" }}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={selectedPreset.aspectRatio ?? undefined}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropCompleteCallback}
                style={{
                  containerStyle: {
                    borderRadius: "0.75rem",
                  },
                }}
              />
            </div>

            {/* Controls */}
            <div className="space-y-4">
              {/* Preset Switcher */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Switch Format</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {CROP_PRESETS.map((preset) => (
                    <Button
                      key={preset.id}
                      type="button"
                      size="sm"
                      variant={selectedPreset.id === preset.id ? "default" : "outline"}
                      onClick={() => setSelectedPreset(preset)}
                      className="text-xs flex items-center gap-1.5 justify-start"
                    >
                      {preset.icon}
                      <span className="truncate">{preset.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Zoom Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <ZoomIn className="w-4 h-4" />
                    Zoom
                  </Label>
                  <span className="text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <ZoomOut className="w-4 h-4 text-muted-foreground" />
                  <Slider
                    value={[zoom]}
                    onValueChange={(value) => setZoom(value[0])}
                    min={1}
                    max={3}
                    step={0.1}
                    className="flex-1"
                  />
                  <ZoomIn className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              {/* Rotation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <RotateCw className="w-4 h-4" />
                    Rotation
                  </Label>
                  <span className="text-xs text-muted-foreground">{rotation}°</span>
                </div>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[rotation]}
                    onValueChange={(value) => setRotation(value[0])}
                    min={0}
                    max={360}
                    step={1}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleRotate}
                    className="flex items-center gap-1"
                  >
                    <RotateCw className="w-3 h-3" />
                    90°
                  </Button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                Change Image
              </Button>
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    handleReset();
                    onCancel();
                  }}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              )}
              <Button
                type="button"
                onClick={handleCropAndSave}
                disabled={isProcessing}
                className="flex-1 btn-vibrant flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Apply Crop
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
