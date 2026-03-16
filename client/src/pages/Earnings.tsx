import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  History,
  TrendingUp,
  AlertCircle,
  Banknote,
  GraduationCap,
  Sparkles,
  Ticket,
  Users
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/hooks/useTranslations";

export default function Earnings() {
  const { user } = useAuth();
  const { t } = useTranslations();
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showTestData, setShowTestData] = useState(true); // Toggle to show/hide test earnings

  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = trpc.financials.getWallet.useQuery();
  const { data: ledger, isLoading: ledgerLoading, refetch: refetchLedger } = trpc.financials.getLedger.useQuery({ limit: 50 });
  const { data: withdrawals } = trpc.financials.getMyWithdrawals.useQuery();
  const { data: courseSales, isLoading: salesLoading } = trpc.financials.getCourseSales.useQuery();
  const { data: eventSales, isLoading: eventSalesLoading } = trpc.financials.getEventSales.useQuery();
  const { data: classSales, isLoading: classSalesLoading } = trpc.financials.getClassSales.useQuery();

  const requestWithdrawal = trpc.financials.requestWithdrawal.useMutation({
    onSuccess: () => {
      toast.success(t('earnings.withdrawalRequested'));
      setIsWithdrawModalOpen(false);
      setWithdrawAmount("");
      refetchWallet();
      refetchLedger();
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error(t('earnings.invalidAmount'));
      return;
    }
    requestWithdrawal.mutate({ amount });
  };

  const formatCurrency = (val: string | number | null | undefined) => {
    const num = typeof val === "string" ? parseFloat(val) : (val || 0);
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

  if (walletLoading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-white/5 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl" />)}
        </div>
        <div className="h-64 bg-white/5 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{t('earnings.title')}</h1>
          <p className="text-white/40 mt-1">{t('earnings.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Test Mode Toggle - Show during development */}
          <button
            onClick={() => setShowTestData(!showTestData)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
              showTestData
                ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
            }`}
            title={showTestData ? 'Hide test earnings' : 'Show test earnings'}
          >
            <AlertCircle size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">
              {showTestData ? 'Test Mode: ON' : 'Test Mode: OFF'}
            </span>
          </button>

          <button
            onClick={() => setIsWithdrawModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#FA3698] to-[#FD4D43] text-white font-bold rounded-xl shadow-lg hover:shadow-[#FA3698]/20 transition-all active:scale-95"
          >
            <Banknote size={20} />
            {t('earnings.withdrawFunds')}
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative group overflow-hidden bg-white/5 border border-white/10 rounded-2xl p-6 transition-all hover:border-[#FA3698]/30">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet size={80} className="text-[#FA3698]" />
          </div>
          <p className="text-sm font-medium text-white/50 mb-1">{t('earnings.availableBalance')}</p>
          <h2 className="text-4xl font-bold text-white">{formatCurrency(wallet?.currentBalance)}</h2>
          <div className="mt-4 flex items-center gap-2 text-[#4ADE80] text-xs font-semibold">
            <TrendingUp size={14} />
            <span>{t('earnings.settledFunds')}</span>
          </div>
        </div>

        <div className="relative group overflow-hidden bg-white/5 border border-white/10 rounded-2xl p-6 transition-all hover:border-[#FACC15]/30">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock size={80} className="text-[#FACC15]" />
          </div>
          <p className="text-sm font-medium text-white/50 mb-1">{t('earnings.pendingBalance')}</p>
          <h2 className="text-4xl font-bold text-white">{formatCurrency(wallet?.pendingBalance)}</h2>
          <div className="mt-4 flex items-center gap-2 text-[#FACC15] text-xs font-semibold">
            <AlertCircle size={14} />
            <span>{t('earnings.upcomingAvailable')}</span>
          </div>
        </div>

        <div className="relative group overflow-hidden bg-white/5 border border-white/10 rounded-2xl p-6 transition-all hover:border-white/20">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <History size={80} className="text-white" />
          </div>
          <p className="text-sm font-medium text-white/50 mb-1">{t('earnings.totalEarned')}</p>
          <h2 className="text-4xl font-bold text-white tracking-tight">{formatCurrency(wallet?.totalEarned)}</h2>
          <p className="mt-4 text-white/30 text-[11px] uppercase tracking-wider font-bold">{t('earnings.totalHistorical')}</p>
        </div>

        {/* Dynamic Plan Commission Info */}
        <div className="md:col-span-3 relative group overflow-hidden bg-accent/5 border border-accent/20 rounded-2xl p-6 transition-all">
           <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                 <div className="p-3 rounded-2xl bg-accent/10">
                    <Sparkles className="text-accent h-8 w-8" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-white">{t('earnings.yourPlan')}: <span className="text-accent uppercase">{user?.subscriptionPlan || 'Starter'}</span></h3>
                    <p className="text-white/40 text-sm">{t('earnings.commissionRate')}: <span className="text-white font-bold">{
                      user?.subscriptionPlan === 'academy' ? '0%' :
                      user?.subscriptionPlan === 'promoter_plan' ? '5%' :
                      user?.subscriptionPlan === 'creator' ? '10%' : '15%'
                    }</span></p>
                 </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                 {['Starter (15%)', 'Creator (10%)', 'Promoter (5%)', 'Academy (0%)'].map((p, i) => (
                   <div key={i} className={`px-4 py-2 rounded-xl text-xs font-bold border ${
                     p.toLowerCase().includes(user?.subscriptionPlan || 'starter')
                     ? 'bg-accent/20 border-accent text-accent'
                     : 'bg-white/5 border-white/10 text-white/30'
                   }`}>
                     {p}
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ledger - Transaction History */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <GraduationCap size={20} className="text-blue-400" />
              <h3 className="text-xl font-bold text-white">{t('earnings.courseSales')}</h3>
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-white/5 text-white/40 border-b border-white/10">
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('earnings.date')}</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('earnings.course')}</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('earnings.price')}</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('earnings.commission')}</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">{t('earnings.earning')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {courseSales?.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-white/20 italic">
                          {t('earnings.noCourseSalesYet')}
                        </td>
                      </tr>
                    ) : (
                      courseSales?.map((sale) => (
                        <tr key={sale.id} className="group hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 text-white/50 whitespace-nowrap">
                            {formatDate(sale.purchasedAt)}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-white font-medium">{sale.courseTitle}</span>
                          </td>
                          <td className="px-6 py-4 text-white/60">
                            {formatCurrency(sale.pricePaid)}
                          </td>
                          <td className="px-6 py-4 text-red-400/60 text-xs">
                            -{formatCurrency(sale.platformFee)}
                          </td>
                          <td className="px-6 py-4 text-right">
                             <span className="text-emerald-400 font-bold">{formatCurrency(sale.instructorEarnings)}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <Ticket size={20} className="text-orange-400" />
              <h3 className="text-xl font-bold text-white">{t('earnings.eventSales')}</h3>
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-white/5 text-white/40 border-b border-white/10">
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('earnings.date')}</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('earnings.event')}</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-center">{t('earnings.quantity')}</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('earnings.price')}</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">{t('earnings.earning')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {eventSales?.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-white/20 italic">
                          {t('earnings.noEventSalesYet')}
                        </td>
                      </tr>
                    ) : (
                      eventSales?.map((sale) => (
                        <tr key={sale.id} className="group hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 text-white/50 whitespace-nowrap">
                            {formatDate(sale.purchasedAt)}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-white font-medium">{sale.eventTitle}</span>
                          </td>
                          <td className="px-6 py-4 text-center text-white/60">
                            {sale.quantity}
                          </td>
                          <td className="px-6 py-4 text-white/60">
                            {formatCurrency(sale.pricePaid)}
                          </td>
                          <td className="px-6 py-4 text-right">
                             <span className="text-emerald-400 font-bold">{formatCurrency(sale.instructorEarnings)}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <Users size={20} className="text-purple-400" />
              <h3 className="text-xl font-bold text-white">{t('earnings.classSales')}</h3>
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-white/5 text-white/40 border-b border-white/10">
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('earnings.date')}</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('earnings.class')}</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('earnings.price')}</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">{t('earnings.earning')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {classSales?.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-white/20 italic">
                          {t('earnings.noClassSalesYet')}
                        </td>
                      </tr>
                    ) : (
                      classSales?.map((sale) => (
                        <tr key={sale.id} className="group hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 text-white/50 whitespace-nowrap">
                            {formatDate(sale.purchasedAt)}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-white font-medium">{sale.classTitle}</span>
                          </td>
                          <td className="px-6 py-4 text-white/60">
                            {formatCurrency(sale.pricePaid)}
                          </td>
                          <td className="px-6 py-4 text-right">
                             <span className="text-emerald-400 font-bold">{formatCurrency(sale.instructorEarnings)}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <History size={20} className="text-[#FA3698]" />
              <h3 className="text-xl font-bold text-white">{t('earnings.walletHistory')}</h3>
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-white/5 text-white/40 border-b border-white/10">
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('earnings.date')}</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('earnings.description')}</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">{t('earnings.amount')}</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">{t('earnings.status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {ledger?.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-white/20 italic">
                          {t('earnings.noTransactionsYet')}
                        </td>
                      </tr>
                    ) : (
                      ledger?.map((tx) => (
                        <tr key={tx.id} className="group hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 text-white/50 whitespace-nowrap">
                            {formatDate(tx.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {tx.type === "earning" ? (
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                  <ArrowDownLeft size={16} />
                                </div>
                              ) : (
                                <div className="p-2 rounded-lg bg-[#FD4D43]/10 text-[#FD4D43]">
                                  <ArrowUpRight size={16} />
                                </div>
                              )}
                              <span className="text-white font-medium">{tx.description}</span>
                            </div>
                          </td>
                          <td className={`px-6 py-4 font-bold ${parseFloat(String(tx.amount)) > 0 ? "text-emerald-400" : "text-[#FD4D43]"}`}>
                            {parseFloat(String(tx.amount)) > 0 ? "+" : ""}{formatCurrency(tx.amount)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                              tx.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : tx.status === "pending"
                                ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}>
                              {tx.status === "completed" && <CheckCircle2 size={10} />}
                              {tx.status === "pending" && <Clock size={10} />}
                              {tx.status === "cancelled" && <XCircle size={10} />}
                              {tx.status === "completed" ? t('earnings.completed') : tx.status === "pending" ? t('earnings.pending') : t('earnings.cancelled')}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawals sidebar */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <ArrowUpRight size={20} className="text-[#FD4D43]" />
            <h3 className="text-xl font-bold text-white">{t('earnings.latestWithdrawals')}</h3>
          </div>

          <div className="space-y-3">
            {withdrawals?.slice(0, 5).map(req => (
              <div key={req.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-bold">{formatCurrency(req.amount)}</p>
                  <p className="text-white/40 text-[10px]">{formatDate(req.requestedAt)}</p>
                </div>
                <div className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                  req.status === "paid" ? "text-emerald-400" : req.status === "rejected" ? "text-[#FD4D43]" : "text-yellow-400"
                }`}>
                  {req.status === "paid" ? t('earnings.paid') : req.status === "rejected" ? t('earnings.rejected') : t('earnings.pending')}
                  {req.status === "paid" && <CheckCircle2 size={12} />}
                  {req.status === "pending" && <Clock size={12} />}
                </div>
              </div>
            ))}
            {(!withdrawals || withdrawals.length === 0) && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-white/20 italic text-sm">
                {t('earnings.noWithdrawalsYet')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Withdrawal Modal */}
      <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
        <DialogContent className="bg-[#0f0f0f] border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{t('earnings.requestWithdrawal')}</DialogTitle>
            <DialogDescription className="text-white/40">
              {t('earnings.withdrawalDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center">
              <span className="text-white/40 text-sm">{t('earnings.available')}:</span>
              <span className="text-white font-bold text-lg">{formatCurrency(wallet?.currentBalance)}</span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60 ml-1">{t('earnings.withdrawalAmount')} (£)</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-white/40 transition-colors">£</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="pl-8 bg-white/5 border-white/10 focus:border-[#FA3698]/50 h-12 rounded-xl text-lg font-medium"
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setWithdrawAmount(wallet?.currentBalance?.toString() || "0")}
                  className="text-[10px] font-bold uppercase text-[#FA3698] hover:text-[#FA3698]/80 transition-colors"
                >
                  {t('earnings.withdrawAll')}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsWithdrawModalOpen(false)} className="rounded-xl border border-white/5 hover:bg-white/5">
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleWithdraw}
              disabled={requestWithdrawal.isPending || !withdrawAmount}
              className="bg-gradient-to-r from-[#FA3698] to-[#FD4D43] text-white hover:shadow-lg hover:shadow-[#FA3698]/20 transition-all rounded-xl px-8"
            >
              {requestWithdrawal.isPending ? t('earnings.processing') : t('earnings.confirmWithdrawal')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
