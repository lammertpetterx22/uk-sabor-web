import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, Check, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface AutoResizeImageUploadProps {
  open: boolean;
  onClose: () => void;
  onImageReady: (dataUrl: string) => void;
  targetWidth?: number; // e.g. 1080 for instructors
  targetHeight?: number; // e.g. 1080 for square
  title?: string;
  description?: string;
}

/**
 * Simple Auto-Resize Image Upload
 *
 * Takes ANY image size (e.g. 3240x3203) and automatically resizes it
 * to the exact target size (e.g. 1080x1080) without losing quality.
 *
 * Uses high-quality canvas scaling with proper aspect ratio handling.
 */
export default function AutoResizeImageUpload({
  open,
  onClose,
  onImageReady,
  targetWidth = 1080,
  targetHeight = 1080,
  title = "Upload Image",
  description = "Upload any image - it will auto-resize perfectly",
}: AutoResizeImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalSize, setOriginalSize] = useState<{ width: number; height: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        // Store original dimensions
        setOriginalSize({ width: img.width, height: img.height });

        // Create canvas with target dimensions
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d")!;

        // Enable high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Smart center-crop (like Instagram)
        // Calculate dimensions to COVER the target area (no white background)
        const imgAspect = img.width / img.height;
        const targetAspect = targetWidth / targetHeight;

        let sourceX, sourceY, sourceWidth, sourceHeight;

        if (imgAspect > targetAspect) {
          // Image is wider - crop sides
          sourceHeight = img.height;
          sourceWidth = img.height * targetAspect;
          sourceX = (img.width - sourceWidth) / 2;
          sourceY = 0;
        } else {
          // Image is taller - crop top/bottom
          sourceWidth = img.width;
          sourceHeight = img.width / targetAspect;
          sourceX = 0;
          sourceY = (img.height - sourceHeight) / 2;
        }

        // Draw the cropped portion to fill entire canvas (no white background!)
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,  // Source crop
          0, 0, targetWidth, targetHeight               // Destination full canvas
        );

        // Convert to high-quality JPEG (95% quality to preserve detail)
        const resizedDataUrl = canvas.toDataURL("image/jpeg", 0.95);
        setPreview(resizedDataUrl);
        setIsProcessing(false);

        toast.success(`Image auto-resized from ${img.width}×${img.height} to ${targetWidth}×${targetHeight}`);
      };

      img.onerror = () => {
        toast.error("Failed to load image");
        setIsProcessing(false);
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      toast.error("Failed to read file");
      setIsProcessing(false);
    };

    reader.readAsDataURL(file);
  };

  const handleApply = async () => {
    if (!preview) return;

    try {
      onImageReady(preview);
      toast.success("Image uploaded successfully!");
      handleClose();
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Failed to process image");
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    setOriginalSize(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreview(null);
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

          {!preview && !isProcessing ? (
            // Upload area
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-all bg-card/50"
            >
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-1">Click to upload image</p>
              <p className="text-xs text-muted-foreground text-center">
                Any size will be auto-resized to {targetWidth}×{targetHeight}px<br />
                No quality loss • High-quality scaling
              </p>
            </div>
          ) : isProcessing ? (
            // Processing state
            <div className="border-2 border-accent/30 rounded-lg p-12 flex flex-col items-center justify-center bg-card/50">
              <Loader2 className="h-12 w-12 text-accent animate-spin mb-4" />
              <p className="text-sm font-medium">Processing image...</p>
              <p className="text-xs text-muted-foreground mt-1">Auto-resizing to perfect size</p>
            </div>
          ) : (
            // Preview area
            <div className="space-y-4">
              <div className="relative border-2 border-accent/30 rounded-lg overflow-hidden bg-gradient-to-br from-black/5 to-black/10">
                <img
                  src={preview!}
                  alt="Preview"
                  className="w-full h-auto"
                  style={{
                    aspectRatio: `${targetWidth} / ${targetHeight}`,
                    objectFit: "contain",
                  }}
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 shadow-lg"
                  onClick={handleRemove}
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>

              {/* Info about the resize */}
              <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/30 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-green-600 dark:text-green-400">
                      Image auto-resized successfully!
                    </p>
                    {originalSize && (
                      <p className="text-xs text-muted-foreground">
                        Original: {originalSize.width}×{originalSize.height}px →
                        Resized: {targetWidth}×{targetHeight}px
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      High quality maintained • Ready to upload
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={!preview || isProcessing}
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
                Use Image
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
