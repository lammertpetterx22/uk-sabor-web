import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, ZoomIn, ZoomOut, RotateCw, RotateCcw, Maximize2, Square, RectangleHorizontal, Crop } from "lucide-react";

interface ImageCropperModalProps {
  imageSrc: string | null;
  aspect?: number;
  label?: string;
  onCropComplete: (croppedDataUrl: string) => void;
  onClose: () => void;
}

const ASPECT_RATIOS = {
  "17:25": 17 / 25,  // Flyer vertical (1275x1875) - PERFECTO PARA EVENTOS
  "16:9": 16 / 9,
  "4:3": 4 / 3,
  "1:1": 1,
  "3:4": 3 / 4,
  "9:16": 9 / 16,
  "free": undefined,
};

async function getCroppedImg(canvas: HTMLCanvasElement): Promise<string> {
  return canvas.toDataURL("image/jpeg", 0.95);
}

export default function ImageCropperModal({
  imageSrc,
  aspect,
  label = "Recortar Image",
  onCropComplete,
  onClose,
}: ImageCropperModalProps) {
  const [selectedAspect, setSelectedAspect] = useState<string>(() => {
    // Auto-detect aspect ratio
    if (!aspect) return "17:25"; // DEFAULT: Flyer format
    if (Math.abs(aspect - 17 / 25) < 0.01) return "17:25";
    if (Math.abs(aspect - 16 / 9) < 0.01) return "16:9";
    if (Math.abs(aspect - 4 / 3) < 0.01) return "4:3";
    if (Math.abs(aspect - 1) < 0.01) return "1:1";
    if (Math.abs(aspect - 3 / 4) < 0.01) return "3:4";
    if (Math.abs(aspect - 9 / 16) < 0.01) return "9:16";
    return "17:25"; // DEFAULT: Flyer format
  });
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentAspect = ASPECT_RATIOS[selectedAspect as keyof typeof ASPECT_RATIOS];

  const handleImageLoad = useCallback(() => {
    // Auto-fit: calculate minimum scale to cover the frame
    if (!imgRef.current || !containerRef.current) return;

    const img = imgRef.current;
    const containerW = containerRef.current.clientWidth;
    const containerH = 420;
    const availW = containerW - 32;
    const availH = containerH - 32;

    let fw: number, fh: number;
    if (currentAspect) {
      const byW = { fw: availW, fh: availW / currentAspect };
      const byH = { fw: availH * currentAspect, fh: availH };
      ({ fw, fh } = byW.fh <= availH ? byW : byH);
    } else {
      fw = availW;
      fh = availH;
    }

    const scaleX = fw / img.naturalWidth;
    const scaleY = fh / img.naturalHeight;
    setScale(Math.max(scaleX, scaleY));
    setOffsetX(0);
    setOffsetY(0);
  }, [currentAspect]);

  // Auto-fit when aspect ratio changes
  useEffect(() => {
    if (!imgRef.current || !containerRef.current) return;

    const img = imgRef.current;
    const containerW = containerRef.current.clientWidth;
    const containerH = 420;
    const availW = containerW - 32;
    const availH = containerH - 32;

    let fw: number, fh: number;
    if (currentAspect) {
      const byW = { fw: availW, fh: availW / currentAspect };
      const byH = { fw: availH * currentAspect, fh: availH };
      ({ fw, fh } = byW.fh <= availH ? byW : byH);
    } else {
      fw = availW;
      fh = availH;
    }

    const scaleX = fw / img.naturalWidth;
    const scaleY = fh / img.naturalHeight;
    setScale(Math.max(scaleX, scaleY));
    setOffsetX(0);
    setOffsetY(0);
  }, [currentAspect]);

  // Mouse events for dragging
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

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - offsetX, y: touch.clientY - offsetY });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setOffsetX(touch.clientX - dragStart.x);
    setOffsetY(touch.clientY - dragStart.y);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((s) => Math.max(0.5, Math.min(3, +(s + delta).toFixed(1))));
  };

  const handleApply = async () => {
    if (!containerRef.current || !imgRef.current) return;
    setIsProcessing(true);
    try {
      // 1. Calculate the frame size (visible crop area) based on aspect ratio
      const containerW = containerRef.current.clientWidth;
      const containerH = 420;
      const availW = containerW - 32;
      const availH = containerH - 32;

      let fw: number, fh: number;
      if (currentAspect) {
        const byW = { fw: availW, fh: availW / currentAspect };
        const byH = { fw: availH * currentAspect, fh: availH };
        ({ fw, fh } = byW.fh <= availH ? byW : byH);
      } else {
        fw = availW;
        fh = availH;
      }

      // 2. Output dimensions (exact sizes for specific aspect ratios)
      const sizes: Record<string, { w: number; h: number }> = {
        "17:25": { w: 1275, h: 1875 },
        "16:9": { w: 1920, h: 1080 },
        "1:1": { w: 1200, h: 1200 },
        "3:4": { w: 1200, h: 1600 },
        "9:16": { w: 1080, h: 1920 },
      };
      const outW = sizes[selectedAspect]?.w ?? fw * 2;
      const outH = sizes[selectedAspect]?.h ?? fh * 2;

      // 3. Create final canvas and draw correctly
      const finalCanvas = document.createElement("canvas");
      const ctx = finalCanvas.getContext("2d")!;
      finalCanvas.width = outW;
      finalCanvas.height = outH;

      const img = imgRef.current;
      const scaleToOutput = outW / fw;

      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, outW, outH);

      ctx.save();
      ctx.translate(outW / 2, outH / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale * scaleToOutput, scale * scaleToOutput);
      ctx.translate(
        -img.naturalWidth / 2 + offsetX / scale,
        -img.naturalHeight / 2 + offsetY / scale
      );
      ctx.drawImage(img, 0, 0);
      ctx.restore();

      const dataUrl = await getCroppedImg(finalCanvas);
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
      <DialogContent className="w-[98vw] max-w-5xl max-h-[95vh] overflow-y-auto p-4 sm:p-6 bg-gradient-to-br from-background to-background/95">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30">
              <Crop className="h-5 w-5 text-accent" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold gradient-text">{label}</DialogTitle>
              <p className="text-sm text-foreground/60 mt-1">Ajusta, recorta y perfecciona tu image</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Aspect Ratio Selector */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
              <RectangleHorizontal className="h-4 w-4 text-accent" />
              Proporción de Aspecto
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {Object.keys(ASPECT_RATIOS).map((ratio) => (
                <Button
                  key={ratio}
                  variant={selectedAspect === ratio ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedAspect(ratio);
                    resetTransform();
                  }}
                  className={`relative ${
                    selectedAspect === ratio
                      ? "bg-gradient-to-r from-accent to-accent/80 text-white border-0 shadow-lg"
                      : "hover:border-accent/50"
                  }`}
                >
                  {ratio === "free" ? (
                    <Maximize2 className="h-4 w-4 mr-1" />
                  ) : ratio === "1:1" ? (
                    <Square className="h-4 w-4 mr-1" />
                  ) : (
                    <RectangleHorizontal className="h-4 w-4 mr-1" />
                  )}
                  {ratio === "free" ? "Libre" : ratio}
                </Button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="bg-gradient-to-r from-accent/10 to-accent/5 p-4 rounded-xl border border-accent/20 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Zoom Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                    <ZoomIn className="h-4 w-4 text-accent" />
                    Zoom
                  </label>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(scale * 100)}%
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 shrink-0"
                    onClick={() => setScale((s) => Math.max(0.5, +(s - 0.1).toFixed(1)))}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Slider
                    value={[scale]}
                    onValueChange={(v) => setScale(v[0])}
                    min={0.5}
                    max={3}
                    step={0.1}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 shrink-0"
                    onClick={() => setScale((s) => Math.min(3, +(s + 0.1).toFixed(1)))}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Rotation Controls */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                    <RotateCw className="h-4 w-4 text-accent" />
                    Rotación
                  </label>
                  <Badge variant="outline" className="text-xs">
                    {rotation}°
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3"
                    onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    90°
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 flex-1"
                    onClick={resetTransform}
                  >
                    Resetear
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                  >
                    <RotateCw className="h-4 w-4 mr-1" />
                    90°
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-background/50 p-3 rounded-lg">
              <div className="text-accent mt-0.5">💡</div>
              <p className="text-xs text-foreground/70">
                <strong>Arrastra</strong> para mover • <strong>Rueda del mouse</strong> para zoom • <strong>Botones</strong> para rotar
              </p>
            </div>
          </div>

          {/* Image Editor Area */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground/80">Editor de Image</label>
            <div
              ref={containerRef}
              className="relative border-2 border-dashed border-accent/40 rounded-xl bg-black overflow-hidden courser-grab active:courser-grabbing shadow-xl"
              style={{
                width: "100%",
                height: "420px",
                position: "relative",
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
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
                  draggable={false}
                />
              )}

              {/* Crop frame overlay - shows exactly what will be exported */}
              {(() => {
                if (!containerRef.current) return null;

                const containerW = containerRef.current.clientWidth;
                const containerH = 420;
                const availW = containerW - 32;
                const availH = containerH - 32;

                let fw: number, fh: number;
                if (currentAspect) {
                  const byW = { fw: availW, fh: availW / currentAspect };
                  const byH = { fw: availH * currentAspect, fh: availH };
                  ({ fw, fh } = byW.fh <= availH ? byW : byH);
                } else {
                  fw = availW;
                  fh = availH;
                }

                const frameLeft = (containerW - fw) / 2;
                const frameTop = (containerH - fh) / 2;

                return (
                  <>
                    {/* Dark overlays outside the crop frame */}
                    {/* Top overlay */}
                    <div
                      className="absolute left-0 right-0 bg-black/60 pointer-events-none"
                      style={{ top: 0, height: `${frameTop}px` }}
                    />
                    {/* Bottom overlay */}
                    <div
                      className="absolute left-0 right-0 bg-black/60 pointer-events-none"
                      style={{ top: `${frameTop + fh}px`, bottom: 0 }}
                    />
                    {/* Left overlay */}
                    <div
                      className="absolute top-0 bottom-0 bg-black/60 pointer-events-none"
                      style={{ left: 0, width: `${frameLeft}px` }}
                    />
                    {/* Right overlay */}
                    <div
                      className="absolute top-0 bottom-0 bg-black/60 pointer-events-none"
                      style={{ left: `${frameLeft + fw}px`, right: 0 }}
                    />

                    {/* White border around the crop frame */}
                    <div
                      className="absolute border-2 border-white/80 pointer-events-none"
                      style={{
                        left: `${frameLeft}px`,
                        top: `${frameTop}px`,
                        width: `${fw}px`,
                        height: `${fh}px`,
                      }}
                    >
                      {/* Grid of thirds inside the frame */}
                      <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                        {[...Array(9)].map((_, i) => (
                          <div key={i} className="border border-white/20" />
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3 flex-col-reverse sm:flex-row mt-6 pt-4 border-t border-border/50">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            className="btn-vibrant w-full sm:w-auto font-semibold shadow-lg"
            onClick={handleApply}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Crop className="h-4 w-4 mr-2" />
                Aplicar Recorte
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
