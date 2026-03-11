import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Zap, Star, Crown, Building2, ArrowRight, CalendarDays, Loader2 } from "lucide-react";
import { useLocation, Link } from "wouter";
import { toast } from "sonner";

const PLAN_ICONS = {
  starter: Zap,
  creator: Star,
  promoter_plan: Crown,
  academy: Building2,
};

const PLAN_COLORS = {
  starter: "border-zinc-700 bg-zinc-900/50",
  creator: "border-pink-600/50 bg-pink-950/20",
  promoter_plan: "border-orange-500/50 bg-orange-950/20",
  academy: "border-yellow-500/50 bg-yellow-950/20",
};

const PLAN_BADGE_COLORS = {
  starter: "bg-zinc-700 text-zinc-200",
  creator: "bg-pink-700 text-pink-100",
  promoter_plan: "bg-orange-600 text-orange-100",
  academy: "bg-yellow-600 text-yellow-100",
};

const PLAN_BUTTON_STYLES = {
  starter: "bg-zinc-700 hover:bg-zinc-600 text-white",
  creator: "bg-pink-600 hover:bg-pink-500 text-white",
  promoter_plan: "bg-orange-500 hover:bg-orange-400 text-white",
  academy: "bg-yellow-500 hover:bg-yellow-400 text-black",
};

const PLAN_ORDER = ["starter", "creator", "promoter_plan", "academy"];

type PlanKey = "starter" | "creator" | "promoter_plan" | "academy";
type BillingInterval = "monthly" | "yearly";

/** Calculate yearly price with 20% discount (same formula as server) */
function calcYearlyPrice(monthlyGBP: number): number {
  return Math.round(monthlyGBP * 12 * 0.8 * 100) / 100;
}

/** Monthly equivalent when paying yearly */
function yearlyMonthlyEquivalent(monthlyGBP: number): number {
  return Math.round(monthlyGBP * 0.8 * 100) / 100;
}

