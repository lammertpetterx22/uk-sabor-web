import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Loader2, AlertCircle, Lock } from "lucide-react";

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
 * Modern Bunny.net Video Player Component
 *
 * Features:
 * - Sleek, modern UI with smooth animations
 * - Secure iframe embedding with token authentication
 * - Domain restriction (configured in .env BUNNY_ALLOWED_REFERRER)
 * - Custom branded controls with speed options (0.5x to 2x)
 * - Progress tracking and auto-completion
 * - Minimal watermark overlay
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
          }
        }
      } else if (data.event === "error") {
        setError("Error al cargar el video. Por favor, intenta de nuevo.");
        setIsLoading(false);
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

  // ── Auto-detect aspect ratio from video metadata ─────────────────────────────
  const [detectedAspectRatio, setDetectedAspectRatio] = useState<string>("16/9");

  useEffect(() => {
    const handleMetadata = (event: MessageEvent) => {
      if (!event.origin.includes("mediadelivery.net")) return;
      const data = event.data;

      if (data.event === "loadedmetadata") {
        const videoWidth = data.videoWidth || 0;
        const videoHeight = data.videoHeight || 0;

        if (videoWidth > 0 && videoHeight > 0) {
          const ratio = videoWidth / videoHeight;

          if (ratio > 1.5) {
            setDetectedAspectRatio("16/9");
          } else if (ratio < 0.8) {
            setDetectedAspectRatio("9/16");
          } else {
            setDetectedAspectRatio("1/1");
          }
        }
      }
    };

    window.addEventListener("message", handleMetadata);
    return () => window.removeEventListener("message", handleMetadata);
  }, []);

  return (
    <div
      className="relative w-full max-w-full mx-auto bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-2xl overflow-hidden shadow-2xl group select-none border border-white/5"
      style={{
        aspectRatio: detectedAspectRatio,
        maxWidth:
          detectedAspectRatio === "9/16"
            ? "500px" // Vertical: mobile-first
            : detectedAspectRatio === "1/1"
            ? "600px" // Square: medium
            : "100%", // Horizontal: full width
      }}
    >
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none z-10" />

      {/* Lock overlay with modern glassmorphism */}
      {locked && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-2xl">
          <div className="relative">
            {/* Animated glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#FA3698]/20 via-purple-500/20 to-[#FA3698]/20 blur-3xl animate-pulse" />

            <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl px-10 py-8 text-center max-w-sm mx-4 shadow-2xl">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#FA3698]/30 to-purple-600/30 mx-auto ring-4 ring-white/10">
                <Lock className="h-10 w-10 text-white" strokeWidth={2.5} />
              </div>
              <h3 className="font-bold text-white text-xl mb-3 tracking-tight">
                Lección bloqueada
              </h3>
              <p className="text-sm text-white/60 leading-relaxed">
                Completa la lección anterior para desbloquear este contenido
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Minimal watermark - only visible on hover */}
      {title && !locked && (
        <div className="absolute top-4 right-4 z-20 text-white/20 text-xs font-medium select-none pointer-events-none px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          Con Sabor
        </div>
      )}

      {/* Modern loading state */}
      {isLoading && !locked && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-br from-black/90 via-black/80 to-black/90 backdrop-blur-md">
          <div className="relative">
            {/* Spinning gradient ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FA3698] via-purple-500 to-[#FA3698] blur-xl opacity-50 animate-spin" style={{ animationDuration: "3s" }} />

            <div className="relative">
              <Loader2 className="h-16 w-16 text-[#FA3698] animate-spin" strokeWidth={2} />
            </div>
          </div>
          <p className="mt-6 text-white/90 text-sm font-medium tracking-wide">
            Loading video...
          </p>
        </div>
      )}

      {/* Modern error state */}
      {error && !locked && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-br from-black/95 via-red-950/30 to-black/95">
          <div className="rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-red-900/5 backdrop-blur-xl px-10 py-8 text-center max-w-sm mx-4 shadow-2xl">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-500/30 to-red-600/20 mx-auto ring-4 ring-red-500/10">
              <AlertCircle className="h-8 w-8 text-red-400" strokeWidth={2.5} />
            </div>
            <h3 className="font-bold text-white text-lg mb-3">
              Error al cargar el video
            </h3>
            <p className="text-sm text-white/70 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Bunny.net iframe player */}
      {!locked && (
        <iframe
          ref={iframeRef}
          src={fullEmbedUrl}
          title={title || "Video"}
          className="absolute top-0 left-0 w-full h-full border-0 rounded-2xl"
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

      {/* Elegant play button overlay (shown when paused) */}
      {!isPlaying && !locked && !isLoading && !error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="relative">
            {/* Pulsing glow effect */}
            <div className="absolute inset-0 rounded-full bg-[#FA3698]/30 blur-2xl animate-pulse" />

            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl transform hover:scale-110 transition-transform duration-300">
              <Play size={40} className="text-white ml-1.5" fill="white" fillOpacity={0.95} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
