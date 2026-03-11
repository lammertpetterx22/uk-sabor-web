import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ZoomIn, ZoomOut, RotateCw, RotateCcw } from "lucide-react";

interface ImageCropperModalProps {
  imageSrc: string | null;
  aspect?: number;
  label?: string;
  onCropComplete: (croppedDataUrl: string) => void;
  onClose: () => void;
}

async function getCroppedImg(canvas: HTMLCanvasElement): Promise<string> {
  return canvas.toDataURL("image/jpeg", 0.92);
}

export default function ImageCropperModal({
  imageSrc,
  aspect,
  label = "Adjust Image",
  onCropComplete,
  onClose,
}: ImageCropperModalProps) {
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Update preview canvas
  const updatePreview = useCallback(() => {
    if (!imgRef.current || !previewCanvasRef.current) return;

    const img = imgRef.current;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext("2d")!;

    // Set canvas size based on aspect ratio
    const previewWidth = 400;
    canvas.width = previewWidth;
    canvas.height = aspect ? Math.round(previewWidth / aspect) : 300;

    // Clear canvas
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw image with transformations
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.translate(-img.width / 2 + offsetX, -img.height / 2 + offsetY);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  }, [rotation, scale, offsetX, offsetY, aspect]);

  const handleImageLoad = useCallback(() => {
    updatePreview();
  }, [updatePreview]);

  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setOffsetX(e.clientX - dragStart.x);
    setOffsetY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((s) => Math.max(0.5, Math.min(3, +(s + delta).toFixed(1))));
  };

  const handleApply = async () => {
    if (!previewCanvasRef.current) return;
    setIsProcessing(true);
    try {
      const dataUrl = await getCroppedImg(previewCanvasRef.current);
      onCropComplete(dataUrl);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetTransform = () => {
    setRotation(0);
    setScale(1);
    setOffsetX(0);
    setOffsetY(0);
  };

  return (
    <Dialog open={!!imageSrc} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{label}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Controls - Clean and organized */}
          <div className="bg-gradient-to-r from-accent/10 to-accent/5 p-4 rounded-lg border border-accent/20 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Zoom Controls */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-foreground/70">Zoom</label>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setScale((s) => Math.max(0.5, +(s - 0.1).toFixed(1)))}
                    title="Zoom out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-medium text-center flex-1">{Math.round(scale * 100)}%</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setScale((s) => Math.min(3, +(s + 0.1).toFixed(1)))}
                    title="Zoom in"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Rotate Controls */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-foreground/70">Rotate</label>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                    title="Rotate left"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-medium text-center flex-1">{rotation}°</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    title="Rotate right"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Reset Button */}
              <div className="flex flex-col gap-2 col-span-2 sm:col-span-2">
                <label className="text-xs font-semibold text-foreground/70">Actions</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetTransform}
                  className="w-full text-xs"
                >
                  Reset
                </Button>
              </div>
            </div>

            <p className="text-xs text-foreground/60 bg-background/50 p-2 rounded">
              💡 Drag to move • Scroll to zoom • Use buttons to rotate
            </p>
          </div>

          {/* Image Editor Area - Improved */}
          <div
            ref={containerRef}
            className="relative border-2 border-dashed border-accent/40 rounded-lg bg-gradient-to-br from-background to-background/80 overflow-hidden cursor-grab active:cursor-grabbing"
            style={{
              width: "100%",
              height: "350px",
              position: "relative",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            {imageSrc && (
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Edit"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) scale(${scale}) rotate(${rotation}deg)`,
                  maxWidth: "none",
                  userSelect: "none",
                  pointerEvents: "none",
                  WebkitUserSelect: "none",
                }}
                onLoad={handleImageLoad}
              />
            )}

            {/* Crosshair overlay for better positioning */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-0.5 h-8 bg-accent/30" />
              <div className="h-0.5 w-8 bg-accent/30 absolute" />
            </div>
          </div>

          {/* Live Preview */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground/70">Preview</label>
            <div className="border border-accent/20 rounded-lg bg-background/50 p-3 flex items-center justify-center">
              <canvas
                ref={previewCanvasRef}
                style={{
                  maxWidth: "100%",
                  maxHeight: "250px",
                  objectFit: "contain",
                }}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 flex-col-reverse sm:flex-row mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            className="btn-vibrant w-full sm:w-auto font-semibold"
            onClick={handleApply}
            disabled={isProcessing}
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isProcessing ? "Processing..." : "Apply Crop"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
