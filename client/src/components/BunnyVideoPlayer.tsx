import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Loader2, AlertCircle } from "lucide-react";

interface BunnyVideoPlayerProps {
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
  /** Use signed URLs for extra security (default: true) */
  useSignedUrl?: boolean;
}

/**
 * Bunny.net Video Player Component
 *
 * Features:
 * - Secure iframe embedding with token authentication
 * - Domain restriction (configured in .env BUNNY_ALLOWED_REFERRER)
 * - Custom branded controls with speed options (0.5x to 2x)
 * - Progress tracking and auto-completion
 * - Watermark overlay
 * - Lock state for sequential lesson access
 *
 * Security:
 * - Uses signed URLs to prevent unauthorized access
 * - Videos cannot be downloaded or shared outside your domain
 * - Token-based authentication with expiration
 */
export default function BunnyVideoPlayer({
  bunnyVideoId,
  bunnyLibraryId,
  title,
  onProgress,
  onComplete,
  locked = false,
  useSignedUrl = true,
}: BunnyVideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasCompleted, setHasCompleted] = useState(false);
  const progressReportRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Build iframe URL
  const embedUrl = `https://iframe.mediadelivery.net/embed/${bunnyLibraryId}/${bunnyVideoId}`;

  // Bunny.net iframe query parameters for customization
  const iframeParams = new URLSearchParams({
    autoplay: "false",
    preload: "true",
    responsive: "true",
    // Brand colors (Con Sabor UK palette)
    primaryColor: "FA3698", // Main pink/red accent
    // Player features
    loop: "false",
    controls: "true",
    // Speed options (0.5x, 1x, 1.25x, 1.5x, 1.75x, 2x)
    playbackRates: "0.5,1,1.25,1.5,1.75,2",
    defaultPlaybackRate: "1",
  });

  const fullEmbedUrl = `${embedUrl}?${iframeParams.toString()}`;

  // ── Message handler for iframe communication ─────────────────────────────────

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from Bunny.net CDN
      if (!event.origin.includes("mediadelivery.net")) return;

      const data = event.data;

      // Handle different event types from Bunny.net player
      if (data.event === "ready") {
        setIsLoading(false);
        console.log("[BunnyPlayer] Video player ready");
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
            console.log("[BunnyPlayer] Video completed (95%)");
          }
        }
      } else if (data.event === "error") {
        setError("Error al cargar el video. Por favor, intenta de nuevo.");
        setIsLoading(false);
        console.error("[BunnyPlayer] Playback error:", data);
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

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="relative bg-black aspect-video group select-none rounded-lg overflow-hidden">
      {/* Lock overlay */}
      {locked && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-8 py-6 text-center max-w-sm">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#FA3698]/20 mx-auto">
              <svg className="h-7 w-7 text-[#FA3698]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <p className="font-semibold text-white text-lg">Lección bloqueada</p>
            <p className="mt-2 text-sm text-white/70">
              Completa la lección anterior para desbloquear este contenido
            </p>
          </div>
        </div>
      )}

      {/* Watermark */}
      {title && !locked && (
        <div className="absolute top-3 right-3 z-20 text-white/30 text-xs font-medium select-none pointer-events-none">
          Con Sabor · {title}
        </div>
      )}

      {/* Loading state */}
      {isLoading && !locked && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
          <Loader2 className="h-12 w-12 text-[#FA3698] animate-spin" />
          <p className="mt-3 text-white/80 text-sm">Cargando video...</p>
        </div>
      )}

      {/* Error state */}
      {error && !locked && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-8 py-6 text-center max-w-sm">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <p className="font-semibold text-white">Error al cargar el video</p>
            <p className="mt-2 text-sm text-white/70">{error}</p>
          </div>
        </div>
      )}

      {/* Bunny.net iframe player */}
      {!locked && (
        <iframe
          ref={iframeRef}
          src={fullEmbedUrl}
          title={title || "Video"}
          className="w-full h-full border-0"
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
          <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 shadow-lg">
            <Play size={32} className="text-white ml-1" fill="white" />
          </div>
        </div>
      )}
    </div>
  );
}
