import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, ExternalLink, MapPin, Tag, Check, Copy } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface EventHotelsProps {
  eventId: number;
}

/**
 * Public "Where to Stay" block shown below the event description.
 * Lists partner hotels as cards with image, price-from, distance, optional
 * discount code chip (click to copy) and a prominent "Book Now" button
 * that opens the booking URL in a new tab.
 */
export default function EventHotels({ eventId }: EventHotelsProps) {
  const { data: hotels, isLoading } = trpc.events.listHotels.useQuery(eventId, {
    enabled: !!eventId,
  });
  const [copiedId, setCopiedId] = useState<number | null>(null);

  if (isLoading) return null;
  if (!hotels || hotels.length === 0) return null;

  const copy = async (hotelId: number, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(hotelId);
      toast.success(`Code ${code} copied`);
      setTimeout(() => setCopiedId((v) => (v === hotelId ? null : v)), 1500);
    } catch {
      toast.error("Couldn't copy — select and copy manually");
    }
  };

  return (
    <Card className="overflow-hidden border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
      <CardContent className="pt-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500/15 border border-orange-500/30">
            <Building2 className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Where to Stay</h2>
            <p className="text-xs text-foreground/50 mt-0.5">Partner hotels for this event</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hotels.map((h: any) => {
            const priceFrom = h.priceFromGBP ? parseFloat(String(h.priceFromGBP)) : null;
            const distance = h.distanceKm ? parseFloat(String(h.distanceKm)) : null;
            return (
              <div
                key={h.id}
                className="rounded-2xl overflow-hidden border border-orange-500/20 bg-background/60 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10 transition-all flex flex-col"
              >
                {h.imageUrl ? (
                  <div className="relative w-full aspect-[16/9] bg-gradient-to-br from-orange-500/20 to-amber-500/10 overflow-hidden">
                    <img
                      src={h.imageUrl}
                      alt={h.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {priceFrom !== null && (
                      <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur text-white text-sm font-semibold">
                        from £{priceFrom.toFixed(2)}/night
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full aspect-[16/9] bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-background flex items-center justify-center">
                    <Building2 className="h-12 w-12 text-orange-500/40" />
                  </div>
                )}

                <div className="flex-1 p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-lg leading-tight line-clamp-1">{h.name}</h3>
                    {h.description && (
                      <p className="text-sm text-foreground/60 mt-1 line-clamp-2 leading-snug">{h.description}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    {priceFrom !== null && !h.imageUrl && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-300 border border-orange-500/30 font-semibold">
                        from £{priceFrom.toFixed(2)}/night
                      </span>
                    )}
                    {distance !== null && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-foreground/5 border border-foreground/10 text-foreground/70">
                        <MapPin className="h-3 w-3" /> {distance} km from venue
                      </span>
                    )}
                  </div>

                  {h.discountCode && (
                    <button
                      type="button"
                      onClick={() => copy(h.id, h.discountCode)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30 hover:border-orange-500/60 transition-colors group"
                      title="Click to copy"
                    >
                      <span className="flex items-center gap-2 text-sm">
                        <Tag className="h-3.5 w-3.5 text-orange-400" />
                        <span className="text-foreground/60">Promo code:</span>
                        <span className="font-mono font-bold tracking-wider text-orange-300">{h.discountCode}</span>
                      </span>
                      {copiedId === h.id ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4 text-foreground/40 group-hover:text-orange-400" />
                      )}
                    </button>
                  )}

                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-semibold"
                  >
                    <a href={h.bookingUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Book Now
                    </a>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
