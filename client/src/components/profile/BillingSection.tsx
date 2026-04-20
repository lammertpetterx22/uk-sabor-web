import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Zap, Star, Crown, Building2, ExternalLink, Calendar, TrendingUp, AlertCircle } from "lucide-react";
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

export default function BillingSection() {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
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
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-1">Suscripción y Facturación</h3>
        <p className="text-zinc-400 text-sm">Gestiona tu plan y detalles de pago.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Current Plan Card */}
        <Card className="border-zinc-700 bg-zinc-900/50">
          <CardHeader className="pb-3 border-b border-zinc-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon className={`w-6 h-6 ${planColor}`} />
                <div>
                  <CardTitle className="text-white text-lg">Plan actual</CardTitle>
                  <p className="text-zinc-400 text-xs mt-0.5">{mySubscription?.plan.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-xl font-bold ${planColor}`}>
                  {mySubscription?.plan.name}
                </div>
                <div className="text-zinc-500 text-xs">
                  {mySubscription?.plan.priceGBP === 0
                    ? "Gratis"
                    : `£${mySubscription?.plan.priceGBP}/month`}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {/* Subscription status */}
            {sub && (
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className={STATUS_COLORS[sub.status] ?? STATUS_COLORS.incomplete}>
                  {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                </Badge>
                {sub.currentPeriodEnd && (
                  <span className="text-zinc-400 text-xs flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {sub.cancelAtPeriodEnd
                      ? `Cancela el ${new Date(sub.currentPeriodEnd).toLocaleDateString("es-ES")}`
                      : `Renueva el ${new Date(sub.currentPeriodEnd).toLocaleDateString("es-ES")}`}
                  </span>
                )}
                {sub.cancelAtPeriodEnd && (
                  <Badge className="bg-red-700/30 text-red-300 border-red-700/40 text-xs">
                    Cancelación programada
                  </Badge>
                )}
              </div>
            )}

            {/* Commission rate */}
            <div className="bg-black/20 rounded-lg p-3 text-sm space-y-2 border border-zinc-800/50">
              <div className="flex justify-between text-zinc-300">
                <span>Comisión por ticket</span>
                <span className="font-semibold text-white">
                  {Math.round((mySubscription?.plan.commissionRate ?? 0.08) * 100)}%
                </span>
              </div>
              <p className="text-zinc-500 text-[10px] italic">
                La comisión se suma al total del comprador — tú recibes el precio íntegro del ticket.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 flex-wrap pt-2">
              <Button
                size="sm"
                className="btn-vibrant"
                onClick={() => navigate("/pricing?from_billing=true")}
              >
                Cambiar de plan
              </Button>
              {sub?.stripeSubscriptionId && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  onClick={() => portalMutation.mutate({ origin: window.location.origin })}
                  disabled={portalMutation.isPending}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {portalMutation.isPending ? "Abriendo..." : "Gestionar pagos"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage Card */}
        <Card className="border-zinc-700 bg-zinc-900/50">
          <CardHeader className="pb-3 border-b border-zinc-800/50">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-zinc-400" />
              <CardTitle className="text-white text-base">Uso actual</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <UsageBar
              label="Events este month"
              used={usage?.eventsThisMonth ?? 0}
              limit={limits?.eventsPerMonth ?? null}
            />
            <UsageBar
              label="Classs semanales"
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
              <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-800/30 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>La creación de courses no is incluida en tu plan. Pásate a Academy para activarla.</span>
              </div>
            )}

            {/* Upgrade nudge */}
            {(canCreate?.event?.allowed === false || canCreate?.class?.allowed === false) && (
              <div className="bg-orange-950/20 border border-orange-900/30 rounded-lg p-3 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-orange-400 font-medium text-xs">Has alcanzado el límite de tu plan</p>
                  <p className="text-orange-500/60 text-[10px] mt-1">
                    {canCreate?.event?.allowed === false && "No puedes crear more events este month. "}
                    {canCreate?.class?.allowed === false && "No puedes añadir more classs semanales. "}
                    Mejora tu plan para continuar.
                  </p>
                  <Button
                    size="sm"
                    className="mt-2 bg-orange-700 hover:bg-orange-600 h-7 text-[10px]"
                    onClick={() => navigate("/pricing")}
                  >
                    Ver planes
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
