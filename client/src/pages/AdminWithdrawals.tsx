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
import { useTranslations } from "@/hooks/useTranslations";

export default function AdminWithdrawals() {
  const { t } = useTranslations();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "paid" | "rejected">("pending");

  const { data: requests, isLoading, refetch } = trpc.financials.adminListWithdrawals.useQuery();

  const updateWithdrawal = trpc.financials.adminUpdateWithdrawal.useMutation({
    onSuccess: () => {
      toast.success(t('withdrawals.updateSuccess'));
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
          <h1 className="text-3xl font-bold text-white tracking-tight">{t('withdrawals.title')}</h1>
          <p className="text-white/40 mt-1">{t('withdrawals.subtitle')}</p>
        </div>

        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          {([{value: "all", label: t('withdrawals.filterAll')}, {value: "pending", label: t('withdrawals.filterPending')}, {value: "paid", label: t('withdrawals.filterPaid')}, {value: "rejected", label: t('withdrawals.filterRejected')}] as const).map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                filter === f.value ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
              }`}
            >
              {f.label}
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
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('withdrawals.user')}</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('withdrawals.amount')}</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('withdrawals.requestDate')}</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('withdrawals.status')}</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">{t('withdrawals.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {!filteredRequests || filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-white/20 italic">
                    {t('withdrawals.noRequests')}
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
                          <p className="text-white font-bold">{r.user?.name || t('withdrawals.deleted')}</p>
                          <p className="text-white/30 text-xs">{r.user?.email || t('withdrawals.noEmail')}</p>
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
                        {r.request.status === "paid" ? t('earnings.paid') : r.request.status === "pending" ? t('earnings.pending') : t('earnings.rejected')}
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
                          {t('withdrawals.manage')}
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
            <DialogTitle className="text-xl font-bold">{t('withdrawals.manage')} #{selectedRequest?.request.id}</DialogTitle>
            <DialogDescription className="text-white/40">
              {t('withdrawals.verifyBeforePaying')}
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
                  <p className="text-white/40 text-xs">{t('withdrawals.requestedBy')} {selectedRequest.user?.name}</p>
                </div>
              </div>

              {/* Bank Details Section */}
              {selectedRequest.request.accountHolderName && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase tracking-wider">
                    <Banknote size={16} />
                    <span>Bank Account Details</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 bg-black/20 rounded-lg p-3">
                    <div>
                      <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Account Holder</p>
                      <p className="text-white font-bold text-lg">{selectedRequest.request.accountHolderName}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Sort Code</p>
                        <p className="text-white font-mono font-bold text-lg tracking-wider">{selectedRequest.request.sortCode}</p>
                      </div>
                      <div>
                        <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Account Number</p>
                        <p className="text-white font-mono font-bold text-lg tracking-wider">{selectedRequest.request.accountNumber}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                    <AlertCircle size={14} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-yellow-200 text-[10px]">
                      Transfer <strong>{formatCurrency(selectedRequest.request.amount)}</strong> to this account via your bank. Mark as "Paid" after completing the transfer.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60 ml-1">{t('withdrawals.adminNotes')} ({t('common.optional')})</label>
                <Textarea
                  placeholder={t('withdrawals.adminNotesPlaceholder')}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="bg-white/5 border-white/10 focus:border-[#FA3698]/50 min-h-[100px] rounded-xl"
                />
              </div>

              {selectedRequest.request.status !== "pending" && (
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex gap-3 text-blue-400">
                  <AlertCircle size={20} className="shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold uppercase tracking-wider mb-1">{t('withdrawals.processingInfo')}</p>
                    <p>{t('withdrawals.processedOn')} {formatDate(selectedRequest.request.processedAt)} {t('withdrawals.withStatus')} <span className="font-bold">{selectedRequest.request.status}</span>.</p>
                    {selectedRequest.request.adminNotes && (
                      <p className="mt-2 text-white/50">{t('withdrawals.note')}: {selectedRequest.request.adminNotes}</p>
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
                  {t('withdrawals.reject')}
                </Button>
                <Button
                  disabled={updateWithdrawal.isPending}
                  onClick={() => handleUpdate("paid")}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-8 flex-1"
                >
                  <CheckCircle2 size={16} className="mr-2" />
                  {t('withdrawals.markAsPaid')}
                </Button>
              </>
            ) : (
              <Button onClick={() => setSelectedRequest(null)} className="w-full bg-white/10 hover:bg-white/20 text-white rounded-xl">
                {t('common.close')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
