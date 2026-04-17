import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  Users,
  Mail,
  Loader2,
  Trash2,
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface GuestListSectionProps {
  /** The event ID — only available when editing an existing event */
  eventId?: number;
}

export default function GuestListSection({ eventId }: GuestListSectionProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const utils = trpc.useUtils();

  const listQuery = trpc.guestList.list.useQuery(
    { eventId: eventId! },
    {
      enabled: !!eventId,
      refetchInterval: 10_000, // auto-refresh every 10s so scans appear live
      refetchOnWindowFocus: true,
    },
  );

  const addMutation = trpc.guestList.add.useMutation({
    onSuccess: (res) => {
      if (res.emailSent) {
        toast.success("✅ Invitado añadido y email enviado");
      } else {
        toast.success("✅ Invitado añadido (email no se pudo enviar)");
      }
      setName("");
      setEmail("");
      utils.guestList.list.invalidate({ eventId: eventId! });
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMutation = trpc.guestList.remove.useMutation({
    onSuccess: () => {
      toast.success("Invitado eliminado");
      utils.guestList.list.invalidate({ eventId: eventId! });
    },
    onError: (err) => toast.error(err.message),
  });

  const resendMutation = trpc.guestList.resend.useMutation({
    onSuccess: (res) => {
      if (res.emailSent) toast.success("📧 Email reenviado");
      else toast.error("No se pudo reenviar el email");
    },
    onError: (err) => toast.error(err.message),
  });

  if (!eventId) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-accent" />
          <h3 className="font-semibold text-foreground">Guest List</h3>
        </div>
        <p className="text-sm text-foreground/60 bg-background/30 border border-border/50 rounded-lg p-4">
          Guarda el evento primero para poder añadir invitados.
        </p>
      </div>
    );
  }

  const handleAdd = () => {
    const n = name.trim();
    const e = email.trim();
    if (!n || !e) {
      toast.error("Nombre y email son requeridos");
      return;
    }
    addMutation.mutate({ eventId, name: n, email: e });
  };

  const stats = listQuery.data?.stats ?? { total: 0, attended: 0, pending: 0, cancelled: 0 };
  const guests = listQuery.data?.guests ?? [];
  const attendancePercent = stats.total > 0 ? Math.round((stats.attended / stats.total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-accent" />
        <h3 className="font-semibold text-foreground">Guest List</h3>
        <Badge variant="secondary" className="ml-1">{stats.total}</Badge>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => listQuery.refetch()}
          disabled={listQuery.isFetching}
          className="ml-auto h-8 px-2 text-foreground/60 hover:text-foreground"
          title="Refrescar lista"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${listQuery.isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>
      <p className="text-xs text-foreground/50 -mt-2">
        Añade invitados (VIP, DJs, amigos) — reciben un QR único por email, gratis, sin pasar por Stripe.
      </p>

      {/* Stats */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-border/50 bg-background/40 p-3">
            <div className="flex items-center gap-2 text-xs text-foreground/60 mb-1">
              <Users className="h-3.5 w-3.5" /> Total
            </div>
            <div className="text-xl font-bold">{stats.total}</div>
          </div>
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
            <div className="flex items-center gap-2 text-xs text-green-400 mb-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Asistieron
            </div>
            <div className="text-xl font-bold text-green-400">
              {stats.attended} <span className="text-xs font-normal">({attendancePercent}%)</span>
            </div>
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <div className="flex items-center gap-2 text-xs text-amber-400 mb-1">
              <Clock className="h-3.5 w-3.5" /> Pendientes
            </div>
            <div className="text-xl font-bold text-amber-400">{stats.pending}</div>
          </div>
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <div className="flex items-center gap-2 text-xs text-red-400 mb-1">
              <XCircle className="h-3.5 w-3.5" /> Canceladas
            </div>
            <div className="text-xl font-bold text-red-400">{stats.cancelled}</div>
          </div>
        </div>
      )}

      {/* Add form */}
      <div className="rounded-xl border border-border/50 bg-background/40 p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="guest-name" className="text-foreground/80 text-sm">Nombre del invitado</Label>
            <Input
              id="guest-name"
              placeholder="Ej: Juan Pérez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background/60 border-border/50"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="guest-email" className="text-foreground/80 text-sm">Email</Label>
            <Input
              id="guest-email"
              type="email"
              placeholder="juan@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background/60 border-border/50"
            />
          </div>
        </div>
        <Button
          type="button"
          onClick={handleAdd}
          disabled={addMutation.isPending || !name.trim() || !email.trim()}
          className="w-full md:w-auto bg-gradient-to-r from-[#FA3698] to-purple-600 hover:from-[#FA3698]/90 hover:to-purple-600/90 text-white border-0"
        >
          {addMutation.isPending ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Añadiendo…</>
          ) : (
            <><UserPlus className="h-4 w-4 mr-2" /> Añadir a Guest List</>
          )}
        </Button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {listQuery.isLoading ? (
          <div className="flex items-center justify-center py-8 text-foreground/50">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando invitados…
          </div>
        ) : guests.length === 0 ? (
          <div className="text-center py-8 text-sm text-foreground/50 border border-dashed border-border/50 rounded-lg">
            Todavía no hay invitados en la guest list
          </div>
        ) : (
          <div className="divide-y divide-border/40 rounded-lg border border-border/50 overflow-hidden">
            {guests.map((g) => {
              const statusLabel = g.status === "used"
                ? { text: "Entró", color: "bg-green-500/15 text-green-400 border-green-500/30", icon: CheckCircle2 }
                : g.status === "cancelled"
                ? { text: "Cancelado", color: "bg-red-500/15 text-red-400 border-red-500/30", icon: XCircle }
                : { text: "Pendiente", color: "bg-amber-500/15 text-amber-400 border-amber-500/30", icon: Clock };
              const StatusIcon = statusLabel.icon;

              return (
                <div
                  key={g.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-background/30"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground truncate">{g.guestName || "—"}</span>
                      <Badge variant="outline" className={`text-xs ${statusLabel.color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" /> {statusLabel.text}
                      </Badge>
                    </div>
                    <div className="text-xs text-foreground/60 flex items-center gap-1 mt-0.5 truncate">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{g.guestEmail}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {g.status === "valid" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => resendMutation.mutate({ ticketId: g.id })}
                        disabled={resendMutation.isPending}
                        title="Reenviar email con QR"
                      >
                        {resendMutation.isPending && resendMutation.variables?.ticketId === g.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                    {g.status !== "cancelled" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm(`¿Quitar a ${g.guestName} de la guest list? Su QR será invalidado.`)) {
                            removeMutation.mutate({ ticketId: g.id });
                          }
                        }}
                        disabled={removeMutation.isPending}
                        className="text-red-500 hover:text-red-400 hover:border-red-500/50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
