import { useState, useCallback, useRef } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Upload,
  X,
  Check,
  Image as ImageIcon,
  Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";

// Utility function to create image from URL
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

// Utility function to get radians from degrees
const getRadianAngle = (degreeValue: number): number => {
  return (degreeValue * Math.PI) / 180;
};

// Utility function to rotate size
const rotateSize = (width: number, height: number, rotation: number) => {
  const rotRad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
};

/**
 * High-quality image crop function that uses a hidden canvas
 * Returns the cropped image as a Blob
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  flip = { horizontal: false, vertical: false }
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  const rotRad = getRadianAngle(rotation);

  // Calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // Set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  // Draw rotated image
  ctx.drawImage(image, 0, 0);

  // Create a new canvas to extract the crop
  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d");

  if (!croppedCtx) {
    return null;
  }

  // Set the size of the cropped canvas
  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  // Draw the cropped image onto the new canvas
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

  // Return as blob with high quality
  return new Promise((resolve) => {
    croppedCanvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      "image/jpeg",
      0.95 // High quality (0-1)
    );
  });
}

// Aspect ratio presets
type AspectRatioPreset = {
  label: string;
  value: number | null; // null = free crop
  icon?: string;
};

const ASPECT_RATIOS: AspectRatioPreset[] = [
  { label: "Free", value: null, icon: "🎨" },
  { label: "Cover 16:9", value: 16 / 9, icon: "📱" },
  { label: "Cover 3:1", value: 3 / 1, icon: "🖼️" },
  { label: "Square 1:1", value: 1, icon: "⬛" },
  { label: "Portrait 9:16", value: 9 / 16, icon: "📲" },
];

interface ImageCropperProps {
  onCropComplete: (croppedImageBlob: Blob, croppedImageUrl: string) => void;
  onCancel?: () => void;
  aspectRatioPreset?: number | null;
  className?: string;
}

export default function ImageCropper({
  onCropComplete,
  onCancel,
  aspectRatioPreset = 16 / 9,
  className,
}: ImageCropperProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [aspect, setAspect] = useState<number | undefined>(
    aspectRatioPreset ?? undefined
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result as string);
      });
      reader.readAsDataURL(file);
    }
  }, []);

  // Called when crop area changes
  const onCropCompleteCallback = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  // Process and export the cropped image
  const handleCropAndSave = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedImageBlob = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      );

      if (croppedImageBlob) {
        const croppedImageUrl = URL.createObjectURL(croppedImageBlob);
        onCropComplete(croppedImageBlob, croppedImageUrl);
      }
    } catch (e) {
      console.error("Error cropping image:", e);
    } finally {
      setIsProcessing(false);
    }
  }, [imageSrc, croppedAreaPixels, rotation, onCropComplete]);

  // Rotate image by 90 degrees
  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  // Reset to initial state
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
          // Upload Area
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative border-2 border-dashed border-border hover:border-accent rounded-xl p-12 text-center cursor-pointer transition-all hover:bg-accent/5 group"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-colors">
                  <Upload className="w-12 h-12 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Upload an Image</h3>
                  <p className="text-sm text-muted-foreground">
                    Click to browse or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports: JPG, PNG, WEBP (max 10MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Aspect Ratio Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Choose Aspect Ratio</Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <Button
                    key={ratio.label}
                    type="button"
                    variant={aspect === ratio.value ? "default" : "outline"}
                    onClick={() => setAspect(ratio.value ?? undefined)}
                    className="h-auto py-3 flex flex-col items-center gap-1"
                  >
                    <span className="text-xl">{ratio.icon}</span>
                    <span className="text-xs font-medium">{ratio.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Cropper Area
          <div className="space-y-6">
            {/* Cropper Container */}
            <div className="relative w-full bg-black/90 rounded-xl overflow-hidden" style={{ height: "400px" }}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={aspect}
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
              {/* Aspect Ratio Switcher */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Maximize2 className="w-4 h-4" />
                  Aspect Ratio
                </Label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {ASPECT_RATIOS.map((ratio) => (
                    <Button
                      key={ratio.label}
                      type="button"
                      size="sm"
                      variant={aspect === ratio.value ? "default" : "outline"}
                      onClick={() => setAspect(ratio.value ?? undefined)}
                      className="text-xs"
                    >
                      {ratio.icon} {ratio.label}
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
