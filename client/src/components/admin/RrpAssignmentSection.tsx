import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, UserPlus, Loader2, Trash2, Percent, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface RrpAssignmentSectionProps {
  /** The event ID — only available when editing an existing event */
  eventId?: number;
}

const TIER_LABELS: Record<string, { label: string; min: number }> = {
  bronze:   { label: "Bronze",   min: 15 },
  silver:   { label: "Silver",    min: 20 },
  gold:     { label: "Gold",      min: 25 },
  platinum: { label: "Platinum",  min: 30 },
  diamond:  { label: "Diamond", min: 40 },
};

const MAX_COMMISSION = 40;

export default function RrpAssignmentSection({ eventId }: RrpAssignmentSectionProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [discountPct, setDiscountPct] = useState<string>("10");
  const [commissionPct, setCommissionPct] = useState<string>("");

  const utils = trpc.useUtils();

  const assignedQuery = trpc.rrp.listEventRrps.useQuery(
    { eventId: eventId! },
    { enabled: !!eventId },
  );
  const availableQuery = trpc.rrp.listAvailableRrps.useQuery(
    { eventId: eventId! },
    { enabled: !!eventId },
  );

  const assignMutation = trpc.rrp.assignToEvent.useMutation({
    onSuccess: () => {
      toast.success("✅ RRP added");
      setSelectedUserId("");
      setDiscountPct("10");
      setCommissionPct("");
      utils.rrp.listEventRrps.invalidate({ eventId: eventId! });
      utils.rrp.listAvailableRrps.invalidate({ eventId: eventId! });
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMutation = trpc.rrp.removeFromEvent.useMutation({
    onSuccess: () => {
      toast.success("RRP removed from event");
      utils.rrp.listEventRrps.invalidate({ eventId: eventId! });
      utils.rrp.listAvailableRrps.invalidate({ eventId: eventId! });
    },
    onError: (err) => toast.error(err.message),
  });

  if (!eventId) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-accent" />
          <h3 className="font-semibold text-foreground">Assigned RRPs</h3>
        </div>
        <p className="text-sm text-foreground/60 bg-background/30 border border-border/50 rounded-lg p-4">
          Save the event first to assign RRPs.
        </p>
      </div>
    );
  }

  const available = availableQuery.data ?? [];
  const assigned = assignedQuery.data ?? [];
  const selectedRrp = available.find(a => String(a.userId) === selectedUserId);
  const selectedTierMin = selectedRrp ? (TIER_LABELS[selectedRrp.tier]?.min ?? 15) : 15;

  const handleAdd = () => {
    if (!selectedUserId) {
      toast.error("Select an RRP");
      return;
    }
    const d = parseInt(discountPct);
    const c = parseInt(commissionPct);
    if (isNaN(d) || d < 0 || d > 90) {
      toast.error("Discount: 0-90%");
      return;
    }
    if (isNaN(c) || c < selectedTierMin || c > MAX_COMMISSION) {
      toast.error(`Commission: between ${selectedTierMin}% and ${MAX_COMMISSION}%`);
      return;
    }
    assignMutation.mutate({
      eventId,
      rrpUserId: parseInt(selectedUserId),
      customerDiscountPct: d,
      rrpCommissionPct: c,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Megaphone className="h-4 w-4 text-accent" />
        <h3 className="font-semibold text-foreground">Assigned RRPs</h3>
        <Badge variant="secondary" className="ml-1">{assigned.length}</Badge>
      </div>
      <p className="text-xs text-foreground/50 -mt-2">
        Assigned RRPs can sell this event with their code — they receive a commission per sale.
        Global max cap: {MAX_COMMISSION}%.
      </p>

      {/* Add form */}
      <div className="rounded-xl border border-border/50 bg-background/40 p-4 space-y-3">
        <div className="space-y-2">
          <Label className="text-foreground/80 text-sm">RRP to add</Label>
          <Select value={selectedUserId} onValueChange={(v) => {
            setSelectedUserId(v);
            const rrp = available.find(a => String(a.userId) === v);
            if (rrp) {
              const min = TIER_LABELS[rrp.tier]?.min ?? 15;
              setCommissionPct(String(min));
            }
          }}>
            <SelectTrigger className="bg-background/60 border-border/50">
              <SelectValue placeholder={available.length === 0 ? "No RRPs available" : "Select an RRP"} />
            </SelectTrigger>
            <SelectContent>
              {available.map(a => (
                <SelectItem key={a.userId} value={String(a.userId)}>
                  {a.name} · {TIER_LABELS[a.tier]?.label ?? a.tier} · {a.lifetimeSales} sales · {a.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-foreground/80 text-sm flex items-center gap-1.5">
              <Percent className="h-3 w-3 text-accent" />
              Customer discount (%)
            </Label>
            <Input
              type="number"
              min={0}
              max={90}
              value={discountPct}
              onChange={(e) => setDiscountPct(e.target.value)}
              className="bg-background/60 border-border/50"
              placeholder="Ej: 10"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-foreground/80 text-sm flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-accent" />
              RRP commission (%) — min {selectedTierMin}% · max {MAX_COMMISSION}%
            </Label>
            <Input
              type="number"
              min={selectedTierMin}
              max={MAX_COMMISSION}
              value={commissionPct}
              onChange={(e) => setCommissionPct(e.target.value)}
              className="bg-background/60 border-border/50"
              placeholder={`Min ${selectedTierMin}`}
            />
          </div>
        </div>

        <Button
          type="button"
          onClick={handleAdd}
          disabled={assignMutation.isPending || !selectedUserId || !commissionPct}
          className="w-full md:w-auto bg-gradient-to-r from-[#FA3698] to-purple-600 hover:from-[#FA3698]/90 hover:to-purple-600/90 text-white border-0"
        >
          {assignMutation.isPending ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Adding…</>
          ) : (
            <><UserPlus className="h-4 w-4 mr-2" /> Assign RRP</>
          )}
        </Button>
      </div>

      {/* Assigned list */}
      {assignedQuery.isLoading ? (
        <div className="flex items-center justify-center py-8 text-foreground/50">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
        </div>
      ) : assigned.length === 0 ? (
        <div className="text-center py-8 text-sm text-foreground/50 border border-dashed border-border/50 rounded-lg">
          No RRPs assigned to this event yet
        </div>
      ) : (
        <div className="divide-y divide-border/40 rounded-lg border border-border/50 overflow-hidden">
          {assigned.map(a => (
            <div key={a.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-background/30">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">{a.rrpName}</span>
                  <Badge variant="outline" className="text-xs">
                    {TIER_LABELS[a.tier ?? "bronze"]?.label ?? a.tier}
                  </Badge>
                  <span className="font-mono text-xs text-accent">{a.code}</span>
                </div>
                <div className="text-xs text-foreground/60 mt-0.5 flex gap-3 flex-wrap">
                  <span>📉 Descuento cliente: <strong>{a.customerDiscountPct}%</strong></span>
                  <span>💰 RRP commission: <strong>{a.rrpCommissionPct}%</strong></span>
                  <span>📊 {a.lifetimeSales ?? 0} total sales</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm(`Remove ${a.rrpName} from this event? Past sales are not affected.`)) {
                    removeMutation.mutate({ eventRrpId: a.id });
                  }
                }}
                disabled={removeMutation.isPending}
                className="text-red-500 hover:text-red-400 hover:border-red-500/50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
