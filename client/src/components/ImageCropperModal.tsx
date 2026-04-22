import { useCallback, useMemo, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Square,
  RectangleHorizontal,
  Crop as CropIcon,
  Check,
  X,
} from "lucide-react";

interface ImageCropperModalProps {
  imageSrc: string | null;
  aspect?: number;
  label?: string;
  onCropComplete: (croppedDataUrl: string) => void;
  onClose: () => void;
}

/**
 * The modal preset system. "17:25" is our flyer format, so default to it
 * when the caller doesn't provide a specific aspect.
 */
const ASPECT_RATIOS: Record<string, number | undefined> = {
  "17:25": 17 / 25, // Flyer vertical — 1275x1875 output
  "16:9": 16 / 9,
  "1:1": 1,
  "3:4": 3 / 4,
  "9:16": 9 / 16,
  "free": undefined,
};

// Export dimensions by aspect so cropped images land at the right resolution
const EXPORT_SIZES: Record<string, { w: number; h: number }> = {
  "17:25": { w: 1275, h: 1875 },
  "16:9":  { w: 1920, h: 1080 },
  "1:1":   { w: 1200, h: 1200 },
  "3:4":   { w: 1200, h: 1600 },
  "9:16":  { w: 1080, h: 1920 },
};

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    img.setAttribute("crossOrigin", "anonymous");
    img.src = url;
  });
}

/**
 * Draws the cropped region at the target export resolution and returns a
 * JPEG data URL. Handles rotation correctly by drawing into an intermediate
 * canvas first.
 */
async function getCroppedDataUrl(
  imageSrc: string,
  pixelCrop: Area,
  rotation: number,
  exportSize: { w: number; h: number } | undefined
): Promise<string> {
  const image = await createImage(imageSrc);
  const rotRad = (rotation * Math.PI) / 180;

  // Intermediate canvas: the full image at its rotated bounding box.
  const bboxW = Math.abs(Math.cos(rotRad) * image.width) + Math.abs(Math.sin(rotRad) * image.height);
  const bboxH = Math.abs(Math.sin(rotRad) * image.width) + Math.abs(Math.cos(rotRad) * image.height);
  const full = document.createElement("canvas");
  full.width = bboxW;
  full.height = bboxH;
  const fullCtx = full.getContext("2d")!;
  fullCtx.translate(bboxW / 2, bboxH / 2);
  fullCtx.rotate(rotRad);
  fullCtx.drawImage(image, -image.width / 2, -image.height / 2);

  // Final canvas: the crop region, up/downscaled to the target export size.
  const outW = exportSize?.w ?? Math.round(pixelCrop.width);
  const outH = exportSize?.h ?? Math.round(pixelCrop.height);

  const out = document.createElement("canvas");
  out.width = outW;
  out.height = outH;
  const outCtx = out.getContext("2d")!;
  outCtx.imageSmoothingQuality = "high";
  outCtx.drawImage(
    full,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outW,
    outH,
  );
  return out.toDataURL("image/jpeg", 0.95);
}

/**
 * Resolve the initial aspect preset key from the aspect number passed by
 * the parent form. Defaults to our flyer format.
 */
function aspectNumberToKey(aspect: number | undefined): string {
  if (!aspect) return "17:25";
  const entries = Object.entries(ASPECT_RATIOS).filter(([, v]) => v !== undefined) as [string, number][];
  const match = entries.find(([, v]) => Math.abs(v - aspect) < 0.01);
  return match?.[0] ?? "17:25";
}

