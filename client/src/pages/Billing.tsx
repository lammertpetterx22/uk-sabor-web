import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Zap, Star, Crown, Building2, Lock, ExternalLink, Calendar, TrendingUp, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useEffect } from "react";

const PLAN_ICONS = {
  starter: Zap,
  creator: Star,
  promoter_plan: Crown,
  academy: Building2,
};

const PLAN_COLORS = {
  starter: "text-zinc-300",
  creator: "text-pink-400",
  promoter_plan: "text-orange-400",
  academy: "text-yellow-400",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-700/30 text-green-300 border-green-700/40",
  cancelled: "bg-red-700/30 text-red-300 border-red-700/40",
  past_due: "bg-yellow-700/30 text-yellow-300 border-yellow-700/40",
  trialing: "bg-blue-700/30 text-blue-300 border-blue-700/40",
  incomplete: "bg-zinc-700/30 text-zinc-300 border-zinc-700/40",
};

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const unlimited = limit === null || limit === -1;
  const pct = unlimited ? 100 : Math.min(100, Math.round((used / limit) * 100));
  const nearLimit = !unlimited && pct >= 80;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end text-sm">
        <span className="text-zinc-400 font-medium">{label}</span>
        <div className="text-right">
          <span className={`text-lg font-bold ${unlimited ? "text-pink-400" : nearLimit ? "text-orange-400" : "text-zinc-100"}`}>
            {used}
          </span>
          <span className="text-zinc-500 mx-1.5 prose-sm">/</span>
          <span className={`text-base font-semibold ${unlimited ? "text-pink-400/80" : "text-zinc-400"}`}>
            {unlimited ? "∞" : limit}
          </span>
        </div>
      </div>
      <div className="relative group">
        <Progress
          value={pct}
          className={`h-1.5 transition-all duration-500 rounded-full bg-zinc-800 ${
            unlimited 
              ? "[&>div]:bg-gradient-to-r [&>div]:from-pink-500 [&>div]:to-purple-600 [&>div]:shadow-[0_0_8px_rgba(219,39,119,0.5)]" 
              : nearLimit 
                ? "[&>div]:bg-orange-500" 
                : "[&>div]:bg-zinc-600"
          }`}
        />
        {unlimited && (
          <div className="absolute -inset-1 bg-pink-500/10 blur-md rounded-full -z-10 group-hover:bg-pink-500/20 transition-all" />
        )}
      </div>
    </div>
  );
}

