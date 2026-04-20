import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, Check, Image as ImageIcon, Maximize2 } from "lucide-react";
import { toast } from "sonner";

interface InstagramCropSelectorProps {
  open: boolean;
  onClose: () => void;
  onImageReady: (dataUrl: string) => void;
  targetWidth?: number;
  targetHeight?: number;
  title?: string;
  description?: string;
}

/**
 * Instagram-Style Crop Selector
 *
 * - Image stays FIXED
 * - User drags a FRAME/SQUARE to select the crop area
 * - Can resize the frame by dragging corners
 * - Selected area auto-outputs to exact size (e.g. 1080×1080)
 */
export default function InstagramCropSelector({
  open,
  onClose,
  onImageReady,
  targetWidth = 1080,
  targetHeight = 1080,
  title = "Recortar Image",
  description = "Mueve y ajusta el cuadrado para select el área",
}: InstagramCropSelectorProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalSize, setOriginalSize] = useState<{ width: number; height: number } | null>(null);

  // Crop frame state (position and size in pixels)
  const [cropFrame, setCropFrame] = useState({ x: 50, y: 50, size: 300 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

        // Calculate display size (fit in 600px container)
        const maxDisplay = 600;
        let displayWidth = img.width;
        let displayHeight = img.height;

        if (img.width > maxDisplay || img.height > maxDisplay) {
          const scale = Math.min(maxDisplay / img.width, maxDisplay / img.height);
          displayWidth = img.width * scale;
          displayHeight = img.height * scale;
        }

        // Center crop frame initially (make it square, 70% of smaller dimension)
        const initialSize = Math.min(displayWidth, displayHeight) * 0.7;
        const initialX = (displayWidth - initialSize) / 2;
        const initialY = (displayHeight - initialSize) / 2;

        setCropFrame({ x: initialX, y: initialY, size: initialSize });
        setIsProcessing(false);

        toast.success("Image cargada - ajusta el cuadrado de recorte");
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

  // Drag frame to move
  const handleFrameMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('resize-handle')) return;

    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - cropFrame.x,
      y: e.clientY - cropFrame.y,
    });
  };

  // Resize frame from corner
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    if (isDragging) {
      // Move frame
      let newX = e.clientX - dragStart.x - containerRect.left;
      let newY = e.clientY - dragStart.y - containerRect.top;

      // Constrain within container
      newX = Math.max(0, Math.min(newX, containerWidth - cropFrame.size));
      newY = Math.max(0, Math.min(newY, containerHeight - cropFrame.size));

      setCropFrame(prev => ({ ...prev, x: newX, y: newY }));
    } else if (isResizing) {
      // Resize frame (maintain square aspect ratio)
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      const delta = Math.max(deltaX, deltaY); // Use larger delta to maintain square

      let newSize = cropFrame.size + delta;

      // Constrain size
      const maxSize = Math.min(
        containerWidth - cropFrame.x,
        containerHeight - cropFrame.y
      );
      newSize = Math.max(50, Math.min(newSize, maxSize)); // Min 50px, max fits in container

      setCropFrame(prev => ({ ...prev, size: newSize }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging, isResizing, dragStart, cropFrame]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  // Add/remove mouse event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
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
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const handleApply = async () => {
    if (!imageSrc || !imageRef.current || !containerRef.current) return;

    setIsProcessing(true);

    try {
      const img = imageRef.current;
      const containerRect = containerRef.current.getBoundingClientRect();

      // Calculate scale factor (original image size / display size)
      const displayWidth = containerRect.width;
      const displayHeight = containerRect.height;
      const scaleX = img.width / displayWidth;
      const scaleY = img.height / displayHeight;

      // Convert crop frame from display coordinates to original image coordinates
      const sourceX = cropFrame.x * scaleX;
      const sourceY = cropFrame.y * scaleY;
      const sourceSize = cropFrame.size * Math.min(scaleX, scaleY);

      // Create canvas with target dimensions
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d")!;

      // Enable high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Draw selected area to canvas (resize to target)
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceSize, sourceSize,  // Source (selected square)
        0, 0, targetWidth, targetHeight            // Destination (1080×1080)
      );

      // Convert to high-quality JPEG
      const resultDataUrl = canvas.toDataURL("image/jpeg", 0.95);

      onImageReady(resultDataUrl);
      toast.success("¡Image recortada perfectamente!");
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
    setCropFrame({ x: 50, y: 50, size: 300 });
    setOriginalSize(null);
    setIsProcessing(false);
    setIsDragging(false);
    setIsResizing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setImageSrc(null);
    setCropFrame({ x: 50, y: 50, size: 300 });
    setOriginalSize(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-3xl">
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
                Cualquier tamyear • Se recortará a {targetWidth}×{targetHeight}px
              </p>
            </div>
          ) : isProcessing ? (
            // Processing state
            <div className="border-2 border-accent/30 rounded-lg p-12 flex flex-col items-center justify-center bg-card/50">
              <Loader2 className="h-12 w-12 text-accent animate-spin mb-4" />
              <p className="text-sm font-medium">Processing image...</p>
            </div>
          ) : (
            // Crop selector area
            <div className="space-y-4">
              {/* Image with crop frame overlay */}
              <div className="relative border-2 border-accent/30 rounded-lg overflow-hidden bg-black/90">
                <div
                  ref={containerRef}
                  className="relative inline-block mx-auto"
                  style={{
                    maxWidth: "600px",
                    maxHeight: "600px",
                  }}
                >
                  {/* Fixed image */}
                  {imageSrc && (
                    <img
                      src={imageSrc}
                      alt="Recortar"
                      className="block max-w-full max-h-[600px] w-auto h-auto select-none"
                      draggable={false}
                    />
                  )}

                  {/* Darkened overlay outside crop area */}
                  <div className="absolute inset-0 pointer-events-none">
                    <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                      <defs>
                        <mask id="crop-mask">
                          <rect width="100%" height="100%" fill="white" />
                          <rect
                            x={cropFrame.x}
                            y={cropFrame.y}
                            width={cropFrame.size}
                            height={cropFrame.size}
                            fill="black"
                          />
                        </mask>
                      </defs>
                      <rect
                        width="100%"
                        height="100%"
                        fill="rgba(0, 0, 0, 0.6)"
                        mask="url(#crop-mask)"
                      />
                    </svg>
                  </div>

                  {/* Draggable crop frame */}
                  <div
                    className="absolute border-4 border-white courser-move select-none"
                    style={{
                      left: `${cropFrame.x}px`,
                      top: `${cropFrame.y}px`,
                      width: `${cropFrame.size}px`,
                      height: `${cropFrame.size}px`,
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0)',
                    }}
                    onMouseDown={handleFrameMouseDown}
                  >
                    {/* Grid lines (rule of thirds) */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Vertical lines */}
                      <div className="absolute left-1/3 top-0 bottom-0 w-[1px] bg-white/30"></div>
                      <div className="absolute left-2/3 top-0 bottom-0 w-[1px] bg-white/30"></div>
                      {/* Horizontal lines */}
                      <div className="absolute top-1/3 left-0 right-0 h-[1px] bg-white/30"></div>
                      <div className="absolute top-2/3 left-0 right-0 h-[1px] bg-white/30"></div>
                    </div>

                    {/* Resize handle (bottom-right corner) */}
                    <div
                      className="resize-handle absolute -bottom-2 -right-2 w-6 h-6 bg-white rounded-full border-2 border-accent courser-nwse-resize shadow-lg flex items-center justify-center"
                      onMouseDown={handleResizeMouseDown}
                    >
                      <Maximize2 className="h-3 w-3 text-accent" />
                    </div>
                  </div>
                </div>

                {/* Remove button */}
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-3 right-3 shadow-lg z-10"
                  onClick={handleRemove}
                >
                  <X className="h-4 w-4 mr-1" />
                  Quitar
                </Button>
              </div>

              {/* Instructions */}
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-4 space-y-2">
                <div className="text-sm space-y-1">
                  <p className="font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Ajusta el área de recorte:
                  </p>
                  <ul className="text-xs text-muted-foreground ml-6 space-y-1">
                    <li>• Arrastra el cuadrado blanco para mover</li>
                    <li>• Arrastra el círculo de la esquina para redimensionar</li>
                    <li>• El área dentro del cuadrado será la foto final</li>
                  </ul>
                  {originalSize && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Original: {originalSize.width}×{originalSize.height}px →
                      Resultado: {targetWidth}×{targetHeight}px
                    </p>
                  )}
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
