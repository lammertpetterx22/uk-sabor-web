import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Loader2, AlertCircle, Lock } from "lucide-react";

interface ResponsiveBunnyPlayerProps {
  /** Bunny.net video GUID */
  bunnyVideoId: string;
  /** Bunny.net library ID */
  bunnyLibraryId: string;
  /** Video title (shown as watermark) */
  title?: string;
  /** Called every ~3s with the current watch percentage (0-100) */
  onProgress?: (percent: number) => void;
  /** Called once when the video reaches ≥95% watched */
  onComplete?: () => void;
  /** If true, play is disabled and a lock overlay is shown */
  locked?: boolean;
  /** Force specific aspect ratio (optional, auto-detects by default) */
  aspectRatio?: "16:9" | "9:16" | "1:1" | "auto";
}

/**
 * 🎬 Responsive Bunny.net Video Player
 *
 * SOLUCIÓN DEFINITIVA PARA MÚLTIPLES FORMATOS:
 * - Auto-detecta formato del video (16:9, 9:16, 1:1)
 * - Contenedor adaptable que funciona en cualquier resolución
 * - Estética premium con colores de marca (#FA3698)
 * - Loading states, error handling, y lock overlay
 *
 * ARQUITECTURA:
 * 1. Usa iframe de Bunny.net con parámetros de marca
 * 2. Detecta dimensiones del video al cargar
 * 3. Aplica aspect-ratio CSS automáticamente
 * 4. Responsive en mobile, tablet, y desktop
 */
