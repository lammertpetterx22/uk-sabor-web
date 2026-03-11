import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Camera, AlertCircle, CheckCircle2, XCircle, Keyboard, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import jsQR from "jsqr";

interface QRScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (qrCode: string) => Promise<{ attendeeName?: string; eventTitle?: string } | void>;
  title?: string;
  description?: string;
}

// Play a beep sound using Web Audio API
function playBeep(type: "success" | "error") {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (type === "success") {
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } else {
      oscillator.frequency.setValueAtTime(300, ctx.currentTime);
      oscillator.frequency.setValueAtTime(200, ctx.currentTime + 0.15);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
    }
  } catch {
    // Audio not available, silently ignore
  }
}

type ScanState = "idle" | "scanning" | "processing" | "success" | "error";

export default function QRScanner({
  open,
  onClose,
  onScan,
  title = "Scan Check-In QR Code",
  description = "Point your camera at the QR code to check in",
}: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastScanRef = useRef<string | null>(null);

  const [scanState, setScanState] = useState<ScanState>("idle");
  const [manualCode, setManualCode] = useState("");
  const [useManualInput, setUseManualInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ attendeeName?: string; eventTitle?: string } | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      setScanState("scanning");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setCameraError(err.message || "Camera access denied");
      setScanState("idle");
      setUseManualInput(true);
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Process check-in
  const handleCheckIn = useCallback(async (qrCode: string) => {
    if (scanState === "processing") return;
    setScanState("processing");
    setErrorMsg(null);
    try {
      const result = await onScan(qrCode);
      playBeep("success");
      setSuccessInfo(result || {});
      setScanState("success");
      toast.success("Check-in successful! ✓");
      setTimeout(() => {
        onClose();
        setScanState("idle");
        setSuccessInfo(null);
        setManualCode("");
        lastScanRef.current = null;
      }, 2500);
    } catch (err: any) {
      playBeep("error");
      setErrorMsg(err.message || "Check-in failed. Please try again.");
      setScanState("error");
      toast.error(err.message || "Check-in failed");
      // Auto-retry camera after error
      setTimeout(() => {
        setScanState("scanning");
        setErrorMsg(null);
        lastScanRef.current = null;
        if (!useManualInput) startCamera();
      }, 2500);
    }
  }, [scanState, onScan, onClose, useManualInput, startCamera]);

  // Scan QR from video frame
  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    if (scanState !== "scanning") return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState < video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanFrame) as unknown as number;
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });

    if (code && code.data !== lastScanRef.current) {
      lastScanRef.current = code.data;
      stopCamera();
      handleCheckIn(code.data);
    } else {
      animationFrameRef.current = requestAnimationFrame(scanFrame) as unknown as number;
    }
  }, [scanState, stopCamera, handleCheckIn]);

  // Lifecycle
  useEffect(() => {
    if (open && !useManualInput) {
      startCamera();
    }
    return () => stopCamera();
  }, [open, useManualInput]);

  useEffect(() => {
    if (scanState === "scanning") {
      animationFrameRef.current = requestAnimationFrame(scanFrame) as unknown as number;
    }
    return () => {
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [scanState, scanFrame]);

  const handleReset = () => {
    setScanState("idle");
    setErrorMsg(null);
    setManualCode("");
    lastScanRef.current = null;
    if (!useManualInput) startCamera();
  };

  const handleClose = () => {
    stopCamera();
    setScanState("idle");
    setErrorMsg(null);
    setSuccessInfo(null);
    setManualCode("");
    setCameraError(null);
    lastScanRef.current = null;
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-accent" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* SUCCESS STATE */}
          {scanState === "success" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-14 w-14 text-green-500" />
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-green-500 animate-ping opacity-30" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-xl font-bold text-green-500">Check-In Successful!</p>
                {successInfo?.attendeeName && (
                  <p className="text-base font-semibold">{successInfo.attendeeName}</p>
                )}
                {successInfo?.eventTitle && (
                  <p className="text-sm text-foreground/60">{successInfo.eventTitle}</p>
                )}
                <p className="text-xs text-foreground/40 mt-2">Closing in a moment...</p>
              </div>
            </div>
          )}

          {/* ERROR STATE */}
          {scanState === "error" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="w-24 h-24 rounded-full bg-destructive/20 flex items-center justify-center">
                <XCircle className="h-14 w-14 text-destructive" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-xl font-bold text-destructive">Check-In Failed</p>
                <p className="text-sm text-foreground/60">{errorMsg}</p>
                <p className="text-xs text-foreground/40">Retrying in a moment...</p>
              </div>
            </div>
          )}

          {/* PROCESSING STATE */}
          {scanState === "processing" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center">
                <Loader2 className="h-12 w-12 text-accent animate-spin" />
              </div>
              <p className="text-base font-semibold">Processing check-in...</p>
            </div>
          )}

          {/* MANUAL INPUT MODE */}
          {(scanState === "idle" || scanState === "scanning") && useManualInput && (
            <div className="space-y-4">
              <p className="text-sm text-foreground/70">{description}</p>
              {cameraError && (
                <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-600">Camera not available: {cameraError}</p>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Keyboard className="h-4 w-4" /> Enter QR Code Manually
                </label>
                <Input
                  placeholder="Paste or type the QR code here..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && manualCode.trim()) handleCheckIn(manualCode.trim()); }}
                  className="font-mono text-sm"
                  autoFocus
                />
                <p className="text-xs text-foreground/40">Press Enter or click Check In to process</p>
              </div>
              {!cameraError && (
                <Button variant="outline" size="sm" className="w-full" onClick={() => { setUseManualInput(false); startCamera(); }}>
                  <Camera className="h-4 w-4 mr-2" /> Switch to Camera
                </Button>
              )}
            </div>
          )}

          {/* CAMERA SCANNING MODE */}
          {(scanState === "idle" || scanState === "scanning") && !useManualInput && (
            <div className="space-y-3">
              <p className="text-sm text-foreground/70 text-center">{description}</p>

              {/* Camera viewfinder */}
              <div className="relative bg-black rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  onLoadedData={() => setScanState("scanning")}
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Dark overlay with cutout */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/40" />
                  {/* Scan box */}
                  <div className="relative z-10 w-56 h-56 sm:w-64 sm:h-64">
                    {/* Corner brackets */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
                    {/* Animated scan line */}
                    {scanState === "scanning" && (
                      <div
                        className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent"
                        style={{ animation: "scanLine 2s ease-in-out infinite" }}
                      />
                    )}
                  </div>
                </div>

                {/* Status pill at bottom */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
                  {scanState === "scanning" ? (
                    <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm px-4 py-1.5 rounded-full">
                      <div className="h-2 w-2 bg-accent rounded-full animate-pulse" />
                      <p className="text-xs text-white font-medium">Scanning...</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm px-4 py-1.5 rounded-full">
                      <Loader2 className="h-3 w-3 text-white animate-spin" />
                      <p className="text-xs text-white">Starting camera...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Scan line CSS animation */}
              <style>{`
                @keyframes scanLine {
                  0% { top: 8px; opacity: 0; }
                  10% { opacity: 1; }
                  90% { opacity: 1; }
                  100% { top: calc(100% - 8px); opacity: 0; }
                }
              `}</style>

              <Button variant="outline" size="sm" className="w-full" onClick={() => setUseManualInput(true)}>
                <Keyboard className="h-4 w-4 mr-2" /> Enter Code Manually
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
          {(scanState === "error") && (
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" /> Try Again
            </Button>
          )}
          <Button variant="outline" onClick={handleClose} disabled={scanState === "processing"}>
            {scanState === "success" ? "Close" : "Cancel"}
          </Button>
          {useManualInput && scanState !== "processing" && scanState !== "success" && scanState !== "error" && (
            <Button
              className="btn-vibrant"
              onClick={() => manualCode.trim() && handleCheckIn(manualCode.trim())}
              disabled={!manualCode.trim()}
            >
              Check In
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
