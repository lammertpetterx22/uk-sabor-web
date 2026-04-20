import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Ticket, Plus, Trash2, Loader2, GripVertical, Info } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface TicketTiersSectionProps {
  eventId: number;
  /** Fallback flat ticket price shown as the default single-tier price */
  flatTicketPrice?: string;
}

interface TierRow {
  id?: number;             // DB id (only for existing rows)
  name: string;
  description: string;
  price: string;           // stored as string (decimal)
  maxQuantity: string;     // stored as string ("" = unlimited)
  soldCount?: number;      // read-only, from server
  position: number;
}

export default function TicketTiersSection({ eventId, flatTicketPrice }: TicketTiersSectionProps) {
  const utils = trpc.useUtils();
  const tiersQuery = trpc.events.listTiers.useQuery(eventId);

  const [rows, setRows] = useState<TierRow[]>([]);

  // Hydrate from server, or start with a single default row seeded from the
  // event's flat ticket price so creators can just add "VIP" on top without
  // re-entering the base price.
  useEffect(() => {
    if (!tiersQuery.data) return;
    if (tiersQuery.data.length === 0) {
      setRows([{
        name: "General Admission",
        description: "",
        price: flatTicketPrice ?? "",
        maxQuantity: "",
        position: 0,
      }]);
    } else {
      setRows(
        tiersQuery.data.map((t: any, i: number) => ({
          id: t.id,
          name: t.name ?? "",
          description: t.description ?? "",
          price: t.price?.toString() ?? "",
          maxQuantity: t.maxQuantity?.toString() ?? "",
          soldCount: t.soldCount ?? 0,
          position: t.position ?? i,
        }))
      );
    }
  }, [tiersQuery.data, flatTicketPrice]);

  const saveMutation = trpc.events.saveTiers.useMutation({
    onSuccess: () => {
      toast.success("Ticket types saved");
      utils.events.listTiers.invalidate(eventId);
    },
    onError: (err) => toast.error(err.message),
  });

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { name: "", description: "", price: "", maxQuantity: "", position: prev.length },
    ]);
  };

  const removeRow = (idx: number) => {
    const row = rows[idx];
    if (row.soldCount && row.soldCount > 0) {
      if (!confirm(`"${row.name}" already sold ${row.soldCount} tickets. Remove it anyway? (Tickets already bought will stay valid.)`)) return;
    }
    setRows((prev) => prev.filter((_, i) => i !== idx).map((r, i) => ({ ...r, position: i })));
  };

  const updateRow = (idx: number, patch: Partial<TierRow>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const handleSave = () => {
    // Validate
    for (const r of rows) {
      if (!r.name.trim()) { toast.error("Every ticket type needs a name"); return; }
      const p = parseFloat(r.price);
      if (!(p >= 0)) { toast.error(`"${r.name}" needs a valid price`); return; }
      if (r.maxQuantity !== "" && !(parseInt(r.maxQuantity, 10) > 0)) {
        toast.error(`"${r.name}" max quantity must be a positive integer`);
        return;
      }
    }

    saveMutation.mutate({
      eventId,
      tiers: rows.map((r, i) => ({
        id: r.id,
        name: r.name.trim(),
        description: r.description.trim() || null,
        price: r.price,
        maxQuantity: r.maxQuantity === "" ? null : parseInt(r.maxQuantity, 10),
        position: i,
      })),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-cyan-500/15">
          <Ticket className="h-5 w-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Ticket Types</h3>
          <p className="text-xs text-foreground/50">
            Add multiple tiers like Early Bird, General Admission, VIP — each with its own price, capacity and description.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-xs text-foreground/70">
        <Info className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
        <p>
          If you leave just one tier, the event behaves like a single-price ticket. Buyers see a selector when you have 2+ types.
          "Max quantity" is optional — leave blank for unlimited within the event cap.
        </p>
      </div>

      {tiersQuery.isLoading ? (
        <div className="flex items-center justify-center py-8 text-foreground/50">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading ticket types…
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row, idx) => (
            <div key={row.id ?? `new-${idx}`} className="rounded-xl border border-border/40 bg-background/40 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="pt-2 text-foreground/30">
                  <GripVertical className="h-4 w-4" />
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-4 space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-foreground/60">Name</Label>
                    <Input
                      placeholder="VIP"
                      value={row.name}
                      onChange={(e) => updateRow(idx, { name: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-foreground/60">Price (£)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="25.00"
                      value={row.price}
                      onChange={(e) => updateRow(idx, { price: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-foreground/60">Max qty</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Unlimited"
                      value={row.maxQuantity}
                      onChange={(e) => updateRow(idx, { maxQuantity: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2 flex items-end justify-end gap-2">
                    {typeof row.soldCount === "number" && row.soldCount > 0 && (
                      <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-400">
                        {row.soldCount} sold
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(idx)}
                      className="text-foreground/50 hover:text-red-400"
                      disabled={rows.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="md:col-span-12 space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-foreground/60">Description (optional)</Label>
                    <Textarea
                      rows={2}
                      placeholder="Includes welcome drink, front-row access, meet & greet…"
                      value={row.description}
                      onChange={(e) => updateRow(idx, { description: e.target.value })}
                      className="resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="button" variant="outline" onClick={addRow} disabled={rows.length >= 20}>
          <Plus className="h-4 w-4 mr-2" /> Add ticket type
        </Button>

        <Button
          type="button"
          onClick={handleSave}
          disabled={saveMutation.isPending || rows.length === 0}
          className="btn-vibrant"
        >
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Save ticket types
        </Button>
      </div>
    </div>
  );
}
