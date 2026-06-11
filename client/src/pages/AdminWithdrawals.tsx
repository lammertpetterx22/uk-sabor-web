import { trpc } from "@/lib/trpc";
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Banknote,
  ExternalLink,
  Search,
  AlertCircle,
  PlusCircle
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
  const { data: coursePurchases, refetch: refetchPurchases } = trpc.financials.adminListCoursePurchases.useQuery();
  const { data: instructorProfiles, refetch: refetchInstructors } = trpc.financials.adminListInstructors.useQuery();
  const { data: allUsers } = trpc.financials.adminListUsers.useQuery();

  const [creditUserId, setCreditUserId] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditDesc, setCreditDesc] = useState("");

  const [linkInstructorId, setLinkInstructorId] = useState("");
  const [linkUserId, setLinkUserId] = useState("");

  const [stripeUserId, setStripeUserId] = useState("");
  const [stripeAccountId, setStripeAccountId] = useState("");

  const [fixPurchaseId, setFixPurchaseId] = useState("");
  const [fixPricePaid, setFixPricePaid] = useState("");
  const [fixPlatformFee, setFixPlatformFee] = useState("");
  const [fixInstructorEarnings, setFixInstructorEarnings] = useState("");
  const [fixInstructorUserId, setFixInstructorUserId] = useState("");

  const setStripeAccount = trpc.financials.adminSetStripeAccount.useMutation({
    onSuccess: () => {
      toast.success("Stripe account linked successfully");
      setStripeUserId(""); setStripeAccountId("");
      refetchInstructors();
    },
    onError: (err) => toast.error(err.message),
  });

  const linkInstructor = trpc.financials.adminLinkInstructorToUser.useMutation({
    onSuccess: () => {
      toast.success("Instructor linked to user successfully");
      setLinkInstructorId(""); setLinkUserId("");
      refetchInstructors(); refetchPurchases();
    },
    onError: (err) => toast.error(err.message),
  });

  const fixCoursePurchase = trpc.financials.adminFixCoursePurchase.useMutation({
    onSuccess: () => {
      toast.success("Purchase record fixed + earnings credited");
      setFixPurchaseId(""); setFixPricePaid(""); setFixPlatformFee(""); setFixInstructorEarnings(""); setFixInstructorUserId("");
      refetchPurchases();
    },
    onError: (err) => toast.error(err.message),
  });

  const creditEarnings = trpc.financials.adminCreditEarnings.useMutation({
    onSuccess: () => {
      toast.success(`Earnings credited successfully`);
      setCreditUserId(""); setCreditAmount(""); setCreditDesc("");
      refetchPurchases();
    },
    onError: (err) => toast.error(err.message),
  });

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

      {/* ── Instructor Profiles (link userId) ─────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Instructor Profiles</h2>
        <p className="text-white/40 text-sm">If an instructor's earnings show £0, their profile may not be linked to a user account. Fix it below.</p>
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-white/5 text-white/40 border-b border-white/10">
                  <th className="px-4 py-3 text-xs uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider">Linked userId</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider">User name</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider">User email</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider">Stripe account</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider">Stripe status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {!instructorProfiles || instructorProfiles.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-white/20 italic">No instructors</td></tr>
                ) : instructorProfiles.map((instr) => (
                  <tr key={instr.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-white/50 font-mono text-xs">{instr.id}</td>
                    <td className="px-4 py-3 text-white font-bold text-sm">{instr.name}</td>
                    <td className={`px-4 py-3 font-mono text-xs font-bold ${instr.userId ? "text-emerald-400" : "text-red-400"}`}>
                      {instr.userId ?? "NULL ❌"}
                    </td>
                    <td className="px-4 py-3 text-xs text-white/60">{instr.userName ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-white/40">{instr.userEmail ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-purple-300">{instr.stripeAccountId ?? <span className="text-white/20">none</span>}</td>
                    <td className="px-4 py-3 text-xs">
                      {instr.stripeAccountStatus === "verified" ? (
                        <span className="text-emerald-400 font-bold">✓ verified</span>
                      ) : instr.stripeAccountStatus === "pending" ? (
                        <span className="text-amber-400">pending</span>
                      ) : instr.stripeAccountStatus === "restricted" ? (
                        <span className="text-red-400">restricted</span>
                      ) : (
                        <span className="text-white/20">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Link form */}
        <div className="bg-[#0a0a0a] border border-blue-500/30 rounded-2xl p-5 space-y-4">
          <p className="text-sm font-bold text-blue-300">Link Instructor Profile → User Account</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-white/40 mb-1 block">Instructor profile ID (from table above)</label>
              <input
                type="number"
                value={linkInstructorId}
                onChange={(e) => setLinkInstructorId(e.target.value)}
                placeholder="e.g. 3"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">User ID to link to</label>
              <select
                value={linkUserId}
                onChange={(e) => setLinkUserId(e.target.value)}
                className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
              >
                <option value="">— select user —</option>
                {allUsers?.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email}) [id:{u.id}]</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                disabled={linkInstructor.isPending || !linkInstructorId || !linkUserId}
                onClick={() => linkInstructor.mutate({ instructorId: parseInt(linkInstructorId), userId: parseInt(linkUserId) })}
                className="w-full h-10 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition-colors"
              >
                {linkInstructor.isPending ? "Linking…" : "Link Instructor"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Set Stripe Account for Instructor ─────────────────────────── */}
      <div className="bg-[#0a0a0a] border border-purple-500/30 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-purple-400 text-xl">💳</span>
          <h2 className="text-lg font-bold text-white">Link Stripe Account to Instructor</h2>
          <span className="text-xs text-white/30">For instructors who can't self-connect or need manual setup</span>
        </div>
        <ol className="text-xs text-white/40 space-y-1 list-decimal list-inside">
          <li>Go to <strong className="text-white/60">Stripe Dashboard → Connect → Accounts</strong></li>
          <li>Find or create the instructor's Express account and copy the ID (starts with <code className="text-purple-300">acct_</code>)</li>
          <li>Enter the instructor's userId (from the table above) and paste the Stripe account ID below</li>
        </ol>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-white/40 mb-1 block">Instructor userId</label>
            <select
              value={stripeUserId}
              onChange={(e) => setStripeUserId(e.target.value)}
              className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50"
            >
              <option value="">— select user —</option>
              {allUsers?.filter(u => u.role === "instructor" || u.role === "admin").map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email}) [id:{u.id}]</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Stripe Account ID</label>
            <input
              type="text"
              value={stripeAccountId}
              onChange={(e) => setStripeAccountId(e.target.value)}
              placeholder="acct_1ABC123..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <div className="flex items-end">
            <button
              disabled={setStripeAccount.isPending || !stripeUserId || !stripeAccountId.startsWith("acct_")}
              onClick={() => setStripeAccount.mutate({ userId: parseInt(stripeUserId), stripeAccountId })}
              className="w-full h-10 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition-colors"
            >
              {setStripeAccount.isPending ? "Saving…" : "Set Stripe Account"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Course Sales Diagnosis ──────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Course Purchases (recent 50)</h2>
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-white/5 text-white/40 border-b border-white/10">
                  <th className="px-4 py-3 text-xs uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider">Course</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider">Buyer userId</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider">Instructor userId</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider">Paid</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider">Instructor earns</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider">Sub status</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {!coursePurchases || coursePurchases.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-white/20 italic">No purchases</td></tr>
                ) : coursePurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-white/50 font-mono text-xs">{p.id}</td>
                    <td className="px-4 py-3 text-white text-xs max-w-[140px] truncate">{p.courseTitle ?? `#${p.courseId}`}</td>
                    <td className="px-4 py-3 font-mono text-xs text-white/60">{p.userId}</td>
                    <td className={`px-4 py-3 font-mono text-xs font-bold ${p.instructorId ? "text-emerald-400" : "text-red-400"}`}>
                      {p.instructorId ?? "NULL ❌"}
                    </td>
                    <td className="px-4 py-3 text-white text-xs">{formatCurrency(p.pricePaid ?? 0)}</td>
                    <td className={`px-4 py-3 text-xs font-bold ${parseFloat(String(p.instructorEarnings ?? "0")) > 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {formatCurrency(p.instructorEarnings ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-xs text-white/40">{p.subscriptionStatus ?? "one-time"}</td>
                    <td className="px-4 py-3 text-xs text-white/40">{p.purchasedAt ? new Date(p.purchasedAt).toLocaleDateString("en-GB") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Fix Purchase Record ──────────────────────────────────────────── */}
      <div className="bg-[#0a0a0a] border border-orange-500/30 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-orange-400 text-xl">🔧</span>
          <h2 className="text-lg font-bold text-white">Fix Course Purchase Record</h2>
          <span className="text-xs text-white/30">Repair £0 records — updates amounts + credits instructor earnings</span>
        </div>
        <p className="text-xs text-white/40">Use the Purchase ID from the table above. Instructor userId from the Instructor Profiles table.</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="text-xs text-white/40 mb-1 block">Purchase ID</label>
            <input type="number" value={fixPurchaseId} onChange={(e) => setFixPurchaseId(e.target.value)} placeholder="e.g. 1"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50" />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Price paid (£)</label>
            <input type="number" step="0.01" value={fixPricePaid} onChange={(e) => setFixPricePaid(e.target.value)} placeholder="0.80"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50" />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Platform fee (£)</label>
            <input type="number" step="0.01" value={fixPlatformFee} onChange={(e) => setFixPlatformFee(e.target.value)} placeholder="0.12"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50" />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Instructor earns (£)</label>
            <input type="number" step="0.01" value={fixInstructorEarnings} onChange={(e) => setFixInstructorEarnings(e.target.value)} placeholder="0.68"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50" />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Instructor userId</label>
            <select value={fixInstructorUserId} onChange={(e) => setFixInstructorUserId(e.target.value)}
              className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50">
              <option value="">— select —</option>
              {allUsers?.map((u) => <option key={u.id} value={u.id}>{u.name} [id:{u.id}]</option>)}
            </select>
          </div>
        </div>
        <button
          disabled={fixCoursePurchase.isPending || !fixPurchaseId || !fixPricePaid || !fixInstructorEarnings || !fixInstructorUserId}
          onClick={() => fixCoursePurchase.mutate({
            purchaseId: parseInt(fixPurchaseId),
            pricePaid: parseFloat(fixPricePaid),
            platformFee: parseFloat(fixPlatformFee || "0"),
            instructorEarnings: parseFloat(fixInstructorEarnings),
            instructorUserId: parseInt(fixInstructorUserId),
          })}
          className="h-10 px-6 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-black font-bold rounded-xl text-sm transition-colors"
        >
          {fixCoursePurchase.isPending ? "Fixing…" : "Fix Purchase + Credit Earnings"}
        </button>
      </div>

      {/* ── Manual Earnings Credit ──────────────────────────────────────── */}
      <div className="bg-[#0a0a0a] border border-amber-500/30 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <PlusCircle className="text-amber-400" size={20} />
          <h2 className="text-lg font-bold text-white">Manual Earnings Credit</h2>
          <span className="text-xs text-white/30">Use the Instructor userId from the table above</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-white/40 mb-1 block">Instructor userId</label>
            <input
              type="number"
              value={creditUserId}
              onChange={(e) => setCreditUserId(e.target.value)}
              placeholder="e.g. 42"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Amount (GBP)</label>
            <input
              type="number"
              step="0.01"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              placeholder="e.g. 0.68"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div className="md:col-span-1">
            <label className="text-xs text-white/40 mb-1 block">Description</label>
            <input
              type="text"
              value={creditDesc}
              onChange={(e) => setCreditDesc(e.target.value)}
              placeholder="e.g. Backfill: course sale £0.80"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div className="flex items-end">
            <button
              disabled={creditEarnings.isPending || !creditUserId || !creditAmount || !creditDesc}
              onClick={() => creditEarnings.mutate({ userId: parseInt(creditUserId), amount: parseFloat(creditAmount), description: creditDesc })}
              className="w-full h-10 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold rounded-xl text-sm transition-colors"
            >
              {creditEarnings.isPending ? "Crediting…" : "Credit Earnings"}
            </button>
          </div>
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
