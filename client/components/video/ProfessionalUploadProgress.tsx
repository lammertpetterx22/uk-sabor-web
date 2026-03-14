import { CheckCircle2, Upload, FileVideo, Image as ImageIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ProfessionalUploadProgressProps {
  isUploading: boolean;
  progress: number;
  uploadComplete: boolean;
  uploadType: 'video' | 'image';
  fileName?: string;
}

export function ProfessionalUploadProgress({
  isUploading,
  progress,
  uploadComplete,
  uploadType,
  fileName,
}: ProfessionalUploadProgressProps) {
  if (!isUploading && !uploadComplete) {
    return null;
  }

  return (
    <div className="w-full space-y-4 p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
      {/* Icon and status */}
      <div className="flex items-center gap-4">
        {uploadComplete ? (
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
        ) : (
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
            {uploadType === 'video' ? (
              <FileVideo className="w-6 h-6 text-white" />
            ) : (
              <ImageIcon className="w-6 h-6 text-white" />
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {uploadComplete
              ? `${uploadType === 'video' ? 'Video' : 'Imagen'} listo`
              : `Procesando tu ${uploadType === 'video' ? 'video' : 'imagen'}...`}
          </h3>
          {fileName && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {fileName}
            </p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {!uploadComplete && (
        <div className="space-y-2">
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-300 ease-out rounded-full relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              {/* Animated shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Progreso
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      )}

      {/* Success message */}
      {uploadComplete && (
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl">
          <p className="text-sm text-green-800 dark:text-green-300 font-medium">
            {uploadType === 'video'
              ? '✓ Video cargado exitosamente. Ya puedes continuar.'
              : '✓ Imagen cargada exitosamente. Ya puedes continuar.'}
          </p>
        </div>
      )}

      {/* Custom CSS for shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
