import { useState, useEffect, useRef, useCallback } from "react";
import { Upload, ImageIcon, Loader2, X, Check, ClipboardPaste } from "lucide-react";
import { toast } from "sonner";

interface ModernImageUploadProps {
  /** Current image URL/preview shown inside the frame */
  previewUrl?: string;
  /** True while the user has already selected an image but it hasn't been uploaded yet (shows loading) */
  uploading?: boolean;
  /** Called with a File when the user drops/picks/pastes one (parent handles crop + upload) */
  onFileSelected: (file: File) => void;
  /** Called when user removes the current image */
  onRemove?: () => void;
  /** Aspect ratio hint for the empty state preview box */
  aspect?: "17/25" | "16/9" | "1/1" | "4/3";
  /** Label / context text */
  label: string;
  /** Small description below the label */
  helper?: string;
  /** Accent colour class — applied to the dropzone hover state and progress */
  accent?: "pink" | "blue" | "indigo" | "amber";
  /** Max size in MB. Defaults to 10. */
  maxMB?: number;
}

const ACCENT_MAP: Record<string, { border: string; bg: string; text: string; fill: string }> = {
  pink:   { border: "border-[#FA3698]/40 hover:border-[#FA3698]/70", bg: "from-[#FA3698]/10 to-purple-500/5",   text: "text-[#FA3698]", fill: "bg-[#FA3698]" },
  blue:   { border: "border-blue-500/40 hover:border-blue-500/70",    bg: "from-blue-500/10 to-cyan-500/5",      text: "text-blue-400",  fill: "bg-blue-500" },
  indigo: { border: "border-indigo-500/40 hover:border-indigo-500/70",bg: "from-indigo-500/10 to-purple-500/5",  text: "text-indigo-400",fill: "bg-indigo-500" },
  amber:  { border: "border-amber-500/40 hover:border-amber-500/70",  bg: "from-amber-500/10 to-orange-500/5",   text: "text-amber-400", fill: "bg-amber-500" },
};

const ASPECT_CLASS: Record<string, string> = {
  "17/25": "aspect-[17/25]",
  "16/9":  "aspect-video",
  "1/1":   "aspect-square",
  "4/3":   "aspect-[4/3]",
};

export default function ModernImageUpload({
  previewUrl,
  uploading,
  onFileSelected,
  onRemove,
  aspect = "17/25",
  label,
  helper,
  accent = "pink",
  maxMB = 10,
}: ModernImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const a = ACCENT_MAP[accent];

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please pick an image file");
      return;
    }
    if (file.size > maxMB * 1024 * 1024) {
      toast.error(`Image too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max ${maxMB}MB.`);
      return;
    }
    onFileSelected(file);
  }, [onFileSelected, maxMB]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // Paste support — user hits Ctrl/Cmd+V while focused on the dropzone
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find(item => item.type.startsWith("image/"));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) {
        handleFile(file);
        e.preventDefault();
      }
    }
  };

  // Keyboard shortcut: Enter/Space on the dropzone opens file picker
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  // If we have a preview (either remote URL or local data URL) show the framed preview
  if (previewUrl) {
    const uploaded = !uploading;
    return (
      <div className="space-y-3">
        <div className={`relative ${ASPECT_CLASS[aspect]} w-full rounded-2xl overflow-hidden border-2 ${a.border} shadow-xl`}>
          <img src={previewUrl} alt={label} className="w-full h-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-3" />
                <p className="text-white font-semibold">Uploading…</p>
                <p className="text-white/70 text-xs mt-1">Please don't close this window</p>
              </div>
            </div>
          )}
          {uploaded && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
              <Check className="h-3.5 w-3.5" />
              Uploaded
            </div>
          )}
          {uploaded && onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-3 left-3 flex items-center gap-1 bg-black/60 hover:bg-red-500 text-white text-xs font-medium px-2.5 py-1.5 rounded-full backdrop-blur-sm transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Remove
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border/50 hover:border-${accent}-500/40 transition-colors text-sm text-foreground/70 hover:text-foreground`}
        >
          <ImageIcon className="h-4 w-4" />
          Replace image
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFile(e.target.files[0]);
              e.target.value = "";
            }
          }}
        />
      </div>
    );
  }

  // Empty state — drag-and-drop zone with nice visual feedback
  return (
    <div
      tabIndex={0}
      role="button"
      aria-label={`Upload ${label}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
      onKeyDown={handleKey}
      className={`relative ${ASPECT_CLASS[aspect]} w-full rounded-2xl border-2 border-dashed bg-gradient-to-br ${a.bg} transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-[#FA3698] ${
        isDragging
          ? `${a.border} border-solid scale-[1.02] shadow-2xl`
          : `${a.border} hover:shadow-lg`
      }`}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
        <div className={`relative mb-4 ${isDragging ? "scale-110" : ""} transition-transform`}>
          <div className={`absolute inset-0 rounded-2xl ${a.fill} opacity-20 blur-xl`} />
          <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${a.bg} border-2 ${a.border} flex items-center justify-center`}>
            {isDragging ? (
              <Upload className={`h-8 w-8 ${a.text} animate-bounce`} />
            ) : (
              <ImageIcon className={`h-8 w-8 ${a.text}`} />
            )}
          </div>
        </div>
        <p className="font-semibold text-foreground mb-1">
          {isDragging ? "Drop it here!" : label}
        </p>
        {helper && !isDragging && (
          <p className="text-xs text-foreground/50 mb-4 max-w-xs">{helper}</p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-foreground/50">
          <span className="inline-flex items-center gap-1">
            <Upload className="h-3 w-3" /> Click
          </span>
          <span className="text-foreground/20">·</span>
          <span className="inline-flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-foreground/30" /> Drag &amp; drop
          </span>
          <span className="text-foreground/20">·</span>
          <span className="inline-flex items-center gap-1">
            <ClipboardPaste className="h-3 w-3" /> Ctrl+V
          </span>
        </div>
        <p className="text-[10px] text-foreground/30 mt-3">JPG / PNG / WebP · max {maxMB}MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFile(e.target.files[0]);
            e.target.value = "";
          }
        }}
      />
    </div>
  );
}
