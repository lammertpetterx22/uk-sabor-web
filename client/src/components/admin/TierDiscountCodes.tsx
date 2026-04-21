import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tag, Plus, Trash2, Loader2, Percent, PoundSterling } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface TierDiscountCodesProps {
  parentType: "event" | "class";
  parentId: number;   // eventId or classId
  tierId: number;
}

/**
 * Compact inline editor that lives inside each tier card. Shows the
 * discount codes already scoped to this specific tier and lets the
 * creator add a new one without leaving the Ticket Types screen.
 */
export default function TierDiscountCodes({ parentType, parentId, tierId }: TierDiscountCodesProps) {
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");

  const utils = trpc.useUtils();

  const itemType = parentType;
  const listQuery = trpc.discounts.listByItem.useQuery({ itemType, itemId: parentId });

  // Only codes specifically scoped to this tier
  const tierScopedCodes = (listQuery.data ?? []).filter((dc: any) => {
    if (!dc.active) return false;
    return parentType === "event"
      ? dc.eventTierId === tierId
      : dc.classTierId === tierId;
  });

  const createMutation = trpc.discounts.create.useMutation({
    onSuccess: () => {
      toast.success("Discount code created");
      setCode("");
      setDiscountValue("");
      setShowForm(false);
      utils.discounts.listByItem.invalidate({ itemType, itemId: parentId });
    },
    onError: (err) => toast.error(err.message),
  });

  const deactivateMutation = trpc.discounts.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Discount code removed");
      utils.discounts.listByItem.invalidate({ itemType, itemId: parentId });
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = () => {
    if (!code.trim() || !discountValue) {
      toast.error("Code and discount value are required");
      return;
    }
    const val = parseFloat(discountValue);
    if (discountType === "percentage" && (val <= 0 || val > 100)) {
      toast.error("Percentage must be between 1 and 100");
      return;
    }
    createMutation.mutate({
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: val,
      ...(parentType === "event" ? { eventId: parentId, eventTierId: tierId } : {}),
      ...(parentType === "class" ? { classId: parentId, classTierId: tierId } : {}),
    });
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold text-foreground">Discount codes for this tier</span>
        </div>
        {!showForm && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowForm(true)}
            className="h-7 px-2.5 text-xs text-accent hover:bg-accent/10"
          >
            <Plus className="h-3 w-3 mr-1" /> Add code
          </Button>
        )}
      </div>

      {tierScopedCodes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tierScopedCodes.map((dc: any) => (
            <span
              key={dc.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/30 text-accent text-xs font-semibold"
            >
              <span className="tracking-wider">{dc.code}</span>
              <span className="text-foreground/50 font-normal">·</span>
              <span className="text-foreground/70 font-normal">
                {dc.discountType === "percentage"
                  ? `${parseFloat(String(dc.discountValue))}%`
                  : `£${parseFloat(String(dc.discountValue)).toFixed(2)}`}
              </span>
              <button
                type="button"
                onClick={() => deactivateMutation.mutate({ id: dc.id })}
                disabled={deactivateMutation.isPending}
                className="ml-0.5 text-foreground/30 hover:text-red-400 transition-colors"
                title="Remove code"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {tierScopedCodes.length === 0 && !showForm && (
        <p className="text-xs text-foreground/40">No discount codes scoped to this tier yet.</p>
      )}

      {showForm && (
        <div className="rounded-lg bg-background/40 border border-accent/20 p-3 space-y-2.5">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
            <div className="md:col-span-3">
              <Input
                placeholder="CODE (e.g. EARLY20)"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="bg-background/60 font-mono uppercase h-9 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <Select value={discountType} onValueChange={(v) => setDiscountType(v as any)}>
                <SelectTrigger className="bg-background/60 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">
                    <span className="flex items-center gap-1.5 text-sm"><Percent className="h-3 w-3" /> Percentage</span>
                  </SelectItem>
                  <SelectItem value="fixed">
                    <span className="flex items-center gap-1.5 text-sm"><PoundSterling className="h-3 w-3" /> Fixed</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-1">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground/50 text-sm">
                  {discountType === "percentage" ? "%" : "£"}
                </span>
                <Input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === "percentage" ? "20" : "5"}
                  className="bg-background/60 h-9 pl-7 text-sm"
                  min="0"
                  max={discountType === "percentage" ? "100" : undefined}
                  step={discountType === "percentage" ? "1" : "0.01"}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="h-8 px-3 text-xs bg-accent hover:bg-accent/90 text-white"
            >
              {createMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
              Create
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setShowForm(false); setCode(""); setDiscountValue(""); }}
              className="h-8 px-3 text-xs text-foreground/60"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
