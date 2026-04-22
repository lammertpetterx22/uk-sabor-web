import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Plus, Trash2, Loader2, Check, MapPin, Tag, ExternalLink, Image as ImageIcon, Info } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface HotelsSectionProps {
  eventId: number;
}

interface HotelRow {
  id?: number;
  name: string;
  description: string;
  imageUrl: string;
  bookingUrl: string;
  discountCode: string;
  priceFromGBP: string;
  distanceKm: string;
  position: number;
}

const blankHotel = (position: number): HotelRow => ({
  name: "",
  description: "",
  imageUrl: "",
  bookingUrl: "",
  discountCode: "",
  priceFromGBP: "",
  distanceKm: "",
  position,
});

/**
 * Admin editor for partner hotels attached to an event — the congress
 * "Where to Stay" list. Mirrors the tier editor pattern: controlled rows,
 * explicit Save button that replaces the full list server-side.
 */
export default function HotelsSection({ eventId }: HotelsSectionProps) {
  const utils = trpc.useUtils();
  const hotelsQuery = trpc.events.listHotels.useQuery(eventId);
  const [rows, setRows] = useState<HotelRow[]>([]);

  useEffect(() => {
    if (!hotelsQuery.data) return;
    if (hotelsQuery.data.length === 0) {
      setRows([blankHotel(0)]);
    } else {
      setRows(
        hotelsQuery.data.map((h: any, i: number) => ({
          id: h.id,
          name: h.name ?? "",
          description: h.description ?? "",
          imageUrl: h.imageUrl ?? "",
          bookingUrl: h.bookingUrl ?? "",
          discountCode: h.discountCode ?? "",
          priceFromGBP: h.priceFromGBP?.toString() ?? "",
          distanceKm: h.distanceKm?.toString() ?? "",
          position: h.position ?? i,
        }))
      );
    }
  }, [hotelsQuery.data]);

  const saveMutation = trpc.events.saveHotels.useMutation({
    onSuccess: () => {
      toast.success("Hotels saved");
      utils.events.listHotels.invalidate(eventId);
    },
    onError: (err) => toast.error(err.message),
  });

  const addRow = () => setRows((prev) => [...prev, blankHotel(prev.length)]);

  const removeRow = (idx: number) =>
    setRows((prev) => prev.filter((_, i) => i !== idx).map((r, i) => ({ ...r, position: i })));

  const update = (idx: number, patch: Partial<HotelRow>) =>
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const handleSave = () => {
    for (const r of rows) {
      if (!r.name.trim()) { toast.error("Every hotel needs a name"); return; }
      if (!r.bookingUrl.trim()) { toast.error(`"${r.name}" needs a booking URL`); return; }
      try { new URL(r.bookingUrl); } catch { toast.error(`"${r.name}" booking URL isn't valid`); return; }
      if (r.imageUrl.trim()) {
        try { new URL(r.imageUrl); } catch { toast.error(`"${r.name}" image URL isn't valid`); return; }
      }
      if (r.priceFromGBP && !(parseFloat(r.priceFromGBP) >= 0)) {
        toast.error(`"${r.name}" price must be a positive number`); return;
      }
      if (r.distanceKm && !(parseFloat(r.distanceKm) >= 0)) {
        toast.error(`"${r.name}" distance must be a positive number`); return;
      }
    }

    saveMutation.mutate({
      eventId,
      hotels: rows.map((r, i) => ({
        id: r.id,
        name: r.name.trim(),
        description: r.description.trim() || null,
        imageUrl: r.imageUrl.trim() || null,
        bookingUrl: r.bookingUrl.trim(),
        discountCode: r.discountCode.trim() || null,
        priceFromGBP: r.priceFromGBP.trim() || null,
        distanceKm: r.distanceKm.trim() || null,
        position: i,
      })),
    });
  };

  if (hotelsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-foreground/50">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading hotels…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/15 via-amber-500/10 to-transparent p-5 md:p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500/30 to-amber-500/30 border border-orange-400/40 flex-shrink-0 shadow-lg">
            <Building2 className="h-6 w-6 text-orange-200" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg md:text-xl font-bold text-white">Partner Hotels</h3>
            <p className="text-sm text-white/70 mt-1 leading-relaxed">
              Add recommended hotels for attendees. Each shows a "Book Now" card on the event page with an optional discount code they can copy. Perfect for congress-style weekenders.
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-white/60">
              <Info className="h-3 w-3" /> Links open in a new tab — we don't process the booking, the buyer does it on the hotel site.
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((row, idx) => (
          <div
            key={row.id ?? `new-${idx}`}
            className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/[0.08] via-amber-500/[0.04] to-transparent p-5"
          >
            <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-orange-400 via-amber-400 to-rose-400" />

            <div className="pl-2 space-y-4">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-background/60 border border-orange-500/40 flex-shrink-0">
                  <Building2 className="h-5 w-5 text-orange-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-foreground/40">Hotel #{idx + 1}</p>
                  <p className={`font-bold truncate ${row.name.trim() ? "text-orange-200" : "text-foreground/30 italic"}`}>
                    {row.name.trim() || "Untitled hotel"}
                    {row.priceFromGBP && <span className="ml-2 text-foreground/60 font-normal">· from £{parseFloat(row.priceFromGBP || "0").toFixed(2)}</span>}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(idx)}
                  className="text-foreground/40 hover:text-red-400 hover:bg-red-500/10"
                  disabled={rows.length === 1}
                  title={rows.length === 1 ? "You need at least one row" : "Remove hotel"}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Row 1: Name + Booking URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider font-semibold text-foreground/70">Name</Label>
                  <Input
                    placeholder="Hotel Salsa Palace"
                    value={row.name}
                    onChange={(e) => update(idx, { name: e.target.value })}
                    className="bg-background/60 h-11 focus-visible:ring-2 focus-visible:ring-orange-500/60"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider font-semibold text-foreground/70 flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" /> Booking URL
                  </Label>
                  <Input
                    type="url"
                    placeholder="https://booking.com/hotel/…"
                    value={row.bookingUrl}
                    onChange={(e) => update(idx, { bookingUrl: e.target.value })}
                    className="bg-background/60 h-11 focus-visible:ring-2 focus-visible:ring-orange-500/60"
                  />
                </div>
              </div>

              {/* Row 2: Image URL + Discount code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider font-semibold text-foreground/70 flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" /> Image URL <span className="text-foreground/40 font-normal normal-case">(optional)</span>
                  </Label>
                  <Input
                    type="url"
                    placeholder="https://…/hotel.jpg"
                    value={row.imageUrl}
                    onChange={(e) => update(idx, { imageUrl: e.target.value })}
                    className="bg-background/60 h-11 focus-visible:ring-2 focus-visible:ring-orange-500/60"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider font-semibold text-foreground/70 flex items-center gap-1">
                    <Tag className="h-3 w-3" /> Promo code <span className="text-foreground/40 font-normal normal-case">(optional)</span>
                  </Label>
                  <Input
                    placeholder="SABOR10"
                    value={row.discountCode}
                    onChange={(e) => update(idx, { discountCode: e.target.value.toUpperCase() })}
                    className="bg-background/60 h-11 uppercase font-mono focus-visible:ring-2 focus-visible:ring-orange-500/60"
                  />
                </div>
              </div>

              {/* Row 3: Price from + Distance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider font-semibold text-foreground/70">
                    Price from (£/night) <span className="text-foreground/40 font-normal normal-case">(optional)</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-300 font-bold">£</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="89.00"
                      value={row.priceFromGBP}
                      onChange={(e) => update(idx, { priceFromGBP: e.target.value })}
                      className="bg-background/60 h-11 pl-8 focus-visible:ring-2 focus-visible:ring-orange-500/60"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider font-semibold text-foreground/70 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Distance from venue (km) <span className="text-foreground/40 font-normal normal-case">(optional)</span>
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="1.5"
                    value={row.distanceKm}
                    onChange={(e) => update(idx, { distanceKm: e.target.value })}
                    className="bg-background/60 h-11 focus-visible:ring-2 focus-visible:ring-orange-500/60"
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
                  placeholder="Official event hotel · Rooftop pool · 5 min walk to the venue"
                  value={row.description}
                  onChange={(e) => update(idx, { description: e.target.value })}
                  className="bg-background/60 resize-none focus-visible:ring-2 focus-visible:ring-orange-500/60"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={addRow}
        disabled={rows.length >= 20}
        className="w-full border-2 border-dashed border-orange-500/30 hover:border-orange-400/70 hover:bg-orange-500/5 h-14 text-orange-300 hover:text-orange-200 font-semibold"
      >
        <Plus className="h-4 w-4 mr-2" /> Add another hotel
      </Button>

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleSave}
          disabled={saveMutation.isPending || rows.length === 0}
          className="btn-vibrant"
        >
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
          Save hotels
        </Button>
      </div>
    </div>
  );
}
