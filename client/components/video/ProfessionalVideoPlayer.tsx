import { useEffect, useRef, useState } from 'react';
import Plyr from 'plyr-react';
import 'plyr-react/plyr.css';
import { Play, Lock } from 'lucide-react';

interface ProfessionalVideoPlayerProps {
  videoUrl: string;
  poster?: string;
  isLocked?: boolean;
  onTimeUpdate?: (currentTime: number) => void;
  onProgress?: (percent: number) => void;
  initialTime?: number;
  className?: string;
}

export function ProfessionalVideoPlayer({
  videoUrl,
  poster,
  isLocked = false,
  onTimeUpdate,
  onProgress,
  initialTime = 0,
  className = '',
}: ProfessionalVideoPlayerProps) {
  const [isReady, setIsReady] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(true);
  const playerRef = useRef<Plyr>(null);

  // Configuración profesional de Plyr
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

  useEffect(() => {
    if (!playerRef.current) return;

    const player = playerRef.current.plyr;
    if (!player) return;

    // Event listeners
    const handleReady = () => {
      setIsReady(true);
      if (initialTime > 0) {
        player.currentTime = initialTime;
      }
    };

    const handleTimeUpdate = () => {
      if (onTimeUpdate) {
        onTimeUpdate(player.currentTime);
      }
      if (onProgress) {
        const percent = (player.currentTime / player.duration) * 100;
        onProgress(percent);
      }
    };

    const handlePlay = () => {
      setShowPlayButton(false);
    };

    const handlePause = () => {
      setShowPlayButton(true);
    };

    player.on('ready', handleReady);
    player.on('timeupdate', handleTimeUpdate);
    player.on('play', handlePlay);
    player.on('pause', handlePause);

    return () => {
      player.off('ready', handleReady);
      player.off('timeupdate', handleTimeUpdate);
      player.off('play', handlePlay);
      player.off('pause', handlePause);
    };
  }, [initialTime, onTimeUpdate, onProgress]);

  const handleUnlock = () => {
    // Placeholder for unlock logic
    console.log('Video is locked. Upgrade to unlock.');
  };

  if (isLocked) {
    return (
      <div className={`relative w-full aspect-video bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl overflow-hidden shadow-2xl ${className}`}>
        {/* Background blur effect */}
        <div className="absolute inset-0 backdrop-blur-sm bg-black/60 z-10" />

        {/* Poster image blurred */}
        {poster && (
          <img
            src={poster}
            alt="Video locked"
            className="absolute inset-0 w-full h-full object-cover opacity-30 blur-md"
          />
        )}

        {/* Lock overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-6 text-center">
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full blur-3xl opacity-30 animate-pulse" />

            {/* Lock icon */}
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

          <button
            onClick={handleUnlock}
            className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
          >
            Desbloquear Lección
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden shadow-2xl bg-black ${className}`}>
      {/* Custom play button overlay */}
      {showPlayButton && isReady && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-300" />

            {/* Play button */}
            <div className="relative bg-white/10 backdrop-blur-md p-6 rounded-full border border-white/20 shadow-2xl group-hover:bg-white/20 transition-all duration-300 transform group-hover:scale-110">
              <Play className="w-12 h-12 text-white fill-white" />
            </div>
          </div>
        </div>
      )}

      {/* Plyr player */}
      <div className="plyr-professional">
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

      {/* Custom CSS for professional look */}
      <style>{`
        .plyr-professional {
          --plyr-color-main: #FA3698;
          --plyr-video-background: #000;
          --plyr-menu-background: rgba(0, 0, 0, 0.9);
          --plyr-menu-color: #fff;
          --plyr-badge-background: #FA3698;
          --plyr-badge-text-color: #fff;
          --plyr-tab-focus-color: #FA3698;
          --plyr-control-radius: 8px;
        }

        .plyr-professional .plyr {
          border-radius: 0;
        }

        .plyr-professional .plyr__video-wrapper {
          background: #000;
        }

        .plyr-professional .plyr__controls {
          background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
          padding: 20px;
        }

        .plyr-professional .plyr__control:hover {
          background: rgba(250, 54, 152, 0.2);
        }

        .plyr-professional .plyr__control--overlaid {
          display: none; /* Hide default play button, we use our custom one */
        }

        .plyr-professional .plyr__progress__buffer {
          background: rgba(255, 255, 255, 0.15);
        }

        .plyr-professional .plyr__volume {
          max-width: 120px;
        }

        /* Smooth transitions */
        .plyr-professional .plyr__controls {
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .plyr-professional .plyr:hover .plyr__controls,
        .plyr-professional .plyr.plyr--playing:hover .plyr__controls {
          opacity: 1;
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .plyr-professional .plyr__controls {
            padding: 15px 10px;
          }
        }
      `}</style>
    </div>
  );
}
