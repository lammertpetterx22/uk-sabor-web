import { useEffect, useRef, useState, useCallback } from 'react';
import { Plyr } from 'plyr-react';
import 'plyr-react/plyr.css';
import { Lock, Loader2, AlertCircle } from 'lucide-react';

interface EnhancedVideoPlayerProps {
  /** Bunny.net video GUID (preferred) */
  bunnyVideoId?: string;
  /** Bunny.net library ID (required if bunnyVideoId is provided) */
  bunnyLibraryId?: string;
  /** Fallback video URL for non-Bunny videos */
  videoUrl?: string;
  /** Poster/thumbnail image */
  poster?: string;
  /** Video title */
  title?: string;
  /** If true, video is locked */
  isLocked?: boolean;
  /** Progress callback (0-100) */
  onProgress?: (percent: number) => void;
  /** Completion callback (triggered at 95%) */
  onComplete?: () => void;
  /** Initial playback time in seconds */
  initialTime?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * 🎬 Enhanced Premium Video Player
 *
 * CARACTERÍSTICAS:
 * - Soporte para Bunny.net iframe Y videos directos
 * - Auto-detección de aspect ratio (16:9, 9:16, 1:1)
 * - Controles profesionales con Plyr.io
 * - Estados de loading/error elegantes
 * - Lock overlay premium
 * - Watermark discreto (solo en hover)
 * - Progress tracking automático
 * - Mobile responsive
 *
 * USO:
 * ```tsx
 * // Con Bunny.net:
 * <EnhancedVideoPlayer
 *   bunnyVideoId="xxx"
 *   bunnyLibraryId="123"
 *   title="Mi lección"
 *   onProgress={handleProgress}
 * />
 *
 * // Con video URL:
 * <EnhancedVideoPlayer
 *   videoUrl="https://..."
 *   poster="https://..."
 * />
 * ```
 */
export function EnhancedVideoPlayer({
  bunnyVideoId,
  bunnyLibraryId,
  videoUrl,
  poster,
  title,
  isLocked = false,
  onProgress,
  onComplete,
  initialTime = 0,
  className = '',
}: EnhancedVideoPlayerProps) {
  const playerRef = useRef<Plyr>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [detectedAspectRatio, setDetectedAspectRatio] = useState<string>('16/9');

  // Determine if we're using Bunny.net iframe
  const isBunnyIframe = !!(bunnyVideoId && bunnyLibraryId);

  // Build Bunny.net iframe URL
  const bunnyEmbedUrl = isBunnyIframe
    ? `https://iframe.mediadelivery.net/embed/${bunnyLibraryId}/${bunnyVideoId}?` +
      new URLSearchParams({
        autoplay: 'false',
        preload: 'true',
        responsive: 'true',
        primaryColor: 'FA3698',
        loop: 'false',
        controls: 'true',
        playbackRates: '0.5,1,1.25,1.5,1.75,2',
        defaultPlaybackRate: '1',
      }).toString()
    : '';

  // Plyr configuration (for non-iframe videos)
  const plyrOptions: Plyr.Options = {
    controls: [
      'play-large',
      'play',
      'progress',
      'current-time',
      'duration',
      'mute',
      'volume',
      'settings',
      'pip',
      'airplay',
      'fullscreen',
    ],
    settings: ['quality', 'speed'],
    speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] },
    quality: {
      default: 720,
      options: [4320, 2880, 2160, 1440, 1080, 720, 576, 480, 360, 240],
    },
    ratio: '16:9',
    autoplay: false,
    clickToPlay: true,
    keyboard: { focused: true, global: false },
    tooltips: { controls: true, seek: true },
    i18n: {
      restart: 'Reiniciar',
      rewind: 'Retroceder {seektime}s',
      play: 'Reproducir',
      pause: 'Pausar',
      fastForward: 'Adelantar {seektime}s',
      seek: 'Buscar',
      seekLabel: '{currentTime} de {duration}',
      played: 'Reproducido',
      buffered: 'Cargado',
      currentTime: 'Tiempo actual',
      duration: 'Duración',
      volume: 'Volumen',
      mute: 'Silenciar',
      unmute: 'Activar sonido',
      enableCaptions: 'Activar subtítulos',
      disableCaptions: 'Desactivar subtítulos',
      download: 'Descargar',
      enterFullscreen: 'Pantalla completa',
      exitFullscreen: 'Salir de pantalla completa',
      frameTitle: 'Reproductor de {title}',
      captions: 'Subtítulos',
      settings: 'Configuración',
      pip: 'Picture-in-Picture',
      menuBack: 'Volver al menú anterior',
      speed: 'Velocidad',
      normal: 'Normal',
      quality: 'Calidad',
      loop: 'Repetir',
    },
  };

  // ── Bunny.net iframe message handler ──────────────────────────────────────
  useEffect(() => {
    if (!isBunnyIframe) return;

    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.includes('mediadelivery.net')) return;

      const data = event.data;

      if (data.event === 'ready') {
        setIsLoading(false);
        setIsReady(true);
      } else if (data.event === 'play') {
        setIsPlaying(true);
      } else if (data.event === 'pause') {
        setIsPlaying(false);
      } else if (data.event === 'timeupdate') {
        const time = data.currentTime || 0;
        const dur = data.duration || 0;
        setCurrentTime(time);
        setDuration(dur);

        if (dur > 0) {
          const percent = Math.round((time / dur) * 100);
          onProgress?.(percent);

          if (!hasCompleted && percent >= 95) {
            setHasCompleted(true);
            onComplete?.();
          }
        }
      } else if (data.event === 'loadedmetadata') {
        const videoWidth = data.videoWidth || 0;
        const videoHeight = data.videoHeight || 0;

        if (videoWidth > 0 && videoHeight > 0) {
          const ratio = videoWidth / videoHeight;
          if (ratio > 1.5) {
            setDetectedAspectRatio('16/9');
          } else if (ratio < 0.8) {
            setDetectedAspectRatio('9/16');
          } else {
            setDetectedAspectRatio('1/1');
          }
        }
      } else if (data.event === 'error') {
        setError('Error al cargar el video. Por favor, intenta de nuevo.');
        setIsLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isBunnyIframe, onProgress, onComplete, hasCompleted]);

  // ── Plyr event handlers (for direct videos) ──────────────────────────────
  useEffect(() => {
    if (isBunnyIframe || !playerRef.current) return;

    const player = playerRef.current.plyr;
    if (!player) return;

    const handleReady = () => {
      setIsReady(true);
      setIsLoading(false);
      if (initialTime > 0) {
        player.currentTime = initialTime;
      }
    };

    const handleTimeUpdate = () => {
      const time = player.currentTime;
      const dur = player.duration;
      setCurrentTime(time);
      setDuration(dur);

      if (dur > 0) {
        const percent = Math.round((time / dur) * 100);
        onProgress?.(percent);

        if (!hasCompleted && percent >= 95) {
          setHasCompleted(true);
          onComplete?.();
        }
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = () => {
      setError('Error al cargar el video.');
      setIsLoading(false);
    };

    player.on('ready', handleReady);
    player.on('timeupdate', handleTimeUpdate);
    player.on('play', handlePlay);
    player.on('pause', handlePause);
    player.on('error', handleError);

    return () => {
      player.off('ready', handleReady);
      player.off('timeupdate', handleTimeUpdate);
      player.off('play', handlePlay);
      player.off('pause', handlePause);
      player.off('error', handleError);
    };
  }, [isBunnyIframe, initialTime, onProgress, onComplete, hasCompleted]);

  // ── Periodic progress reporting (backup) ──────────────────────────────────
  const reportProgress = useCallback(() => {
    if (duration > 0 && currentTime > 0) {
      const percent = Math.round((currentTime / duration) * 100);
      onProgress?.(percent);
    }
  }, [currentTime, duration, onProgress]);

  useEffect(() => {
    if (isPlaying) {
      progressIntervalRef.current = setInterval(reportProgress, 3000);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, reportProgress]);

  // ── Handle iframe load ────────────────────────────────────────────────────
  const handleIframeLoad = () => {
    setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setIsReady(true);
      }
    }, 1000);
  };

  // ── Compute container constraints ─────────────────────────────────────────
  const maxWidth =
    detectedAspectRatio === '9/16'
      ? '500px'
      : detectedAspectRatio === '1/1'
      ? '600px'
      : '100%';

  // ── Lock overlay ──────────────────────────────────────────────────────────
  if (isLocked) {
    return (
      <div
        className={`relative w-full mx-auto bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl overflow-hidden shadow-2xl ${className}`}
        style={{ aspectRatio: detectedAspectRatio, maxWidth }}
      >
        <div className="absolute inset-0 backdrop-blur-sm bg-black/70 z-10" />

        {poster && (
          <img
            src={poster}
            alt="Video bloqueado"
            className="absolute inset-0 w-full h-full object-cover opacity-20 blur-md"
          />
        )}

        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-6 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full blur-3xl opacity-30 animate-pulse" />
            <div className="relative bg-gradient-to-br from-pink-500 to-purple-600 p-6 rounded-full shadow-2xl">
              <Lock className="w-12 h-12 text-white" />
            </div>
          </div>

          <h3 className="mt-6 text-2xl font-bold text-white mb-2">
            Contenido Exclusivo
          </h3>
          <p className="text-gray-300 mb-6 max-w-md">
            Esta lección está disponible solo para miembros premium. Desbloquea todo el contenido para continuar aprendiendo.
          </p>
        </div>
      </div>
    );
  }

  // ── Main player render ────────────────────────────────────────────────────
  return (
    <div
      className={`relative w-full mx-auto rounded-2xl overflow-hidden shadow-2xl bg-black group ${className}`}
      style={{ aspectRatio: detectedAspectRatio, maxWidth }}
    >
      {/* Watermark - discreto, solo visible en hover */}
      {title && (
        <div className="absolute top-4 right-4 z-30 text-white/20 text-xs font-medium select-none pointer-events-none px-3 py-1.5 bg-black/30 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          Con Sabor
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-gradient-to-br from-black/90 via-black/80 to-black/90 backdrop-blur-md">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FA3698] via-purple-500 to-[#FA3698] blur-xl opacity-50 animate-spin" style={{ animationDuration: '3s' }} />
            <div className="relative">
              <Loader2 className="h-16 w-16 text-[#FA3698] animate-spin" strokeWidth={2} />
            </div>
          </div>
          <p className="mt-6 text-white/90 text-sm font-medium tracking-wide">
            Cargando video...
          </p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-gradient-to-br from-black/95 via-red-950/30 to-black/95">
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
      {isBunnyIframe && (
        <iframe
          ref={iframeRef}
          src={bunnyEmbedUrl}
          title={title || 'Video'}
          className="absolute top-0 left-0 w-full h-full border-0 rounded-2xl"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
          onLoad={handleIframeLoad}
          onError={() => {
            setError('No se pudo cargar el reproductor de video.');
            setIsLoading(false);
          }}
          style={{
            border: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />
      )}

      {/* Plyr player (for direct video URLs) */}
      {!isBunnyIframe && videoUrl && (
        <div className="plyr-premium-wrapper">
          <Plyr
            ref={playerRef}
            source={{
              type: 'video',
              sources: [
                {
                  src: videoUrl,
                  type: 'video/mp4',
                },
              ],
              poster: poster,
            }}
            options={plyrOptions}
          />
        </div>
      )}

      {/* Premium styling for Plyr */}
      <style>{`
        .plyr-premium-wrapper {
          --plyr-color-main: #FA3698;
          --plyr-video-background: #000;
          --plyr-menu-background: rgba(0, 0, 0, 0.95);
          --plyr-menu-color: #fff;
          --plyr-badge-background: #FA3698;
          --plyr-badge-text-color: #fff;
          --plyr-tab-focus-color: #FA3698;
          --plyr-control-radius: 8px;
          --plyr-range-fill-background: linear-gradient(90deg, #FA3698, #FD4D43);
        }

        .plyr-premium-wrapper .plyr {
          border-radius: 1rem;
        }

        .plyr-premium-wrapper .plyr__video-wrapper {
          background: #000;
        }

        .plyr-premium-wrapper .plyr__controls {
          background: linear-gradient(to top, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.3), transparent);
          padding: 20px;
          opacity: 1 !important;
        }

        .plyr-premium-wrapper .plyr__control:hover {
          background: rgba(250, 54, 152, 0.25);
        }

        .plyr-premium-wrapper .plyr__control--overlaid {
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }

        .plyr-premium-wrapper .plyr__control--overlaid:hover {
          background: rgba(250, 54, 152, 0.8);
          transform: scale(1.1);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .plyr-premium-wrapper .plyr__progress__buffer {
          background: rgba(255, 255, 255, 0.15);
        }

        .plyr-premium-wrapper .plyr__volume {
          max-width: 120px;
        }

        .plyr-premium-wrapper .plyr__menu__container {
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
        }

        .plyr-premium-wrapper .plyr__menu__container [role='menuitemradio'][aria-checked='true']::before {
          background: #FA3698;
        }

        /* Always show controls on mobile */
        @media (max-width: 768px) {
          .plyr-premium-wrapper .plyr__controls {
            padding: 15px 10px;
            opacity: 1 !important;
          }
        }

        /* Smooth fade-in for controls on desktop */
        @media (min-width: 769px) {
          .plyr-premium-wrapper .plyr__controls {
            opacity: 0;
            transition: opacity 0.3s ease;
          }

          .plyr-premium-wrapper .plyr:hover .plyr__controls,
          .plyr-premium-wrapper .plyr.plyr--playing:hover .plyr__controls,
          .plyr-premium-wrapper .plyr--paused .plyr__controls {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
