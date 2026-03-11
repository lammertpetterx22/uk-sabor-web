import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowUpCircle, Zap } from "lucide-react";
import { useLocation } from "wouter";

interface UpgradePlanDialogProps {
  open: boolean;
  onClose: () => void;
  /** The resource type that hit the limit */
  resourceType: "event" | "class" | "course";
  /** Human-readable reason from the entitlement check */
  reason?: string;
  /** Current plan key */
  currentPlan?: string;
}

const PLAN_DISPLAY: Record<string, { label: string; color: string }> = {
  starter: { label: "Starter (Free)", color: "bg-zinc-500" },
  creator: { label: "Creator", color: "bg-blue-500" },
  promoter_plan: { label: "Promoter", color: "bg-purple-500" },
  academy: { label: "Academy", color: "bg-amber-500" },
};

const RESOURCE_LABELS: Record<string, string> = {
  event: "events",
  class: "weekly classes",
  course: "courses",
};

export default function UpgradePlanDialog({
  open,
  onClose,
  resourceType,
  reason,
  currentPlan = "starter",
}: UpgradePlanDialogProps) {
  const [, setLocation] = useLocation();

  const planInfo = PLAN_DISPLAY[currentPlan] ?? PLAN_DISPLAY.starter;
  const resourceLabel = RESOURCE_LABELS[resourceType] ?? resourceType;

  const handleUpgrade = () => {
    onClose();
    setLocation("/pricing");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-500">
            <AlertCircle className="h-5 w-5" />
            Plan Limit Reached
          </DialogTitle>
          <DialogDescription>
            You've hit the {resourceLabel} limit on your current plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current plan badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground/60">Current plan:</span>
            <Badge className={`${planInfo.color} text-white`}>{planInfo.label}</Badge>
          </div>

          {/* Reason message */}
          {reason && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-foreground/80">
              {reason}
            </div>
          )}

          {/* Benefits of upgrading */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <p className="text-sm font-semibold flex items-center gap-1">
              <Zap className="h-4 w-4 text-amber-400" />
              Upgrade to unlock:
            </p>
            <ul className="text-sm text-foreground/70 space-y-1 list-none pl-1">
              <li>✓ More {resourceLabel} per month</li>
              <li>✓ Lower platform commission on ticket sales</li>
              <li>✓ Access to courses (Academy plan)</li>
              <li>✓ Unlimited classes &amp; events (Academy plan)</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Maybe Later
          </Button>
          <Button onClick={handleUpgrade} className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-semibold">
            <ArrowUpCircle className="h-4 w-4 mr-2" />
            View Plans
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
