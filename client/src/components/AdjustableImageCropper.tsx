import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2, Upload, X, Check, Image as ImageIcon, ZoomIn, ZoomOut, Move } from "lucide-react";
import { toast } from "sonner";

interface AdjustableImageCropperProps {
  open: boolean;
  onClose: () => void;
  onImageReady: (dataUrl: string) => void;
  targetWidth?: number;
  targetHeight?: number;
  title?: string;
  description?: string;
}

/**
 * Adjustable Image Cropper
 *
 * Allows user to:
 * - Upload any image size
 * - Drag to reposition the image
 * - Zoom in/out with slider
 * - Select the perfect area
 * - Auto-outputs to exact size (e.g. 1080×1080) with high quality
 */
export default function AdjustableImageCropper({
  open,
  onClose,
  onImageReady,
  targetWidth = 1080,
  targetHeight = 1080,
  title = "Ajustar Image",
  description = "Arrastra y ajusta el zoom para select la mejor área",
}: AdjustableImageCropperProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Image positioning and zoom
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [originalSize, setOriginalSize] = useState<{ width: number; height: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setOriginalSize({ width: img.width, height: img.height });
        setImageSrc(event.target?.result as string);

        // Calculate initial zoom to fit image in preview area
        const previewSize = 400; // Preview container size
        const imgAspect = img.width / img.height;
        const targetAspect = targetWidth / targetHeight;

        let initialZoom = 1;
        if (imgAspect > targetAspect) {
          // Wider image - fit by height
          initialZoom = previewSize / img.height;
        } else {
          // Taller image - fit by width
          initialZoom = previewSize / img.width;
        }

        setZoom(initialZoom);
        setPosition({ x: 0, y: 0 });
        setIsProcessing(false);

        toast.success("Image loaded - now adjust position and zoom");
      };

      img.onerror = () => {
        toast.error("Error loading image");
        setIsProcessing(false);
      };

      img.src = event.target?.result as string;
      imageRef.current = img;
    };

    reader.onerror = () => {
      toast.error("Error reading file");
      setIsProcessing(false);
    };

    reader.readAsDataURL(file);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add/remove event listeners for dragging
  useState(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  });

  const handleZoomChange = (value: number[]) => {
    setZoom(value[0]);
  };

  const handleApply = async () => {
    if (!imageSrc || !imageRef.current) return;

    setIsProcessing(true);

    try {
      const img = imageRef.current;

      // Create canvas with exact target dimensions
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d")!;

      // Enable high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Calculate the crop area based on current zoom and position
      const previewSize = 400;
      const scaledWidth = img.width * zoom;
      const scaledHeight = img.height * zoom;

      // Convert preview position to source image coordinates
      const centerOffsetX = (previewSize - scaledWidth) / 2 + position.x;
      const centerOffsetY = (previewSize - scaledHeight) / 2 + position.y;

      // Calculate source crop (what part of original image to use)
      const sourceX = Math.max(0, -centerOffsetX / zoom);
      const sourceY = Math.max(0, -centerOffsetY / zoom);
      const sourceWidth = Math.min(img.width - sourceX, previewSize / zoom);
      const sourceHeight = Math.min(img.height - sourceY, previewSize / zoom);

      // Draw the selected area to target size
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, targetWidth, targetHeight
      );

      // Convert to high-quality JPEG
      const resultDataUrl = canvas.toDataURL("image/jpeg", 0.95);

      onImageReady(resultDataUrl);
      toast.success("Image adjusted perfectly!");
      handleClose();
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Error processing image");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setImageSrc(null);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setOriginalSize(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setImageSrc(null);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setOriginalSize(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-accent" />
            {title}
          </DialogTitle>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* File input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!imageSrc && !isProcessing ? (
            // Upload area
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-12 flex flex-col items-center justify-center courser-pointer hover:border-accent hover:bg-accent/5 transition-all bg-card/50"
            >
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-1">Click para subir image</p>
              <p className="text-xs text-muted-foreground text-center">
                Cualquier tamyear • Se ajustará a {targetWidth}×{targetHeight}px<br />
                Podrás mover y hacer zoom after
              </p>
            </div>
          ) : isProcessing ? (
            // Processing state
            <div className="border-2 border-accent/30 rounded-lg p-12 flex flex-col items-center justify-center bg-card/50">
              <Loader2 className="h-12 w-12 text-accent animate-spin mb-4" />
              <p className="text-sm font-medium">Processing image...</p>
            </div>
          ) : (
            // Editor area
            <div className="space-y-4">
              {/* Preview/Editor Container */}
              <div className="relative border-2 border-accent/30 rounded-lg overflow-hidden bg-gradient-to-br from-black/80 to-black/90">
                {/* Crop area (fixed square in center) */}
                <div
                  className="relative mx-auto bg-black/50"
                  style={{
                    width: "400px",
                    height: "400px",
                    position: "relative",
                  }}
                >
                  {/* Image container (draggable) */}
                  <div
                    className="absolute inset-0 flex items-center justify-center courser-move select-none"
                    onMouseDown={handleMouseDown}
                    style={{
                      transform: `translate(${position.x}px, ${position.y}px)`,
                    }}
                  >
                    {imageSrc && (
                      <img
                        src={imageSrc}
                        alt="Ajustar"
                        className="pointer-events-none"
                        style={{
                          transform: `scale(${zoom})`,
                          transformOrigin: "center center",
                          maxWidth: "none",
                        }}
                      />
                    )}
                  </div>

                  {/* Crop overlay (shows square frame) */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Darkened areas outside crop */}
                    <div className="absolute inset-0 border-4 border-accent/50 rounded-lg"></div>
                  </div>

                  {/* Instructions overlay */}
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
                    <div className="bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 text-xs text-white/90">
                      <Move className="h-3 w-3" />
                      Arrastra para mover
                    </div>
                  </div>
                </div>

                {/* Remove button */}
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 shadow-lg z-10"
                  onClick={handleRemove}
                >
                  <X className="h-4 w-4 mr-1" />
                  Quitar
                </Button>
              </div>

              {/* Zoom control */}
              <div className="bg-card/50 border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <ZoomIn className="h-4 w-4 text-accent" />
                    Zoom
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {(zoom * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <ZoomOut className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <Slider
                    value={[zoom]}
                    onValueChange={handleZoomChange}
                    min={0.1}
                    max={3}
                    step={0.05}
                    className="flex-1"
                  />
                  <ZoomIn className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              </div>

              {/* Info */}
              {originalSize && (
                <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">
                    Original: {originalSize.width}×{originalSize.height}px →
                    Resultado: {targetWidth}×{targetHeight}px
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleApply}
            disabled={!imageSrc || isProcessing}
            className="bg-accent hover:bg-accent/90"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Usar Image
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
