import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Megaphone, Copy, TrendingUp, Wallet, Calendar, PoundSterling } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const TIER_LABELS: Record<string, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  diamond: "Diamond",
};

export default function RrpDashboard() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading } = useAuth();

  const dashQuery = trpc.rrp.getMyDashboard.useQuery(undefined, { enabled: isAuthenticated });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Sign in to view your RRP dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="btn-vibrant w-full" onClick={() => setLocation("/login?redirect=/rrp-dashboard")}>
              Sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (dashQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const data = dashQuery.data;

  if (!data) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12">
        <div className="container max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>You are not an RRP yet</CardTitle>
              <CardDescription>Apply to become an RRP to start earning money selling tickets.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="btn-vibrant" onClick={() => setLocation("/become-rrp")}>
                <Megaphone className="h-4 w-4 mr-2" /> Apply as RRP
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { profile, currentTier, nextTier, sales, assignments } = data;
  const progressPct = nextTier
    ? Math.min(100, Math.round(((profile.lifetimeSales - currentTier.minSales) / (nextTier.minSales - currentTier.minSales)) * 100))
    : 100;
  const remainingToNext = nextTier ? Math.max(0, nextTier.minSales - profile.lifetimeSales) : 0;

  const shareableLink = `${window.location.origin}/?ref=${profile.code}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(profile.code);
    toast.success("Code copied");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableLink);
    toast.success("Link copied");
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#FA3698] to-[#FD4D43]">
            <Megaphone className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">RRP Dashboard</h1>
            <p className="text-foreground/60">Your sales control panel</p>
          </div>
        </div>

        {/* Top stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-accent/30 bg-gradient-to-br from-accent/10 to-transparent">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs text-foreground/60">
                <Megaphone className="h-3.5 w-3.5" /> Your code
              </div>
              <div className="font-mono text-2xl font-bold text-accent tracking-wider">
                {profile.code}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleCopyCode} className="h-8 text-xs">
                  <Copy className="h-3 w-3 mr-1.5" /> Code
                </Button>
                <Button size="sm" variant="outline" onClick={handleCopyLink} className="h-8 text-xs">
                  <Copy className="h-3 w-3 mr-1.5" /> Link
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs text-foreground/60">
                <TrendingUp className="h-3.5 w-3.5" /> Current tier
              </div>
              <div className="text-2xl font-bold">{currentTier.label}</div>
              <Badge className="bg-gradient-to-r from-[#FA3698] to-purple-600 text-white border-0">
                minimum {currentTier.minCommissionPct}%
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs text-foreground/60">
                <Wallet className="h-3.5 w-3.5" /> Total earned
              </div>
              <div className="text-2xl font-bold">£{parseFloat(String(profile.lifetimeEarnings)).toFixed(2)}</div>
              <div className="text-xs text-foreground/60">{profile.lifetimeSales} total sales</div>
            </CardContent>
          </Card>
        </div>

        {/* Tier progress */}
        {nextTier && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progress to {nextTier.label}</CardTitle>
              <CardDescription>
                You need <strong>{remainingToNext}</strong> more sales to reach {nextTier.label} (min {nextTier.minCommissionPct}% commission)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={progressPct} className="h-3" />
              <div className="flex justify-between text-xs text-foreground/60 mt-2">
                <span>{profile.lifetimeSales} sales</span>
                <span>{nextTier.minSales} sales</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Eventos asignados */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent" />
              <CardTitle className="text-lg">Events where you can sell</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <p className="text-center py-6 text-sm text-foreground/50">
                You have not been assigned to any events yet. Event creators will add you when they want you to sell with your code.
              </p>
            ) : (
              <div className="divide-y divide-border/40">
                {assignments.map((a) => (
                  <div key={`${a.eventId}`} className="py-3 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="font-medium">{a.eventTitle}</div>
                      <div className="text-xs text-foreground/60">
                        {a.eventDate ? new Date(a.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""}
                      </div>
                    </div>
                    <div className="flex gap-3 text-xs">
                      <span>📉 Cliente: <strong>{a.customerDiscountPct}%</strong></span>
                      <span>💰 Your commission: <strong>{a.rrpCommissionPct}%</strong></span>
                      {!a.active && <Badge variant="outline">Inactivo</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ventas recientes */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PoundSterling className="h-5 w-5 text-accent" />
              <CardTitle className="text-lg">Ventas recientes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {sales.length === 0 ? (
              <p className="text-center py-6 text-sm text-foreground/50">
                No sales yet. Share your code with friends and contacts to get started.
              </p>
            ) : (
              <div className="divide-y divide-border/40">
                {sales.map((s: any) => (
                  <div key={s.id} className="py-3 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="font-medium text-sm">{s.eventTitle}</div>
                      <div className="text-xs text-foreground/60">
                        {new Date(s.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · {s.commissionPct}% commission
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-500">+£{parseFloat(String(s.rrpCommission)).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-5 flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="font-semibold">💰 Withdraw commissions</div>
              <div className="text-sm text-foreground/60">Manage payments and withdrawals in Earnings</div>
            </div>
            <Button onClick={() => setLocation("/earnings")} className="btn-vibrant">
              Go to Earnings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
