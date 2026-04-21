import { useMemo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Ticket, Plus, Trash2, Sparkles, Crown, Zap, Star, Tag } from "lucide-react";

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
  /**
   * Optional slot for rendering extra UI inside each saved tier card —
   * used by the server-backed wrapper to inject the per-tier discount
   * codes editor directly under each row.
   */
  renderRowExtras?: (row: TierRow) => ReactNode;
}

/**
 * Palette used everywhere a tier is rendered (editor, public selector,
 * discount code picker). Pairs a recognizable icon with a color family so
 * tiers have an instantly-readable identity.
 */
type TierStyle = {
  icon: typeof Ticket;
  label: string;
  gradient: string;   // card background gradient
  border: string;     // card border
  ring: string;       // focus/accent ring
  text: string;       // accent text
  chip: string;       // small badge background
  stripe: string;     // left-edge accent bar
};

function styleForTier(name: string, idx: number): TierStyle {
  const n = name.toLowerCase().trim();
  if (n.includes("vip") || n.includes("platinum") || n.includes("gold") || n.includes("premium")) {
    return {
      icon: Crown,
      label: "Premium",
      gradient: "from-amber-500/15 via-yellow-500/5 to-transparent",
      border: "border-amber-500/40",
      ring: "focus-visible:ring-amber-500/60",
      text: "text-amber-300",
      chip: "bg-amber-500/15 border-amber-500/30 text-amber-300",
      stripe: "from-amber-400 via-yellow-400 to-orange-400",
    };
  }
  if (n.includes("early") || n.includes("bird") || n.includes("presale")) {
    return {
      icon: Zap,
      label: "Early",
      gradient: "from-emerald-500/15 via-emerald-500/5 to-transparent",
      border: "border-emerald-500/40",
      ring: "focus-visible:ring-emerald-500/60",
      text: "text-emerald-300",
      chip: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
      stripe: "from-emerald-400 via-teal-400 to-green-400",
    };
  }
  if (n.includes("student") || n.includes("discount")) {
    return {
      icon: Star,
      label: "Student",
      gradient: "from-blue-500/15 via-blue-500/5 to-transparent",
      border: "border-blue-500/40",
      ring: "focus-visible:ring-blue-500/60",
      text: "text-blue-300",
      chip: "bg-blue-500/15 border-blue-500/30 text-blue-300",
      stripe: "from-blue-400 via-sky-400 to-indigo-400",
    };
  }
  // Rotate a couple of accents for generic names so tiers aren't visually identical
  const accents: TierStyle[] = [
    {
      icon: Sparkles,
      label: "Standard",
      gradient: "from-cyan-500/15 via-cyan-500/5 to-transparent",
      border: "border-cyan-500/40",
      ring: "focus-visible:ring-cyan-500/60",
      text: "text-cyan-300",
      chip: "bg-cyan-500/15 border-cyan-500/30 text-cyan-300",
      stripe: "from-cyan-400 via-sky-400 to-blue-400",
    },
    {
      icon: Ticket,
      label: "Standard",
      gradient: "from-fuchsia-500/15 via-fuchsia-500/5 to-transparent",
      border: "border-fuchsia-500/40",
      ring: "focus-visible:ring-fuchsia-500/60",
      text: "text-fuchsia-300",
      chip: "bg-fuchsia-500/15 border-fuchsia-500/30 text-fuchsia-300",
      stripe: "from-fuchsia-400 via-pink-400 to-rose-400",
    },
    {
      icon: Tag,
      label: "Standard",
      gradient: "from-violet-500/15 via-violet-500/5 to-transparent",
      border: "border-violet-500/40",
      ring: "focus-visible:ring-violet-500/60",
      text: "text-violet-300",
      chip: "bg-violet-500/15 border-violet-500/30 text-violet-300",
      stripe: "from-violet-400 via-purple-400 to-indigo-400",
    },
  ];
  return accents[idx % accents.length];
}

