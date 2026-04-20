import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, Loader2, Check, X, UserPlus, Clock, Users } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const TIER_LABELS: Record<string, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  diamond: "Diamond",
};

export default function AdminRrpSection() {
  const utils = trpc.useUtils();

  const pendingQuery = trpc.rrp.listApplications.useQuery({ status: "pending" });
  const rrpListQuery = trpc.rrp.adminList.useQuery();

  const [rejectReason, setRejectReason] = useState<Record<number, string>>({});
  const [manualUserId, setManualUserId] = useState("");

  const approveMutation = trpc.rrp.approveApplication.useMutation({
    onSuccess: (res: any) => {
      toast.success(`✅ RRP approved — code: ${res.code}`);
      utils.rrp.listApplications.invalidate();
      utils.rrp.adminList.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const rejectMutation = trpc.rrp.rejectApplication.useMutation({
    onSuccess: () => {
      toast.success("Application rejected");
      utils.rrp.listApplications.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const createForUserMutation = trpc.rrp.createForUser.useMutation({
    onSuccess: (res: any) => {
      if (res.alreadyExisted) {
        toast.info(`User is already an RRP — code: ${res.code}`);
      } else {
        toast.success(`✅ RRP created — code: ${res.code}`);
      }
      setManualUserId("");
      utils.rrp.adminList.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const pending = pendingQuery.data ?? [];
  const rrps = rrpListQuery.data ?? [];

  return (
    <div className="space-y-6">
      {/* Pending applications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <CardTitle>Pending RRP applications</CardTitle>
              <Badge variant="secondary">{pending.length}</Badge>
            </div>
          </div>
          <CardDescription>Approve or reject applications to become RRP.</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingQuery.isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : pending.length === 0 ? (
            <p className="text-center text-sm text-foreground/50 py-6">No pending applications.</p>
          ) : (
            <div className="space-y-3">
              {pending.map((a: any) => (
                <div key={a.id} className="rounded-lg border border-border/50 bg-background/30 p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="font-semibold">{a.userName || "—"}</div>
                      <div className="text-xs text-foreground/60">{a.userEmail}</div>
                    </div>
                    <div className="text-xs text-foreground/50">
                      {new Date(a.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                  {a.motivation && (
                    <div className="text-sm bg-background/40 border border-border/40 rounded p-3">
                      {a.motivation}
                    </div>
                  )}
                  <div className="flex gap-3 text-xs text-foreground/60 flex-wrap">
                    {a.socialHandle && <span>📱 {a.socialHandle}</span>}
                    {a.phone && <span>📞 {a.phone}</span>}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 text-white"
                      onClick={() => approveMutation.mutate({ applicationId: a.id })}
                      disabled={approveMutation.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Input
                      placeholder="Rejection reason (optional)"
                      value={rejectReason[a.id] || ""}
                      onChange={(e) => setRejectReason({ ...rejectReason, [a.id]: e.target.value })}
                      className="flex-1 min-w-[200px] h-8 text-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500 hover:text-red-400 hover:border-red-500/50"
                      onClick={() => rejectMutation.mutate({ applicationId: a.id, adminNotes: rejectReason[a.id] })}
                      disabled={rejectMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual creation */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-accent" />
            <CardTitle>Create RRP manually</CardTitle>
          </div>
          <CardDescription>Assign the RRP role to an existing user, skipping the application. Code is auto-generated.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Input
              placeholder="User ID (from the users table)"
              type="number"
              value={manualUserId}
              onChange={(e) => setManualUserId(e.target.value)}
              className="flex-1 min-w-[200px]"
            />
            <Button
              onClick={() => {
                const id = parseInt(manualUserId);
                if (isNaN(id)) {
                  toast.error("Enter a valid userId");
                  return;
                }
                createForUserMutation.mutate({ userId: id });
              }}
              disabled={createForUserMutation.isPending || !manualUserId}
              className="btn-vibrant"
            >
              {createForUserMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4 mr-2" /> Create RRP</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current RRPs */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-accent" />
            <CardTitle>Active RRPs</CardTitle>
            <Badge variant="secondary">{rrps.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {rrpListQuery.isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : rrps.length === 0 ? (
            <p className="text-center text-sm text-foreground/50 py-6">No RRPs yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-left">
                    <th className="py-2 px-3 font-semibold">Name</th>
                    <th className="py-2 px-3 font-semibold">Email</th>
                    <th className="py-2 px-3 font-semibold">Code</th>
                    <th className="py-2 px-3 font-semibold">Tier</th>
                    <th className="py-2 px-3 font-semibold text-right">Ventas</th>
                    <th className="py-2 px-3 font-semibold text-right">Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {rrps.map((r: any) => (
                    <tr key={r.userId} className="border-b border-border/30">
                      <td className="py-2 px-3">{r.name}</td>
                      <td className="py-2 px-3 text-accent text-xs">{r.email}</td>
                      <td className="py-2 px-3 font-mono">{r.code}</td>
                      <td className="py-2 px-3">
                        <Badge variant="outline">{TIER_LABELS[r.tier] ?? r.tier}</Badge>
                      </td>
                      <td className="py-2 px-3 text-right">{r.lifetimeSales}</td>
                      <td className="py-2 px-3 text-right">£{parseFloat(String(r.lifetimeEarnings)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
