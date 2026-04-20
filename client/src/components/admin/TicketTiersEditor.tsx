import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Ticket, Plus, Trash2, Info, Sparkles, Crown, Zap, Star } from "lucide-react";

/**
 * Shape of a tier row in the editor. `id` is set only for rows that already
 * exist on the server; new rows have no id.
 */
export interface TierRow {
  id?: number;
  name: string;
  description: string;
  price: string;
  maxQuantity: string;     // "" = unlimited
  soldCount?: number;      // read-only, from server
  position: number;
}

interface TicketTiersEditorProps {
  rows: TierRow[];
  onChange: (rows: TierRow[]) => void;
  /** Whether to show the "already sold" badge column — only useful for saved tiers. */
  showSoldCount?: boolean;
  /** Cap on the total number of tiers. */
  maxTiers?: number;
}

/**
 * Pick an icon + accent gradient for a tier based on its name so the editor
 * and the public-facing selector look visually consistent and lively.
 */
function styleForTier(name: string, idx: number) {
  const n = name.toLowerCase().trim();
  if (n.includes("vip") || n.includes("platinum") || n.includes("gold") || n.includes("premium")) {
    return { icon: Crown,    gradient: "from-amber-500/20 via-yellow-500/10 to-transparent", border: "border-amber-500/40", text: "text-amber-400" };
  }
  if (n.includes("early") || n.includes("bird") || n.includes("presale")) {
    return { icon: Zap,      gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent", border: "border-emerald-500/40", text: "text-emerald-400" };
  }
  if (n.includes("student") || n.includes("discount")) {
    return { icon: Star,     gradient: "from-blue-500/20 via-blue-500/5 to-transparent", border: "border-blue-500/40", text: "text-blue-400" };
  }
  // Rotate a couple of accents for generic names so tiers aren't visually identical
  const accents = [
    { icon: Sparkles, gradient: "from-cyan-500/20 via-cyan-500/5 to-transparent",   border: "border-cyan-500/40",   text: "text-cyan-400" },
    { icon: Ticket,   gradient: "from-fuchsia-500/20 via-fuchsia-500/5 to-transparent", border: "border-fuchsia-500/40", text: "text-fuchsia-400" },
  ];
  return accents[idx % accents.length];
}

export default function TicketTiersEditor({ rows, onChange, showSoldCount = false, maxTiers = 20 }: TicketTiersEditorProps) {
  const addRow = () => {
    onChange([
      ...rows,
      { name: "", description: "", price: "", maxQuantity: "", position: rows.length },
    ]);
  };

  const removeRow = (idx: number) => {
    const row = rows[idx];
    if (row.soldCount && row.soldCount > 0) {
      if (!confirm(`"${row.name}" already sold ${row.soldCount} tickets. Remove it anyway? (Tickets already bought will stay valid.)`)) return;
    }
    onChange(rows.filter((_, i) => i !== idx).map((r, i) => ({ ...r, position: i })));
  };

  const updateRow = (idx: number, patch: Partial<TierRow>) => {
    onChange(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  // Live totals to help the creator sanity-check capacity
  const totals = useMemo(() => {
    const capacity = rows.reduce((sum, r) => sum + (r.maxQuantity === "" ? 0 : parseInt(r.maxQuantity, 10) || 0), 0);
    const hasUnlimited = rows.some(r => r.maxQuantity === "");
    return { capacity, hasUnlimited };
  }, [rows]);

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent border border-cyan-500/20">
        <div className="p-2.5 rounded-xl bg-cyan-500/15 flex-shrink-0">
          <Ticket className="h-5 w-5 text-cyan-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">Ticket Types</h3>
          <p className="text-xs text-foreground/60 mt-0.5">
            Add as many tiers as you want — Early Bird, General Admission, VIP — each with its own price, capacity and description. Buyers see a selector when there are 2+ tiers; with just one, it behaves like a single-price ticket.
          </p>
          {rows.length >= 2 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-foreground/60">
              <Info className="h-3.5 w-3.5 text-cyan-400" />
              Capacity across tiers: <span className="font-semibold text-foreground">{totals.capacity || 0}{totals.hasUnlimited ? "+" : ""}</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((row, idx) => {
          const style = styleForTier(row.name, idx);
          const Icon = style.icon;
          return (
            <div
              key={row.id ?? `new-${idx}`}
              className={`relative rounded-2xl border bg-gradient-to-br ${style.gradient} ${style.border} p-4 md:p-5 transition-all`}
            >
              {/* Header: icon + live preview pill + remove */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg bg-background/40 border ${style.border}`}>
                  <Icon className={`h-4 w-4 ${style.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wider text-foreground/40">Tier #{idx + 1}</p>
                  <p className={`font-semibold truncate ${style.text}`}>
                    {row.name.trim() || "Untitled tier"}
                    {row.price && <span className="ml-2 text-foreground/70 font-normal">· £{parseFloat(row.price || "0").toFixed(2)}</span>}
                  </p>
                </div>
                {showSoldCount && typeof row.soldCount === "number" && row.soldCount > 0 && (
                  <span className={`text-xs px-2.5 py-1 rounded-full bg-background/50 border ${style.border} ${style.text} font-semibold`}>
                    {row.soldCount} sold
                  </span>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(idx)}
                  className="text-foreground/40 hover:text-red-400 flex-shrink-0"
                  disabled={rows.length === 1}
                  title={rows.length === 1 ? "You need at least one tier" : "Remove tier"}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Inputs grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-5 space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-foreground/60">Name</Label>
                  <Input
                    placeholder="e.g. Early Bird, VIP, General Admission"
                    value={row.name}
                    onChange={(e) => updateRow(idx, { name: e.target.value })}
                    className="bg-background/60"
                  />
                </div>

                <div className="md:col-span-3 space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-foreground/60">Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/60 font-semibold">£</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="25.00"
                      value={row.price}
                      onChange={(e) => updateRow(idx, { price: e.target.value })}
                      className="bg-background/60 pl-8"
                    />
                  </div>
                </div>

                <div className="md:col-span-4 space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-foreground/60">Max qty (optional)</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Leave blank for unlimited"
                    value={row.maxQuantity}
                    onChange={(e) => updateRow(idx, { maxQuantity: e.target.value })}
                    className="bg-background/60"
                  />
                </div>

                <div className="md:col-span-12 space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-foreground/60">Description (optional)</Label>
                  <Textarea
                    rows={2}
                    placeholder="Included perks, access, meet & greet, front-row seating…"
                    value={row.description}
                    onChange={(e) => updateRow(idx, { description: e.target.value })}
                    className="bg-background/60 resize-none"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={addRow}
        disabled={rows.length >= maxTiers}
        className="w-full border-dashed border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/5 h-12 text-cyan-400"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add another ticket type
      </Button>
    </div>
  );
}

/** Validate tier rows. Returns the first error message, or null if valid. */
export function validateTierRows(rows: TierRow[]): string | null {
  for (const r of rows) {
    if (!r.name.trim()) return "Every ticket type needs a name";
    const p = parseFloat(r.price);
    if (!(p >= 0)) return `"${r.name || "Untitled"}" needs a valid price`;
    if (r.maxQuantity !== "" && !(parseInt(r.maxQuantity, 10) > 0)) {
      return `"${r.name}" max quantity must be a positive integer`;
    }
  }
  return null;
}

/** Build the serializable payload that the server's saveTiers endpoints expect. */
export function tierRowsToPayload(rows: TierRow[]) {
  return rows.map((r, i) => ({
    id: r.id,
    name: r.name.trim(),
    description: r.description.trim() || null,
    price: r.price,
    maxQuantity: r.maxQuantity === "" ? null : parseInt(r.maxQuantity, 10),
    position: i,
  }));
}