export default function Billing() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: mySubscription, isLoading, refetch } = trpc.subscriptions.getMySubscription.useQuery(undefined, {
    enabled: !!user,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromCheckout = params.get("success") === "1" || params.get("from_checkout") === "true" || params.get("session_id");

    if (fromCheckout) {
      const timer = setTimeout(() => {
        refetch();
        utils.subscriptions.getMySubscription.invalidate();
        toast.success("Subscription updated!");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [refetch, utils]);

  useEffect(() => {
    const handleFocus = () => {
      refetch();
      utils.subscriptions.getMySubscription.invalidate();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refetch, utils]);

  const portalMutation = trpc.subscriptions.createBillingPortal.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.info("Opening billing portal...");
        window.open(data.url, "_blank");
        setTimeout(() => {
          refetch();
          utils.subscriptions.getMySubscription.invalidate();
        }, 2000);
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to open billing portal.");
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <Lock className="w-12 h-12 mx-auto mb-3 text-foreground/30" />
            <CardTitle>Sign in required</CardTitle>
          </CardHeader>
          <div className="p-6 pt-0">
            <Button className="w-full btn-vibrant" onClick={() => navigate("/login")}>Sign In</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-zinc-400">Loading billing information...</div>
      </div>
    );
  }

  const planKey = (mySubscription?.plan.key ?? "starter") as keyof typeof PLAN_ICONS;
  const Icon = PLAN_ICONS[planKey];
  const planColor = PLAN_COLORS[planKey];
  const sub = mySubscription?.subscription;
  const usage = mySubscription?.usage;
  const limits = mySubscription?.plan.limits;
  const canCreate = mySubscription?.canCreate;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-12 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Billing</h1>
          <p className="text-zinc-400">Manage your subscription plan and billing details.</p>
        </div>

        <div className="space-y-6">
          {/* Current Plan Card */}
          <Card className="border-zinc-700 bg-zinc-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className={`w-6 h-6 ${planColor}`} />
                  <div>
                    <CardTitle className="text-white text-xl">Current plan</CardTitle>
                    <p className="text-zinc-400 text-sm mt-0.5">{mySubscription?.plan.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${planColor}`}>
                    {mySubscription?.plan.name}
                  </div>
                  <div className="text-zinc-400 text-sm">
                    {mySubscription?.plan.priceGBP === 0
                      ? "Free"
                      : `£${mySubscription?.plan.priceGBP}/month`}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Subscription status */}
              {sub && (
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge className={STATUS_COLORS[sub.status] ?? STATUS_COLORS.incomplete}>
                    {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                  </Badge>
                  {sub.currentPeriodEnd && (
                    <span className="text-zinc-400 text-sm flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {sub.cancelAtPeriodEnd
                        ? `Cancels on ${new Date(sub.currentPeriodEnd).toLocaleDateString("en-GB")}`
                        : `Renews on ${new Date(sub.currentPeriodEnd).toLocaleDateString("en-GB")}`}
                    </span>
                  )}
                  {sub.cancelAtPeriodEnd && (
                    <Badge className="bg-red-700/30 text-red-300 border-red-700/40 text-xs">
                      Cancellation scheduled
                    </Badge>
                  )}
                </div>
              )}

              {/* Commission rate + billing interval */}
              <div className="bg-black/20 rounded-lg p-3 text-sm space-y-2">
                <div className="flex justify-between text-zinc-300">
                  <span>Ticket commission rate</span>
                  <span className="font-semibold text-white">
                    {Math.round((mySubscription?.plan.commissionRate ?? 0.08) * 100)}%
                  </span>
                </div>
                {sub?.stripeSubscriptionId && (
                  <div className="flex justify-between text-zinc-300">
                    <span>Billing interval</span>
                    <span className="font-semibold text-white capitalize">
                      {sub.currentPeriodEnd && sub.currentPeriodEnd
                        ? (() => {
                          const periodMs = new Date(sub.currentPeriodEnd).getTime() - Date.now();
                          return periodMs > 60 * 24 * 60 * 60 * 1000 ? "Yearly" : "Monthly";
                        })()
                        : "Monthly"}
                    </span>
                  </div>
                )}
                <p className="text-zinc-500 text-xs mt-1">
                  Commission is added to the buyer's checkout total — you receive the full ticket price.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 flex-wrap">
                <Button
                  className="bg-pink-600 hover:bg-pink-500 text-white"
                  onClick={() => navigate("/pricing?from_billing=true")}
                >
                  Upgrade plan
                </Button>
                {sub?.stripeSubscriptionId && (
                  <Button
                    variant="outline"
                    className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                    onClick={() => portalMutation.mutate({ origin: window.location.origin })}
                    disabled={portalMutation.isPending}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {portalMutation.isPending ? "Opening..." : "Manage billing"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Usage Card */}
          <Card className="border-zinc-700 bg-zinc-900">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-zinc-400" />
                <CardTitle className="text-white">Current usage</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <UsageBar
                label="Events this month"
                used={usage?.eventsThisMonth ?? 0}
                limit={limits?.eventsPerMonth ?? null}
              />
              <UsageBar
                label="Weekly classes"
                used={usage?.totalClasses ?? 0}
                limit={limits?.weeklyClasses ?? null}
              />
              {(limits?.courses !== undefined && limits.courses !== null && limits.courses > 0) || limits?.courses === null ? (
                <UsageBar
                  label="Courses"
                  used={usage?.totalCourses ?? 0}
                  limit={limits?.courses ?? null}
                />
              ) : (
                <div className="flex items-center gap-2 text-sm text-zinc-500 bg-zinc-800/50 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Course creation is not included in your current plan. Upgrade to Academy to create courses.</span>
                </div>
              )}

              {/* Upgrade nudge */}
              {(canCreate?.event?.allowed === false || canCreate?.class?.allowed === false) && (
                <div className="bg-orange-950/30 border border-orange-700/40 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-orange-300 font-medium text-sm">You've reached your plan limit</p>
                    <p className="text-orange-400/80 text-xs mt-1">
                      {canCreate?.event?.allowed === false && "You can't create more events this month. "}
                      {canCreate?.class?.allowed === false && "You can't add more weekly classes. "}
                      Upgrade your plan to continue.
                    </p>
                    <Button
                      size="sm"
                      className="mt-2 bg-orange-600 hover:bg-orange-500 text-white"
                      onClick={() => navigate("/pricing")}
                    >
                      View plans
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Plan features summary */}
          <Card className="border-zinc-700 bg-zinc-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">What's included in your plan</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {mySubscription?.plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-zinc-300">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