export default function ResponsiveBunnyPlayer({
  bunnyVideoId,
  bunnyLibraryId,
  title,
  onProgress,
  onComplete,
  locked = false,
  aspectRatio = "auto",
}: ResponsiveBunnyPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasCompleted, setHasCompleted] = useState(false);
  const progressReportRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [detectedAspectRatio, setDetectedAspectRatio] = useState<string>("16/9");

  // Build iframe URL with brand customization
  const embedUrl = `https://iframe.mediadelivery.net/embed/${bunnyLibraryId}/${bunnyVideoId}`;

  // Bunny.net iframe query parameters for customization
  const iframeParams = new URLSearchParams({
    autoplay: "false",
    preload: "true",
    responsive: "true",
    // 🎨 Brand colors (Con Sabor UK palette)
    primaryColor: "FA3698", // Main pink/red accent (#FA3698)
    // Player features
    loop: "false",
    controls: "true",
    // Speed options (0.5x, 1x, 1.25x, 1.5x, 1.75x, 2x)
    playbackRates: "0.5,1,1.25,1.5,1.75,2",
    defaultPlaybackRate: "1",
  });

  const fullEmbedUrl = `${embedUrl}?${iframeParams.toString()}`;

  // ── Video dimension detection ────────────────────────────────────────────────

  useEffect(() => {
    // Auto-detect aspect ratio from video metadata
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from Bunny.net CDN
      if (!event.origin.includes("mediadelivery.net")) return;

      const data = event.data;

      if (data.event === "ready") {
        setIsLoading(false);
        console.log("[ResponsiveBunnyPlayer] Video player ready");
      } else if (data.event === "play") {
        setIsPlaying(true);
      } else if (data.event === "pause") {
        setIsPlaying(false);
      } else if (data.event === "timeupdate") {
        setCurrentTime(data.currentTime || 0);
        setDuration(data.duration || 0);

        // Report progress
        if (data.duration > 0) {
          const percent = Math.round((data.currentTime / data.duration) * 100);
          onProgress?.(percent);

          // Auto-complete at 95%
          if (!hasCompleted && percent >= 95) {
            setHasCompleted(true);
            onComplete?.();
            console.log("[ResponsiveBunnyPlayer] Video completed (95%)");
          }
        }
      } else if (data.event === "loadedmetadata") {
        // Detect aspect ratio from video dimensions
        const videoWidth = data.videoWidth || 0;
        const videoHeight = data.videoHeight || 0;

        if (videoWidth > 0 && videoHeight > 0) {
          const ratio = videoWidth / videoHeight;

          if (ratio > 1.5) {
            // Wide (16:9 or similar)
            setDetectedAspectRatio("16/9");
            console.log("[ResponsiveBunnyPlayer] Detected: Horizontal (16:9)");
          } else if (ratio < 0.8) {
            // Tall (9:16 - TikTok/Reels style)
            setDetectedAspectRatio("9/16");
            console.log("[ResponsiveBunnyPlayer] Detected: Vertical (9:16)");
          } else {
            // Square (1:1 - Instagram style)
            setDetectedAspectRatio("1/1");
            console.log("[ResponsiveBunnyPlayer] Detected: Square (1:1)");
          }
        }
      } else if (data.event === "error") {
        setError("Error al cargar el video. Por favor, intenta de nuevo.");
        setIsLoading(false);
        console.error("[ResponsiveBunnyPlayer] Playback error:", data);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onProgress, onComplete, hasCompleted]);

  // ── Periodic progress reporting (backup) ─────────────────────────────────────

  const reportProgress = useCallback(() => {
    if (duration > 0 && currentTime > 0) {
      const pct = Math.round((currentTime / duration) * 100);
      onProgress?.(pct);
    }
  }, [currentTime, duration, onProgress]);

  useEffect(() => {
    if (isPlaying) {
      progressReportRef.current = setInterval(reportProgress, 3000);
    } else {
      if (progressReportRef.current) clearInterval(progressReportRef.current);
    }
    return () => {
      if (progressReportRef.current) clearInterval(progressReportRef.current);
    };
  }, [isPlaying, reportProgress]);

  // ── Iframe loaded handler ────────────────────────────────────────────────────

  const handleIframeLoad = () => {
    // Give the player a moment to initialize
    setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 1000);
  };

  // ── Compute final aspect ratio ───────────────────────────────────────────────

  const finalAspectRatio =
    aspectRatio !== "auto"
      ? aspectRatio === "16:9"
        ? "16/9"
        : aspectRatio === "9:16"
        ? "9/16"
        : "1/1"
      : detectedAspectRatio;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-full mx-auto bg-black rounded-lg overflow-hidden shadow-2xl"
      style={{
        aspectRatio: finalAspectRatio,
        // Maximum container constraints for different formats
        maxWidth:
          finalAspectRatio === "9/16"
            ? "500px" // Vertical videos: narrower max width (mobile-first)
            : finalAspectRatio === "1/1"
            ? "600px" // Square videos: medium width
            : "100%", // Horizontal videos: full width
      }}
    >
      {/* Lock overlay */}
      {locked && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-8 py-6 text-center max-w-sm mx-4">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FA3698]/20 mx-auto">
              <Lock className="h-8 w-8 text-[#FA3698]" />
            </div>
            <p className="font-semibold text-white text-lg mb-2">Lección bloqueada</p>
            <p className="text-sm text-white/70">
              Completa la lección anterior para desbloquear este contenido
            </p>
          </div>
        </div>
      )}

      {/* Watermark */}
      {title && !locked && (
        <div className="absolute top-3 right-3 z-20 text-white/30 text-xs font-medium select-none pointer-events-none px-2 py-1 bg-black/30 rounded">
          Con Sabor · {title}
        </div>
      )}

      {/* Loading state */}
      {isLoading && !locked && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
          <Loader2 className="h-12 w-12 text-[#FA3698] animate-spin" />
          <p className="mt-3 text-white/80 text-sm">Cargando video...</p>
        </div>
      )}

      {/* Error state */}
      {error && !locked && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/95">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-8 py-6 text-center max-w-sm mx-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <p className="font-semibold text-white mb-2">Error al cargar el video</p>
            <p className="text-sm text-white/70">{error}</p>
          </div>
        </div>
      )}

      {/* Bunny.net iframe player */}
      {!locked && (
        <iframe
          ref={iframeRef}
          src={fullEmbedUrl}
          title={title || "Video"}
          className="absolute top-0 left-0 w-full h-full border-0"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
          onLoad={handleIframeLoad}
          onError={() => {
            setError("No se pudo cargar el reproductor de video.");
            setIsLoading(false);
          }}
          style={{
            border: "none",
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        />
      )}

      {/* Fallback play button (shown when paused) */}
      {!isPlaying && !locked && !isLoading && !error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border-2 border-white/40 shadow-2xl">
            <Play size={36} className="text-white ml-1" fill="white" fillOpacity={0.9} />
          </div>
        </div>
      )}

      {/* Format indicator (debug - remove in production) */}
      {process.env.NODE_ENV === "development" && (
        <div className="absolute bottom-3 left-3 z-20 text-white/50 text-xs font-mono select-none pointer-events-none px-2 py-1 bg-black/50 rounded">
          {finalAspectRatio === "16/9" && "📺 Horizontal (16:9)"}
          {finalAspectRatio === "9/16" && "📱 Vertical (9:16)"}
          {finalAspectRatio === "1/1" && "⬜ Square (1:1)"}
        </div>
      )}
    </div>
  );
}