export default function TicketTiersEditor({ rows, onChange, showSoldCount = false, maxTiers = 20, renderRowExtras }: TicketTiersEditorProps) {
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

  const stats = useMemo(() => {
    const capacity = rows.reduce((sum, r) => sum + (r.maxQuantity === "" ? 0 : parseInt(r.maxQuantity, 10) || 0), 0);
    const hasUnlimited = rows.some(r => r.maxQuantity === "");
    const minPrice = Math.min(...rows.map(r => parseFloat(r.price) || Infinity).filter(Number.isFinite));
    const maxPrice = Math.max(...rows.map(r => parseFloat(r.price) || -Infinity).filter(Number.isFinite));
    return {
      capacity,
      hasUnlimited,
      range:
        rows.length >= 2 && Number.isFinite(minPrice) && Number.isFinite(maxPrice) && minPrice !== maxPrice
          ? `£${minPrice.toFixed(2)} – £${maxPrice.toFixed(2)}`
          : null,
    };
  }, [rows]);

  return (
    <div className="space-y-6">
      {/* ─── Header banner ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-600/20 via-violet-600/10 to-fuchsia-600/10 p-5 md:p-6">
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_top_right,white,transparent_60%)]" />
        <div className="relative flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border border-cyan-400/40 flex-shrink-0 shadow-lg shadow-cyan-500/20">
            <Ticket className="h-6 w-6 text-cyan-200" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg md:text-xl font-bold text-white">Ticket Types</h3>
            <p className="text-sm text-white/70 mt-1 leading-relaxed">
              Design your pricing ladder — Early Bird, General Admission, VIP, Student… Each tier has its own price, capacity and description. With one tier the event works like a single-price ticket; with two or more buyers see a selector at checkout.
            </p>
            {rows.length >= 2 && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-white/90">
                  <Ticket className="h-3 w-3" />
                  {rows.length} tiers
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-white/90">
                  Capacity: {stats.capacity || 0}{stats.hasUnlimited ? "+" : ""}
                </span>
                {stats.range && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-white/90">
                    Range: {stats.range}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Tier cards ───────────────────────────────────────────────── */}
      <div className="space-y-4">
        {rows.map((row, idx) => {
          const style = styleForTier(row.name, idx);
          const Icon = style.icon;
          const parsedPrice = parseFloat(row.price);
          const hasName = row.name.trim().length > 0;

          return (
            <div
              key={row.id ?? `new-${idx}`}
              className={`relative overflow-hidden rounded-2xl border ${style.border} bg-gradient-to-br ${style.gradient} transition-all duration-200 hover:shadow-lg hover:shadow-black/20`}
            >
              {/* Color stripe on left edge — keeps tiers visually distinct even when collapsed */}
              <div className={`absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b ${style.stripe}`} />

              <div className="p-5 md:p-6 pl-6 md:pl-7 space-y-5">
                {/* Header row: icon + preview pill + sold + delete */}
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl bg-background/60 border ${style.border} shadow-sm flex-shrink-0`}>
                    <Icon className={`h-5 w-5 ${style.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-foreground/40">
                        Tier #{idx + 1}
                      </span>
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${style.chip}`}>
                        {style.label}
                      </span>
                    </div>
                    <p className={`font-bold truncate mt-0.5 ${hasName ? style.text : "text-foreground/30 italic"}`}>
                      {hasName ? row.name : "Untitled tier"}
                      {Number.isFinite(parsedPrice) && row.price !== "" && (
                        <span className="ml-2 text-foreground/60 font-normal">· £{parsedPrice.toFixed(2)}</span>
                      )}
                    </p>
                  </div>
                  {showSoldCount && typeof row.soldCount === "number" && row.soldCount > 0 && (
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${style.chip}`}>
                      {row.soldCount} sold
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(idx)}
                    className="text-foreground/40 hover:text-red-400 hover:bg-red-500/10 flex-shrink-0"
                    disabled={rows.length === 1}
                    title={rows.length === 1 ? "You need at least one tier" : "Remove tier"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Name + Price + Max qty on one row */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-5 space-y-1.5">
                    <Label className="text-[11px] uppercase tracking-wider font-semibold text-foreground/70">Name</Label>
                    <Input
                      placeholder="e.g. Early Bird, VIP, General Admission"
                      value={row.name}
                      onChange={(e) => updateRow(idx, { name: e.target.value })}
                      className={`bg-background/60 border-border/60 h-11 focus-visible:ring-2 ${style.ring}`}
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1.5">
                    <Label className="text-[11px] uppercase tracking-wider font-semibold text-foreground/70">Price</Label>
                    <div className="relative">
                      <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-bold ${style.text}`}>£</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="25.00"
                        value={row.price}
                        onChange={(e) => updateRow(idx, { price: e.target.value })}
                        className={`bg-background/60 border-border/60 h-11 pl-8 font-semibold focus-visible:ring-2 ${style.ring}`}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-4 space-y-1.5">
                    <Label className="text-[11px] uppercase tracking-wider font-semibold text-foreground/70">
                      Max quantity <span className="text-foreground/40 font-normal normal-case">(optional)</span>
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Leave blank for unlimited"
                      value={row.maxQuantity}
                      onChange={(e) => updateRow(idx, { maxQuantity: e.target.value })}
                      className={`bg-background/60 border-border/60 h-11 focus-visible:ring-2 ${style.ring}`}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider font-semibold text-foreground/70">
                    Description <span className="text-foreground/40 font-normal normal-case">(optional — shown to buyers)</span>
                  </Label>
                  <Textarea
                    rows={2}
                    placeholder="Included perks, access, meet & greet, front-row seating…"
                    value={row.description}
                    onChange={(e) => updateRow(idx, { description: e.target.value })}
                    className={`bg-background/60 border-border/60 resize-none focus-visible:ring-2 ${style.ring}`}
                  />
                </div>

                {/* Extras slot — e.g. inline discount codes editor for this tier. */}
                {renderRowExtras && row.id && (
                  <div className="pt-4 border-t border-border/40">
                    {renderRowExtras(row)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Add button ───────────────────────────────────────────────── */}
      <Button
        type="button"
        variant="outline"
        onClick={addRow}
        disabled={rows.length >= maxTiers}
        className="w-full border-2 border-dashed border-cyan-500/30 hover:border-cyan-400/70 hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-violet-500/10 h-14 text-cyan-300 hover:text-cyan-200 font-semibold transition-all"
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
