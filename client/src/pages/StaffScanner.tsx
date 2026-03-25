import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Camera, ScanLine, ShieldAlert, CheckCircle2, XCircle,
    ArrowLeft, Wifi, WifiOff, Clock, User, MapPin, Calendar,
    Ticket,
} from "lucide-react";

// ─── Role check ───────────────────────────────────────────────────────────────

function isStaffUser(user: { role: string; roles?: string | null } | null): boolean {
    if (!user) return false;
    const roles: string[] = [];
    try {
        const parsed = user.roles ? JSON.parse(user.roles) : [];
        if (Array.isArray(parsed)) roles.push(...parsed);
    } catch { }
    roles.push(user.role);
    return roles.some(r => r === "instructor" || r === "promoter" || r === "admin");
}

// ─── Last scan result card ────────────────────────────────────────────────────

interface ScanResult {
    success: boolean;
    ticketCode?: string;
    attendeeName?: string;
    attendeeEmail?: string | null;
    eventTitle?: string;
    eventDate?: Date | null;
    eventVenue?: string | null;
    errorMsg?: string;
    scannedAt: Date;
}

function ScanResultCard({ result }: { result: ScanResult }) {
    return (
        <div
            className={`relative overflow-hidden rounded-2xl border p-5 transition-all animate-in fade-in slide-in-from-bottom-4 duration-300 ${result.success
                ? "border-green-500/40 bg-green-500/10"
                : "border-red-500/40 bg-red-500/10"
                }`}
        >
            <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                    className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${result.success ? "bg-green-500/20" : "bg-red-500/20"
                        }`}
                >
                    {result.success ? (
                        <CheckCircle2 className="h-7 w-7 text-green-400" />
                    ) : (
                        <XCircle className="h-7 w-7 text-red-400" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className={`font-bold text-lg ${result.success ? "text-green-400" : "text-red-400"}`}>
                        {result.success ? "✓ Entrada válida" : "✗ Entrada inválida"}
                    </p>

                    {result.success ? (
                        <div className="mt-2 space-y-1.5 text-sm">
                            {result.attendeeName && (
                                <div className="flex items-center gap-2 text-white/80">
                                    <User size={13} className="text-white/40" />
                                    <span className="font-semibold">{result.attendeeName}</span>
                                </div>
                            )}
                            {result.eventTitle && (
                                <div className="flex items-center gap-2 text-white/70">
                                    <Ticket size={13} className="text-white/40" />
                                    {result.eventTitle}
                                </div>
                            )}
                            {result.eventVenue && (
                                <div className="flex items-center gap-2 text-white/60">
                                    <MapPin size={13} className="text-white/40" />
                                    {result.eventVenue}
                                </div>
                            )}
                            {result.ticketCode && (
                                <div className="mt-2 rounded-lg bg-black/30 px-3 py-1.5 font-mono text-xs text-white/40">
                                    #{result.ticketCode}
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="mt-1 text-sm text-red-300/80">{result.errorMsg}</p>
                    )}

                    <p className="mt-2 text-xs text-white/30 flex items-center gap-1">
                        <Clock size={10} />
                        {result.scannedAt.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StaffScanner() {
    const { user, isAuthenticated } = useAuth();
    const [scanning, setScanning] = useState(false);
    const [lastResult, setLastResult] = useState<ScanResult | null>(null);
    const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
    const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [manualCode, setManualCode] = useState("");
    const [showManual, setShowManual] = useState(false);

    const validateMutation = trpc.tickets.validateQR.useMutation({
        onSuccess: (data: any) => {
            const result: ScanResult = {
                success: true,
                ticketCode: data.ticketCode,
                attendeeName: data.attendeeName,
                attendeeEmail: data.attendeeEmail,
                eventTitle: data.eventTitle,
                eventDate: data.eventDate ? new Date(data.eventDate) : null,
                eventVenue: data.eventVenue,
                scannedAt: new Date(),
            };
            setLastResult(result);
            setScanHistory(prev => [result, ...prev.slice(0, 19)]);
            // Flash screen green
            document.body.style.background = "#16a34a33";
            setTimeout(() => { document.body.style.background = ""; }, 600);
        },
        onError: (err: any) => {
            const result: ScanResult = {
                success: false,
                errorMsg: err.message,
                scannedAt: new Date(),
            };
            setLastResult(result);
            setScanHistory(prev => [result, ...prev.slice(0, 19)]);
            document.body.style.background = "#dc262633";
            setTimeout(() => { document.body.style.background = ""; }, 600);
        },
    });

    const processQR = (payload: string) => {
        if (validateMutation.isPending) return;
        validateMutation.mutate({ qrPayload: payload });
    };

    // ── Camera init ──────────────────────────────────────────────────────────────
    const startCamera = async () => {
        setCameraError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false,
            });
            setCameraStream(stream);
            setScanning(true);

            // Wait for video element to mount
            setTimeout(() => {
                const video = document.getElementById("staff-scanner-video") as HTMLVideoElement;
                if (video) {
                    video.srcObject = stream;
                    setVideoRef(video);
                    startFrameScan(video);
                }
            }, 300);
        } catch (err: any) {
            setCameraError(err.message || "No se pudo acceder a la cámara");
            setShowManual(true);
        }
    };

    const stopCamera = () => {
        cameraStream?.getTracks().forEach(t => t.stop());
        setCameraStream(null);
        setScanning(false);
        setVideoRef(null);
    };

    // ── QR frame scanning (jsQR) ─────────────────────────────────────────────────
    const startFrameScan = (video: HTMLVideoElement) => {
        const canvas = document.createElement("canvas");
        let active = true;

        const scan = async () => {
            if (!active || !video.srcObject) return;
            if (video.readyState < video.HAVE_ENOUGH_DATA) {
                requestAnimationFrame(scan);
                return;
            }

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.drawImage(video, 0, 0);

            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            try {
                const jsQR = (await import("jsqr")).default;
                const code = jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: "dontInvert" });
                if (code && code.data) {
                    active = false;
                    processQR(code.data);
                    // Resume scanning after 2.5s
                    setTimeout(() => {
                        active = true;
                        requestAnimationFrame(scan);
                    }, 2500);
                    return;
                }
            } catch { }

            requestAnimationFrame(scan);
        };

        requestAnimationFrame(scan);
    };

    // ── Access guard ──────────────────────────────────────────────────────────────
    if (!isAuthenticated || !user) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-8">
                <ShieldAlert size={48} className="text-[#FA3698]" />
                <h1 className="text-2xl font-bold text-center">Access Restricted</h1>
                <p className="text-foreground/60 text-center">Sign in to access the Staff Scanner</p>
                <Link href="/login"><Button className="btn-vibrant">Sign In</Button></Link>
            </div>
        );
    }

    if (!isStaffUser(user)) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-8">
                <ShieldAlert size={48} className="text-[#FD4D43]" />
                <h1 className="text-2xl font-bold text-center">No Permission</h1>
                <p className="text-foreground/60 text-center max-w-sm">
                    This page is only available for <strong>instructors</strong> and <strong>promoters</strong> of Con Sabor.
                </p>
                <Link href="/"><Button variant="outline"><ArrowLeft size={16} className="mr-2" />Back to Home</Button></Link>
            </div>
        );
    }

    // ── Staff scanner UI ──────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            {/* Header bar */}
            <div className="flex items-center justify-between border-b border-white/10 bg-black/80 backdrop-blur px-4 py-3 sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <Link href="/">
                        <button className="rounded-lg p-1.5 hover:bg-white/10 transition-colors">
                            <ArrowLeft size={18} />
                        </button>
                    </Link>
                    <div>
                        <h1 className="font-bold text-sm leading-tight">Staff Scanner</h1>
                        <p className="text-xs text-white/40">Con Sabor · Check-in de entradas</p>
                    </div>
                </div>

                {/* Live counter */}
                <div className="flex items-center gap-2">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                        {scanHistory.filter(r => r.success).length} ✓
                    </Badge>
                    {scanHistory.filter(r => !r.success).length > 0 && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                            {scanHistory.filter(r => !r.success).length} ✗
                        </Badge>
                    )}
                    <div className="flex items-center gap-1 text-xs text-white/40">
                        {scanning ? <Wifi size={12} className="text-green-400" /> : <WifiOff size={12} />}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row">
                {/* Camera section */}
                <div className="flex-1 flex flex-col">
                    {scanning ? (
                        <div className="relative bg-black" style={{ aspectRatio: "4/3" }}>
                            <video
                                id="staff-scanner-video"
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />

                            {/* Scanner overlay */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="absolute inset-0 bg-black/40" />

                                {/* Scan frame */}
                                <div className="relative z-10 w-64 h-64 sm:w-72 sm:h-72">
                                    {/* Corners */}
                                    <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-[#FA3698] rounded-tl-xl" />
                                    <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-[#FA3698] rounded-tr-xl" />
                                    <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-[#FA3698] rounded-bl-xl" />
                                    <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-[#FA3698] rounded-br-xl" />

                                    {/* Scanning line */}
                                    <div
                                        className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#FA3698] to-transparent"
                                        style={{ animation: "scanLine 2s ease-in-out infinite" }}
                                    />
                                </div>

                                {/* Status pill */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 backdrop-blur px-4 py-2 rounded-full">
                                    {validateMutation.isPending ? (
                                        <>
                                            <div className="h-2 w-2 bg-[#FCC500] rounded-full animate-pulse" />
                                            <span className="text-xs text-white font-medium">Procesando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="h-2 w-2 bg-[#FA3698] rounded-full animate-ping" />
                                            <span className="text-xs text-white font-medium">Escaneando…</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <style>{`
                @keyframes scanLine {
                  0% { top: 8px; opacity: 0; }
                  10% { opacity: 1; }
                  90% { opacity: 1; }
                  100% { top: calc(100% - 8px); opacity: 0; }
                }
              `}</style>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 min-h-64">
                            <div className="h-24 w-24 rounded-full bg-[#FA3698]/10 border border-[#FA3698]/30 flex items-center justify-center">
                                <ScanLine size={40} className="text-[#FA3698]" />
                            </div>
                            <div className="text-center space-y-1">
                                <h2 className="font-bold text-xl">Listo para escanear</h2>
                                <p className="text-white/50 text-sm">Apunta la cámara al QR de la entrada</p>
                            </div>
                            {cameraError && (
                                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300 max-w-sm text-center">
                                    {cameraError}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Camera controls */}
                    <div className="p-4 space-y-3">
                        {!scanning ? (
                            <Button
                                className="w-full py-5 text-base font-bold"
                                style={{ background: "linear-gradient(135deg, #FA3698, #FD4D43)" }}
                                onClick={startCamera}
                            >
                                <Camera size={18} className="mr-2" />
                                Activar cámara
                            </Button>
                        ) : (
                            <Button variant="outline" className="w-full py-4 border-white/20" onClick={stopCamera}>
                                Detener cámara
                            </Button>
                        )}

                        {/* Manual input toggle */}
                        <Button
                            variant="ghost"
                            className="w-full text-white/40 hover:text-white text-sm"
                            onClick={() => setShowManual(v => !v)}
                        >
                            {showManual ? "Ocultar entrada manual" : "Introducir código manualmente"}
                        </Button>

                        {showManual && (
                            <div className="flex gap-2">
                                <input
                                    placeholder="Pega o escribe el código QR…"
                                    value={manualCode}
                                    onChange={e => setManualCode(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === "Enter" && manualCode.trim()) {
                                            processQR(manualCode.trim());
                                            setManualCode("");
                                        }
                                    }}
                                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-mono placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#FA3698]/50"
                                />
                                <Button
                                    onClick={() => { processQR(manualCode.trim()); setManualCode(""); }}
                                    disabled={!manualCode.trim() || validateMutation.isPending}
                                    style={{ background: "linear-gradient(135deg, #FA3698, #FD4D43)" }}
                                    className="px-4"
                                >
                                    OK
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Results panel */}
                <div className="lg:w-96 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col">
                    <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                        <h2 className="font-semibold text-sm">Últimos escaneos</h2>
                        {scanHistory.length > 0 && (
                            <button
                                className="text-xs text-white/30 hover:text-white/60"
                                onClick={() => { setScanHistory([]); setLastResult(null); }}
                            >
                                Limpiar
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {scanHistory.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                                <ScanLine size={32} className="text-white/20" />
                                <p className="text-sm text-white/30">Los resultados aparecerán aquí</p>
                            </div>
                        ) : (
                            scanHistory.map((r, i) => <ScanResultCard key={i} result={r} />)
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