export default function Pricing() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");

  // Plans are public — no auth required to view
  const { data: plans, isLoading: plansLoading } = trpc.subscriptions.listPlans.useQuery();
  const { data: mySubscription } = trpc.subscriptions.getMySubscription.useQuery(undefined, {
    // Only fetch subscription if user is logged in and is a creator/promoter/admin
    enabled: !!user && ["admin", "instructor", "promoter"].includes(user.role),
  });

  const checkoutMutation = trpc.subscriptions.createSubscriptionCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.info("Redirecting to secure checkout...");
        window.open(data.url, "_blank");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to start checkout. Please try again.");
    },
  });

  const currentPlanKey = mySubscription?.plan.key ?? "starter";

  const handleUpgrade = (planKey: PlanKey) => {
    if (!user) {
      toast.info("Please sign in to subscribe to a plan.");
      navigate("/login");
      return;
    }
    if (planKey === "starter") {
      toast.info("Starter is the free plan — no payment needed.");
      return;
    }
    checkoutMutation.mutate({
      planKey,
      billingInterval,
      origin: window.location.origin,
    });
  };

  const getDisplayPrice = (plan: { priceGBP: number }, interval: BillingInterval) => {
    if (plan.priceGBP === 0) return { price: "Free", suffix: "" };
    if (interval === "yearly") {
      const monthlyEquiv = yearlyMonthlyEquivalent(plan.priceGBP);
      return { price: `£${monthlyEquiv.toFixed(2)}`, suffix: "/ mo, billed yearly" };
    }
    return { price: `£${plan.priceGBP}`, suffix: "/ month" };
  };

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 pt-28 pb-8 text-center">
        <Badge className="mb-4 bg-pink-600/20 text-pink-400 border-pink-600/30">Subscription Plans</Badge>
        <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
          Choose your plan
        </h1>
        <p className="text-foreground/60 text-lg max-w-2xl mx-auto">
          Grow your dance business with the right tools. All plans include ticket sales, QR check-in, and a public creator profile.
        </p>

        {mySubscription && (
          <div className="mt-6 inline-flex items-center gap-2 bg-card border border-border/40 rounded-full px-4 py-2 text-sm text-foreground/70">
            <span>Current plan:</span>
            <span className="font-semibold text-foreground">{mySubscription.plan.name}</span>
            <Button
              variant="ghost"
              size="sm"
              className="text-accent hover:text-accent/80 h-auto p-0 ml-2"
              onClick={() => navigate("/billing")}
            >
              Manage billing →
            </Button>
          </div>
        )}

        {!user && !loading && (
          <div className="mt-6 inline-flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-4 py-2 text-sm text-foreground/70">
            <span>Already an instructor or promoter?</span>
            <Link href="/login" className="text-accent hover:text-accent/80 font-semibold ml-1">Sign in →</Link>
          </div>
        )}

        {/* Billing toggle */}
        <div className="mt-8 inline-flex items-center gap-1 bg-card border border-border/40 rounded-full p-1">
          <button
            onClick={() => setBillingInterval("monthly")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${billingInterval === "monthly"
                ? "bg-foreground text-background shadow"
                : "text-foreground/50 hover:text-foreground"
              }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval("yearly")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${billingInterval === "yearly"
                ? "bg-foreground text-background shadow"
                : "text-foreground/50 hover:text-foreground"
              }`}
          >
            Yearly
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${billingInterval === "yearly"
                ? "bg-green-600 text-white"
                : "bg-green-500/20 text-green-400"
              }`}>
              Save 20%
            </span>
          </button>
        </div>

        {billingInterval === "yearly" && (
          <p className="mt-3 text-sm text-green-400 flex items-center justify-center gap-1">
            <CalendarDays className="w-4 h-4" />
            You save 20% compared to monthly billing — billed as one annual payment
          </p>
        )}
      </div>

      {/* Plans grid */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        {plansLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-96 rounded-xl bg-card animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans?.map((plan) => {
              const planKey = plan.key as PlanKey;
              const Icon = PLAN_ICONS[planKey];
              const isCurrentPlan = !!user && planKey === currentPlanKey;
              const isFree = plan.priceGBP === 0;
              const planOrderIdx = PLAN_ORDER.indexOf(planKey);
              const currentOrderIdx = PLAN_ORDER.indexOf(currentPlanKey);
              const isUpgrade = planOrderIdx > currentOrderIdx;
              const isDowngrade = planOrderIdx < currentOrderIdx;
              const { price, suffix } = getDisplayPrice(plan, billingInterval);

              // Yearly total for display
              const yearlyTotal = isFree ? null : calcYearlyPrice(plan.priceGBP);

              return (
                <Card
                  key={planKey}
                  className={`relative flex flex-col border-2 ${PLAN_COLORS[planKey]} ${isCurrentPlan ? "ring-2 ring-accent/30" : ""}`}
                >
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className={`${PLAN_BADGE_COLORS[planKey]} text-xs font-semibold px-3`}>
                        Current plan
                      </Badge>
                    </div>
                  )}

                  {planKey === "promoter_plan" && !isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-orange-500 text-white text-xs font-semibold px-3">
                        Most popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-5 h-5 text-foreground/70" />
                      <CardTitle className="text-foreground text-lg">{plan.name}</CardTitle>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-foreground">{price}</span>
                      {suffix && <span className="text-foreground/50 text-sm">{suffix}</span>}
                    </div>
                    {billingInterval === "yearly" && !isFree && yearlyTotal !== null && (
                      <p className="text-xs text-green-400 mt-1">
                        £{yearlyTotal.toFixed(2)} billed annually
                        <span className="ml-1 text-foreground/30 line-through">
                          £{(plan.priceGBP * 12).toFixed(2)}
                        </span>
                      </p>
                    )}
                    <CardDescription className="text-foreground/50 text-sm mt-1">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-2">
                    {/* Limits summary */}
                    <div className="bg-black/10 dark:bg-white/5 rounded-lg p-3 mb-3 space-y-1 text-sm">
                      <div className="flex justify-between text-foreground/70">
                        <span>Events per month</span>
                        <span className="font-semibold text-foreground">
                          {plan.limits.eventsPerMonth === null
                            ? "Unlimited"
                            : plan.limits.eventsPerMonth === 0
                              ? "None"
                              : plan.limits.eventsPerMonth}
                        </span>
                      </div>
                      <div className="flex justify-between text-foreground/70">
                        <span>Weekly classes</span>
                        <span className="font-semibold text-foreground">
                          {plan.limits.weeklyClasses === null
                            ? "Unlimited"
                            : plan.limits.weeklyClasses === 0
                              ? "None"
                              : plan.limits.weeklyClasses}
                        </span>
                      </div>
                      <div className="flex justify-between text-foreground/70">
                        <span>Ticket commission</span>
                        <span className="font-semibold text-foreground">
                          {Math.round(plan.commissionRate * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Features list */}
                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-foreground/70">
                          <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-4 flex flex-col gap-2">
                    {isCurrentPlan ? (
                      <Button
                        className="w-full opacity-60 cursor-default"
                        disabled
                        variant="outline"
                      >
                        Current plan
                      </Button>
                    ) : isFree ? (
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => user ? navigate("/billing") : navigate("/login")}
                      >
                        {isDowngrade ? "Downgrade to Free" : user ? "Get started free" : "Sign up free"}
                      </Button>
                    ) : (
                      <Button
                        className={`w-full ${PLAN_BUTTON_STYLES[planKey]}`}
                        onClick={() => handleUpgrade(planKey)}
                        disabled={checkoutMutation.isPending}
                      >
                        {checkoutMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        {checkoutMutation.isPending ? "Loading..." : !user ? (
                          "Sign in to subscribe"
                        ) : isUpgrade ? (
                          <span className="flex items-center gap-2">
                            Upgrade plan <ArrowRight className="w-4 h-4" />
                          </span>
                        ) : (
                          "Switch to this plan"
                        )}
                      </Button>
                    )}
                    {!isFree && !isCurrentPlan && billingInterval === "yearly" && (
                      <p className="text-xs text-center text-green-400">
                        Save £{((plan.priceGBP * 12) - calcYearlyPrice(plan.priceGBP)).toFixed(2)} vs monthly
                      </p>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {/* Yearly savings summary */}
        {billingInterval === "yearly" && (
          <div className="mt-8 max-w-3xl mx-auto bg-green-500/10 border border-green-500/20 rounded-xl p-5 text-center">
            <h3 className="text-green-400 font-semibold mb-1">Annual billing saves you money</h3>
            <p className="text-foreground/50 text-sm">
              Switching to yearly billing gives you 2 months free compared to paying monthly.
              You're billed once per year and can cancel any time before renewal.
            </p>
          </div>
        )}

        {/* Fee transparency note */}
        <div className="mt-8 max-w-3xl mx-auto bg-card border border-border/40 rounded-xl p-6">
          <h3 className="text-foreground font-semibold mb-3">How ticket fees work</h3>
          <p className="text-foreground/50 text-sm mb-4">
            At checkout, buyers see a transparent breakdown of all fees. The platform fee is based on your current plan's commission rate. The processing fee covers Stripe's card processing cost — neither fee is absorbed by you.
          </p>
          <div className="bg-black/10 dark:bg-white/5 rounded-lg p-4 font-mono text-sm space-y-1">
            <div className="flex justify-between text-foreground/70">
              <span>Ticket price</span><span>£10.00</span>
            </div>
            <div className="flex justify-between text-foreground/50">
              <span>Platform fee (8% Starter)</span><span>£0.80</span>
            </div>
            <div className="flex justify-between text-foreground/50">
              <span>Processing fee</span><span>£0.36</span>
            </div>
            <div className="border-t border-border/30 pt-1 flex justify-between text-foreground font-semibold">
              <span>Total charged to buyer</span><span>£11.16</span>
            </div>
            <div className="flex justify-between text-green-400 text-xs">
              <span>You receive</span><span>£10.00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