export default function ImageCropperModal({
  imageSrc,
  aspect,
  label = "Crop image",
  onCropComplete,
  onClose,
}: ImageCropperModalProps) {
  const [aspectKey, setAspectKey] = useState<string>(() => aspectNumberToKey(aspect));
  const currentAspect = ASPECT_RATIOS[aspectKey];

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pixelCrop, setPixelCrop] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteInternal = useCallback((_area: Area, areaPixels: Area) => {
    setPixelCrop(areaPixels);
  }, []);

  const ratios: { key: string; label: string; icon: React.ReactNode }[] = useMemo(
    () => [
      { key: "17:25", label: "Flyer",  icon: <RectangleHorizontal className="h-4 w-4 rotate-90" /> },
      { key: "16:9",  label: "Banner", icon: <RectangleHorizontal className="h-4 w-4" /> },
      { key: "1:1",   label: "Square", icon: <Square className="h-4 w-4" /> },
      { key: "3:4",   label: "3:4",    icon: <RectangleHorizontal className="h-4 w-4 rotate-90" /> },
      { key: "9:16",  label: "Story",  icon: <RectangleHorizontal className="h-4 w-4 rotate-90" /> },
      { key: "free",  label: "Free",   icon: <Maximize2 className="h-4 w-4" /> },
    ],
    []
  );

  const handleApply = async () => {
    if (!imageSrc || !pixelCrop) return;
    setIsProcessing(true);
    try {
      const url = await getCroppedDataUrl(
        imageSrc,
        pixelCrop,
        rotation,
        EXPORT_SIZES[aspectKey]
      );
      onCropComplete(url);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetTransform = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  return (
    <Dialog open={!!imageSrc} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="!max-w-4xl w-[96vw] max-h-[95vh] p-0 gap-0 rounded-2xl border border-white/10 shadow-2xl shadow-black/60 bg-[#0a0a0a] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 md:px-6 py-4 border-b border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-accent/30 to-fuchsia-500/30 border border-accent/40 shadow-lg">
              <CropIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-white leading-none">{label}</h2>
              <p className="text-xs text-white/50 mt-1">Drag to reposition · pinch or scroll to zoom</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cropper — the only focal point */}
        <div className="relative w-full bg-black" style={{ aspectRatio: "4/3" }}>
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={currentAspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropCompleteInternal}
              showGrid
              objectFit="contain"
              style={{
                containerStyle: { backgroundColor: "#0a0a0a" },
                cropAreaStyle: {
                  border: "2px solid rgba(255,255,255,0.9)",
                  color: "rgba(0,0,0,0.55)",
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
                },
              }}
            />
          )}
        </div>

        {/* Controls */}
        <div className="px-5 md:px-6 py-4 space-y-4 bg-[#0a0a0a]">
          {/* Aspect presets — segmented control */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            {ratios.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => {
                  setAspectKey(r.key);
                  // Small reset so the crop frame recentres nicely after
                  // an aspect switch
                  setCrop({ x: 0, y: 0 });
                  setZoom(1);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                  aspectKey === r.key
                    ? "bg-gradient-to-r from-accent to-fuchsia-500 text-white border-accent/40 shadow-lg shadow-accent/20"
                    : "bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10"
                }`}
              >
                {r.icon}
                {r.label}
              </button>
            ))}
          </div>

          {/* Zoom slider with -/+ buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, +(z - 0.1).toFixed(2)))}
              className="w-9 h-9 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors flex-shrink-0"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <Slider
              value={[zoom]}
              onValueChange={(v) => setZoom(v[0])}
              min={1}
              max={5}
              step={0.01}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(5, +(z + 0.1).toFixed(2)))}
              className="w-9 h-9 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors flex-shrink-0"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <span className="text-xs text-white/40 font-mono tabular-nums w-10 text-right">
              {(zoom * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Footer — apply / cancel */}
        <div className="px-5 md:px-6 py-4 border-t border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="px-3 py-2 rounded-lg text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1.5 transition-colors"
            >
              <RotateCw className="h-3.5 w-3.5" /> Rotate
            </button>
            <button
              type="button"
              onClick={resetTransform}
              className="px-3 py-2 rounded-lg text-xs font-medium text-white/50 hover:text-white/80 transition-colors"
            >
              Reset
            </button>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="h-10 border-white/15 bg-transparent text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleApply}
              disabled={isProcessing || !pixelCrop}
              className="h-10 px-5 bg-gradient-to-r from-accent to-fuchsia-500 hover:from-accent/90 hover:to-fuchsia-500/90 text-white font-semibold shadow-lg shadow-accent/20"
            >
              {isProcessing ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing…</>
              ) : (
                <><Check className="h-4 w-4 mr-2" /> Apply</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
