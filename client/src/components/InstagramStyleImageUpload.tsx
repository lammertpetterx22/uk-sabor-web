import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, Check } from "lucide-react";
import { toast } from "sonner";

interface InstagramStyleImageUploadProps {
  open: boolean;
  onClose: () => void;
  onImageReady: (dataUrl: string) => void;
  aspectRatio?: number; // e.g. 1 for square, 16/9 for landscape
  title?: string;
  description?: string;
}

export default function InstagramStyleImageUpload({
  open,
  onClose,
  onImageReady,
  aspectRatio = 1, // Default square like Instagram
  title = "Upload Image",
  description = "Select an image and it will auto-fit perfectly",
}: InstagramStyleImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Auto-fit the image to canvas with aspect ratio
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d")!;

          // Calculate output size (Instagram style - fit to cover)
          const outputWidth = 800;
          const outputHeight = Math.round(outputWidth / aspectRatio);

          canvas.width = outputWidth;
          canvas.height = outputHeight;

          // Calculate source dimensions for center crop
          const sourceAspect = img.width / img.height;
          const targetAspect = aspectRatio;

          let sx, sy, sWidth, sHeight;

          if (sourceAspect > targetAspect) {
            // Image is wider - crop sides
            sHeight = img.height;
            sWidth = Math.round(img.height * targetAspect);
            sx = (img.width - sWidth) / 2;
            sy = 0;
          } else {
            // Image is taller - crop top/bottom
            sWidth = img.width;
            sHeight = Math.round(img.width / targetAspect);
            sx = 0;
            sy = (img.height - sHeight) / 2;
          }

          // Draw the cropped image
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, outputWidth, outputHeight);
          ctx.drawImage(
            img,
            sx, sy, sWidth, sHeight,
            0, 0, outputWidth, outputHeight
          );

          // Create preview
          const previewUrl = canvas.toDataURL("image/jpeg", 0.92);
          setPreview(previewUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleApply = async () => {
    if (!canvasRef.current || !preview) return;

    setIsProcessing(true);
    try {
      // The canvas already has the perfect crop, just get the data URL
      const finalImage = canvasRef.current.toDataURL("image/jpeg", 0.92);
      onImageReady(finalImage);
      toast.success("Image uploaded successfully!");
      handleClose();
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Failed to process image");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* File input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!preview ? (
            // Upload area
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-colors bg-card/50"
            >
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-1">Click to upload image</p>
              <p className="text-xs text-muted-foreground">
                Image will auto-fit perfectly {aspectRatio === 1 ? "(Square)" : aspectRatio === 16/9 ? "(16:9)" : ""}
              </p>
            </div>
          ) : (
            // Preview area
            <div className="space-y-4">
              <div className="relative border-2 border-accent/30 rounded-lg overflow-hidden bg-black/20">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-auto"
                  style={{
                    aspectRatio: aspectRatio,
                    objectFit: "cover",
                  }}
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleRemove}
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card/50 p-3 rounded-lg">
                <Check className="h-4 w-4 text-green-500" />
                <span>Image auto-fitted perfectly! Ready to upload.</span>
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
