import { useRef, useState, useEffect, useCallback } from "react";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  RotateCcw, Gauge,
} from "lucide-react";

const SPEED_OPTIONS = [0.5, 1, 1.25, 1.5, 1.75, 2] as const;
type SpeedOption = (typeof SPEED_OPTIONS)[number];

interface ProtectedVideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  /** Called every ~2s with the current watch percentage (0-100). */
  onProgress?: (percent: number) => void;
  /** Called once when the video reaches ≥95% watched. */
  onComplete?: () => void;
  /** If true, play is disabled and a lock overlay is shown. */
  locked?: boolean;
  /** If true, the src is a Bunny.net iframe embed URL */
  isBunnyVideo?: boolean;
}

export default function ProtectedVideoPlayer({
  src,
  poster,
  title,
  onProgress,
  onComplete,
  locked = false,
  isBunnyVideo = false,
}: ProtectedVideoPlayerProps) {
  // Auto-detect Bunny.net iframe URLs
  const isBunnyIframe = isBunnyVideo || src.includes('iframe.mediadelivery.net') || src.includes('iframe.bunnycdn.net');
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState<SpeedOption>(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressReportRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Auto-hide controls ───────────────────────────────────────────────────────
  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (isPlaying) {
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  useEffect(() => () => {
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (progressReportRef.current) clearInterval(progressReportRef.current);
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    }
  }, [isPlaying]);

  // ── Report progress every 3s while playing ───────────────────────────────────
  const reportProgress = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const pct = Math.round((video.currentTime / video.duration) * 100);
    onProgress?.(pct);
    if (!hasCompleted && pct >= 95) {
      setHasCompleted(true);
      onComplete?.();
    }
  }, [onProgress, onComplete, hasCompleted]);

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

  // ── Prevent download shortcuts ───────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && (e.key === "s" || e.key === "u" || e.key === "S" || e.key === "U")) ||
        (e.ctrlKey && e.shiftKey && ["i", "I", "j", "J"].includes(e.key)) ||
        e.key === "F12"
      ) {
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Block right-click ────────────────────────────────────────────────────────
  const blockCtx = (e: React.MouseEvent) => e.preventDefault();

  // ── Playback controls ────────────────────────────────────────────────────────
  const togglePlay = () => {
    if (locked) return;
    const video = videoRef.current;
    if (!video) return;
    video.paused ? video.play() : video.pause();
    resetControlsTimer();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const val = parseFloat(e.target.value);
    video.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (locked) return;
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    video.currentTime = ratio * video.duration;
    resetControlsTimer();
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    setProgress((video.currentTime / video.duration) * 100 || 0);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
    video.playbackRate = speed;
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setShowControls(true);
    reportProgress(); // final report
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const handleRestart = () => {
    if (locked) return;
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play();
    resetControlsTimer();
  };

  const changeSpeed = (s: SpeedOption) => {
    setSpeed(s);
    setShowSpeedMenu(false);
    if (videoRef.current) videoRef.current.playbackRate = s;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // If it's a Bunny.net iframe, use simplified rendering
  if (isBunnyIframe) {
    return (
      <div
        ref={containerRef}
        className="relative bg-black aspect-video group select-none"
        onContextMenu={blockCtx}
        style={{ userSelect: "none", WebkitUserSelect: "none" }}
      >
        {/* Lock overlay */}
        {locked && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-8 py-6 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#FA3698]/20 mx-auto">
                <svg className="h-7 w-7 text-[#FA3698]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="font-semibold text-white">Lección bloqueada</p>
              <p className="mt-1 text-sm text-white/60">Completa la lección anterior para desbloquear</p>
            </div>
          </div>
        )}

        {/* Bunny.net iframe embed */}
        {!locked && (
          <iframe
            src={src}
            loading="lazy"
            className="w-full h-full border-0"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen
            onContextMenu={blockCtx}
          />
        )}

        {/* Watermark */}
        {title && !locked && (
          <div className="absolute top-3 right-3 z-20 text-white/20 text-xs font-medium select-none pointer-events-none">
            Con Sabor · {title}
          </div>
        )}
      </div>
    );
  }

  // Regular video player for non-Bunny videos
  return (
    <div
      ref={containerRef}
      className="relative bg-black aspect-video group select-none"
      onContextMenu={blockCtx}
      onMouseMove={resetControlsTimer}
      onTouchStart={resetControlsTimer}
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      {/* Invisible anti-download overlay */}
      <div
        className="absolute inset-0 z-10"
        onContextMenu={blockCtx}
        style={{ pointerEvents: isPlaying && !showControls ? "auto" : "none" }}
      />

      {/* Video element — no native controls, no download attribute */}
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onContextMenu={blockCtx}
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
        playsInline
        style={{ pointerEvents: "none" }}
      >
        <source src={src} type="video/mp4" />
      </video>

      {/* Lock overlay */}
      {locked && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-8 py-6 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#FA3698]/20 mx-auto">
              <svg className="h-7 w-7 text-[#FA3698]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="font-semibold text-white">Lección bloqueada</p>
            <p className="mt-1 text-sm text-white/60">Completa la lección anterior para desbloquear</p>
          </div>
        </div>
      )}

      {/* Watermark */}
      {title && !locked && (
        <div className="absolute top-3 right-3 z-20 text-white/20 text-xs font-medium select-none pointer-events-none">
          Con Sabor · {title}
        </div>
      )}

      {/* Click to play/pause overlay */}
      {!locked && (
        <div
          className="absolute inset-0 z-20 cursor-pointer"
          onClick={togglePlay}
          style={{ pointerEvents: "auto" }}
        />
      )}

      {/* Controls overlay */}
      {!locked && (
        <div
          className={`absolute bottom-0 left-0 right-0 z-30 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"
            }`}
          style={{ pointerEvents: showControls ? "auto" : "none" }}
        >
          {/* Controls gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />

          <div className="relative px-4 pb-3 pt-8">
            {/* Progress bar */}
            <div
              className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer mb-3 hover:h-2.5 transition-all"
              onClick={handleProgressClick}
            >
              <div
                className="h-full rounded-full relative"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #FA3698, #FD4D43)",
                }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md" />
              </div>
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="text-white hover:text-[#FA3698] transition-colors p-1"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>

              {/* Restart */}
              <button
                onClick={handleRestart}
                className="text-white/60 hover:text-white transition-colors p-1"
                title="Reiniciar"
              >
                <RotateCcw size={15} />
              </button>

              {/* Volume */}
              <button onClick={toggleMute} className="text-white hover:text-[#FA3698] transition-colors p-1">
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>

              {/* Volume slider */}
              <input
                type="range" min="0" max="1" step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-14 h-1 cursor-pointer hidden sm:block accent-[#FA3698]"
              />

              {/* Time */}
              <span className="text-white/60 text-xs ml-1 tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Speed selector */}
              <div className="relative" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setShowSpeedMenu(v => !v)}
                  className="flex items-center gap-1 text-white/70 hover:text-white text-xs font-semibold px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-all"
                  title="Velocidad"
                >
                  <Gauge size={13} />
                  {speed}x
                </button>

                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black/90 backdrop-blur rounded-lg border border-white/10 overflow-hidden z-50">
                    {SPEED_OPTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => changeSpeed(s)}
                        className={`block w-full text-right px-4 py-1.5 text-sm transition-colors ${s === speed
                            ? "text-[#FA3698] bg-white/5 font-bold"
                            : "text-white/80 hover:text-white hover:bg-white/10"
                          }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-[#FA3698] transition-colors p-1"
              >
                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Big play button when paused */}
      {!isPlaying && !locked && (
        <div className="absolute inset-0 z-25 flex items-center justify-center pointer-events-none" style={{ zIndex: 25 }}>
          <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <Play size={28} className="text-white ml-1" />
          </div>
        </div>
      )}
    </div>
  );
}
