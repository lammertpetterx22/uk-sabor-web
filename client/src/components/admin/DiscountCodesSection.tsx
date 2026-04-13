import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tag, Plus, Trash2, Loader2, Percent, PoundSterling } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface DiscountCodesSectionProps {
  /** The type of item: "event", "course", or "class" */
  itemType: "event" | "course" | "class";
  /** The ID of the item (only available when editing) */
  itemId?: number;
}

export default function DiscountCodesSection({ itemType, itemId }: DiscountCodesSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const utils = trpc.useUtils();

  const discountsList = trpc.discounts.listByItem.useQuery(
    { itemType, itemId: itemId! },
    { enabled: !!itemId }
  );

  const createMutation = trpc.discounts.create.useMutation({
    onSuccess: () => {
      toast.success("Discount code created");
      resetForm();
      utils.discounts.listByItem.invalidate({ itemType, itemId: itemId! });
    },
    onError: (err) => toast.error(err.message),
  });

  const deactivateMutation = trpc.discounts.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Discount code deactivated");
      utils.discounts.listByItem.invalidate({ itemType, itemId: itemId! });
    },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => {
    setCode("");
    setDiscountType("percentage");
    setDiscountValue("");
    setMaxUses("");
    setExpiresAt("");
    setShowForm(false);
  };

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
      ...(itemType === "event" && itemId ? { eventId: itemId } : {}),
      ...(itemType === "course" && itemId ? { courseId: itemId } : {}),
      ...(itemType === "class" && itemId ? { classId: itemId } : {}),
      maxUses: maxUses ? parseInt(maxUses) : undefined,
      expiresAt: expiresAt || undefined,
    });
  };

  if (!itemId) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-accent" />
          <h3 className="font-semibold text-foreground">Discount Codes</h3>
        </div>
        <p className="text-sm text-foreground/50">
          Save the {itemType} first to create discount codes.
        </p>
      </div>
    );
  }

  const itemLabel = itemType === "event" ? "evento" : itemType === "course" ? "curso" : "clase";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-accent" />
          <h3 className="font-semibold text-foreground">Discount Codes</h3>
        </div>
        {!showForm && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowForm(true)}
            className="border-accent/50 text-accent hover:bg-accent/10"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Code
          </Button>
        )}
      </div>

      {/* Existing codes */}
      {discountsList.data && discountsList.data.length > 0 && (
        <div className="space-y-2">
          {discountsList.data.filter(d => d.active).map((dc) => (
            <div
              key={dc.id}
              className="flex items-center justify-between p-3 rounded-xl bg-background/30 border border-border/50"
            >
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-lg bg-accent/10 text-accent text-sm font-bold tracking-wider">
                  {dc.code}
                </span>
                <span className="text-sm text-foreground/60">
                  {dc.discountType === "percentage"
                    ? `${parseFloat(String(dc.discountValue))}% off`
                    : `£${parseFloat(String(dc.discountValue)).toFixed(2)} off`}
                </span>
                <span className="text-xs text-foreground/40">
                  {dc.usesCount}{dc.maxUses ? `/${dc.maxUses}` : ""} uses
                </span>
              </div>
              <button
                type="button"
                onClick={() => deactivateMutation.mutate({ id: dc.id })}
                disabled={deactivateMutation.isPending}
                className="p-1.5 rounded-lg text-foreground/30 hover:text-red-400 hover:bg-red-400/10 transition-all"
                title="Deactivate code"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {discountsList.data && discountsList.data.filter(d => d.active).length === 0 && !showForm && (
        <p className="text-sm text-foreground/40">
          No active discount codes for this {itemLabel}.
        </p>
      )}

      {/* Create form */}
      {showForm && (
        <div className="space-y-4 p-4 rounded-xl bg-background/30 border border-accent/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-foreground/70 text-xs">Code *</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="SABOR30"
                className="bg-background/50 border-border/50 font-mono uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-foreground/70 text-xs">Type</Label>
              <Select value={discountType} onValueChange={(v) => setDiscountType(v as any)}>
                <SelectTrigger className="bg-background/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">
                    <span className="flex items-center gap-1.5">
                      <Percent className="h-3.5 w-3.5" /> Percentage
                    </span>
                  </SelectItem>
                  <SelectItem value="fixed">
                    <span className="flex items-center gap-1.5">
                      <PoundSterling className="h-3.5 w-3.5" /> Fixed amount
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-foreground/70 text-xs">
                {discountType === "percentage" ? "Discount %" : "Discount £"} *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 text-sm">
                  {discountType === "percentage" ? "%" : "£"}
                </span>
                <Input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === "percentage" ? "30" : "5.00"}
                  className="bg-background/50 border-border/50 pl-8"
                  min="0"
                  max={discountType === "percentage" ? "100" : undefined}
                  step={discountType === "percentage" ? "1" : "0.01"}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-foreground/70 text-xs">Max uses (optional)</Label>
              <Input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Unlimited"
                className="bg-background/50 border-border/50"
                min="1"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-foreground/70 text-xs">Expires at (optional)</Label>
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="bg-background/50 border-border/50"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              onClick={handleCreate}
              disabled={createMutation.isPending}
              size="sm"
              className="bg-accent hover:bg-accent/90 text-white"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Plus className="h-4 w-4 mr-1.5" />
              )}
              Create Code
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetForm}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
