import { trpc } from "@/lib/trpc";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Banknote,
  ExternalLink,
  Search,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function AdminWithdrawals() {
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "paid" | "rejected">("pending");

  const { data: requests, isLoading, refetch } = trpc.financials.adminListWithdrawals.useQuery();

  const updateWithdrawal = trpc.financials.adminUpdateWithdrawal.useMutation({
    onSuccess: () => {
      toast.success("Solicitud actualizada correctamente.");
      setSelectedRequest(null);
      setAdminNotes("");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const handleUpdate = (status: "paid" | "rejected" | "approved") => {
    if (!selectedRequest) return;
    updateWithdrawal.mutate({
      requestId: selectedRequest.request.id,
      status,
      adminNotes
    });
  };

  const formatCurrency = (val: string | number) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(num);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const filteredRequests = requests?.filter(r => {
    if (filter === "all") return true;
    return r.request.status === filter;
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-white/5 rounded-lg" />
        <div className="h-96 bg-white/5 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Gestión de Retiros</h1>
          <p className="text-white/40 mt-1">Revisa y procesa las solicitudes de pago de los profesores.</p>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          {(["all", "pending", "paid", "rejected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                filter === f ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
              }`}
            >
              {f === "all" ? "Todos" : f === "pending" ? "Pendientes" : f === "paid" ? "Pagados" : "Rechazados"}
            </button>
          ))}
        </div>
      </div>

      {/* Main List */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white/5 text-white/40 border-b border-white/10">
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Usuario</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Monto</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Fecha Solicitud</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Estado</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {!filteredRequests || filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-white/20 italic">
                    No se encontraron solicitudes con este filtro.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => (
                  <tr key={r.request.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 border border-white/10">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="text-white font-bold">{r.user?.name || "Eliminado"}</p>
                          <p className="text-white/30 text-xs">{r.user?.email || "sin email"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white font-bold text-lg">
                      {formatCurrency(r.request.amount)}
                    </td>
                    <td className="px-6 py-4 text-white/50">
                      {formatDate(r.request.requestedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                        r.request.status === "paid" 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                          : r.request.status === "pending"
                          ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>
                        {r.request.status === "paid" ? "Pagado" : r.request.status === "pending" ? "Pendiente" : "Rechazado"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {r.request.status === "pending" ? (
                        <Button 
                          onClick={() => setSelectedRequest(r)}
                          variant="ghost" 
                          size="sm"
                          className="text-[#FA3698] hover:text-white hover:bg-[#FA3698] border border-[#FA3698]/20 rounded-lg h-9"
                        >
                          Gestionar
                        </Button>
                      ) : (
                        <div className="flex justify-end gap-2 text-white/25">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedRequest(r)} className="hover:bg-white/5">
                            <ExternalLink size={16} />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Management Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="bg-[#0f0f0f] border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Gestionar Retiro #{selectedRequest?.request.id}</DialogTitle>
            <DialogDescription className="text-white/40">
              Verifica que has realizado el pago externamente antes de marcarlo como "Pagado".
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="py-6 space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FA3698] to-[#FD4D43] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[#FA3698]/20">
                  <Banknote size={24} />
                </div>
                <div>
                  <p className="text-white font-bold text-2xl">{formatCurrency(selectedRequest.request.amount)}</p>
                  <p className="text-white/40 text-xs">Solicitado por {selectedRequest.user?.name}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60 ml-1">Notas Administrativas (Opcional)</label>
                <Textarea
                  placeholder="Ej: Transferencia realizada via Wise. Referencia: 123456"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="bg-white/5 border-white/10 focus:border-[#FA3698]/50 min-h-[100px] rounded-xl"
                />
              </div>

              {selectedRequest.request.status !== "pending" && (
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex gap-3 text-blue-400">
                  <AlertCircle size={20} className="shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold uppercase tracking-wider mb-1">Información de procesamiento</p>
                    <p>Esta solicitud fue procesada el {formatDate(selectedRequest.request.processedAt)} con el estado <span className="font-bold">{selectedRequest.request.status}</span>.</p>
                    {selectedRequest.request.adminNotes && (
                      <p className="mt-2 text-white/50">Nota: {selectedRequest.request.adminNotes}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-between">
            {selectedRequest?.request.status === "pending" ? (
              <>
                <Button 
                  disabled={updateWithdrawal.isPending}
                  onClick={() => handleUpdate("rejected")}
                  variant="ghost" 
                  className="text-red-400 hover:text-white hover:bg-red-500/20 border border-red-500/20 rounded-xl px-6"
                >
                  <XCircle size={16} className="mr-2" />
                  Rechazar
                </Button>
                <Button 
                  disabled={updateWithdrawal.isPending}
                  onClick={() => handleUpdate("paid")}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-8 flex-1"
                >
                  <CheckCircle2 size={16} className="mr-2" />
                  Marcar como Pagado
                </Button>
              </>
            ) : (
              <Button onClick={() => setSelectedRequest(null)} className="w-full bg-white/10 hover:bg-white/20 text-white rounded-xl">
                Cerrar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
