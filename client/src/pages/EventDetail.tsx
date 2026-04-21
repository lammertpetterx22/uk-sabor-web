import { useState, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Calendar, MapPin, Clock, Users, Ticket, ArrowLeft, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import AddToCartButton from "@/components/cart/AddToCartButton";
import PaymentMethodModal from "@/components/payment/PaymentMethodModal";
import { useCartStore } from "@/stores/cartStore";
import { Trans, useTr } from "@/components/Trans";

export default function EventDetail() {
  const [, params] = useRoute("/events/:id");
  const [, setLocation] = useLocation();
  const eventId = parseInt(params?.id || "0");
  const { user, isAuthenticated } = useAuth();
  const { tr } = useTr();
  const [quantity, setQuantity] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { data: event, isLoading } = trpc.events.getById.useQuery(eventId, { enabled: !!eventId });
  const hasAccessQuery = trpc.events.hasAccess.useQuery(eventId, { enabled: !!eventId && isAuthenticated });
  const { data: tiers } = trpc.events.listTiers.useQuery(eventId, { enabled: !!eventId });

  const [selectedTierId, setSelectedTierId] = useState<number | null>(null);

  // Default-select the first (lowest position) tier whenever tiers load
  useEffect(() => {
    if (tiers && tiers.length > 0 && selectedTierId === null) {
      setSelectedTierId(tiers[0].id);
    }
  }, [tiers, selectedTierId]);

  const checkoutMutation = trpc.payments.createEventCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.success("Redirecting to checkout...");
        window.open(data.checkoutUrl, "_blank");
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const cashReservationMutation = trpc.events.createCashReservation.useMutation({
    onSuccess: (data) => {
      toast.success("Reservation confirmed!");
      // Store reservation data and navigate to confirmation page
      sessionStorage.setItem("reservationData", JSON.stringify({ ...data, itemType: "event" }));
      setLocation("/reservation-confirmation");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleReserveClick = () => {
    if (!isAuthenticated) {
      toast.error("Please log in to reserve your spot");
      setLocation("/login");
      return;
    }

    // Check if event allows both payment methods
    const allowsBoth = (event as any)?.allowCashPayment && (event as any)?.allowOnlinePayment;
    const cashOnly = (event as any)?.paymentMethod === "cash";

    if (cashOnly || ((event as any)?.allowCashPayment && !allowsBoth)) {
      // Cash only - create reservation directly
      cashReservationMutation.mutate({ eventId });
    } else if (allowsBoth) {
      // Show modal to choose payment method
      setShowPaymentModal(true);
    } else {
      // Online only - use existing cart flow (do nothing, AddToCartButton handles it)
    }
  };

  const addToCart = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  const handlePayOnline = () => {
    setShowPaymentModal(false);

    if (!event) return;

    // Validate against the selected tier's remaining capacity (or the flat
    // event cap when there are no tiers) — mirrors the check that the
    // AddToCartButton does for the online-only branch so the modal path
    // doesn't silently bypass it.
    const cap = selectedTier?.maxQuantity ?? event.maxTickets ?? null;
    const sold = selectedTier?.soldCount ?? event.ticketsSold ?? 0;
    if (cap != null) {
      const alreadyInCart = cartItems
        .filter((i) => i.type === "event" && i.id === event.id && (i.tierId ?? null) === (selectedTier?.id ?? null))
        .reduce((s, i) => s + (i.quantity || 1), 0);
      const available = Math.max(0, cap - sold - alreadyInCart);
      if (quantity > available) {
        toast.error(available === 0 ? "Sold out" : `Only ${available} ticket${available === 1 ? "" : "s"} left`);
        return;
      }
    }

    addToCart({
      type: "event",
      id: event.id,
      title: selectedTier ? `${event.title} — ${selectedTier.name}` : event.title,
      price,
      imageUrl: event.imageUrl || undefined,
      date: eventDate.toISOString(),
      location: event.venue,
      quantity,
      ...(selectedTier ? { tierId: selectedTier.id, tierName: selectedTier.name } : {}),
    });
    toast.success("Added to cart", {
      description: `"${selectedTier ? `${event.title} — ${selectedTier.name}` : event.title}" is in your cart`,
    });
  };

  const handlePayCash = () => {
    setShowPaymentModal(false);
    cashReservationMutation.mutate({ eventId });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex justify-center items-center py-32">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4"><Trans>Event not found</Trans></h1>
          <Link href="/events">
            <Button variant="outline"><Trans>Back to Events</Trans></Button>
          </Link>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.eventDate);
  const hasTiers = (tiers?.length ?? 0) > 0;
  const selectedTier = hasTiers ? tiers!.find((t: any) => t.id === selectedTierId) : null;

  // When an event uses tiers, pricing and remaining capacity follow the
  // selected tier. Otherwise we fall back to the flat event fields.
  const price = selectedTier
    ? parseFloat(String(selectedTier.price))
    : parseFloat(String(event.ticketPrice));

  const tierSoldOut = selectedTier?.maxQuantity != null
    ? (selectedTier.soldCount ?? 0) >= selectedTier.maxQuantity
    : false;
  const flatSoldOut = event.maxTickets ? (event.ticketsSold || 0) >= event.maxTickets : false;
  const isSoldOut = hasTiers ? tierSoldOut : flatSoldOut;

  const hasTicket = hasAccessQuery.data === true;
  const spotsLeft = hasTiers
    ? (selectedTier?.maxQuantity != null ? selectedTier.maxQuantity - (selectedTier.soldCount ?? 0) : null)
    : (event.maxTickets ? event.maxTickets - (event.ticketsSold || 0) : null);

  return (
    <div className="min-h-screen bg-background">

      {/* Hero Section — prefer banner (landscape) over cover (flyer) */}
      <div className="relative">
        {((event as any).bannerUrl || event.imageUrl) ? (
          <div className="h-[400px] w-full relative">
            <img
              src={(event as any).bannerUrl || event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </div>
        ) : (
          <div className="h-[300px] w-full bg-gradient-to-br from-accent/20 via-background to-background" />
        )}

        <div className="container relative -mt-32 z-10">
          <Link href="/events" className="inline-flex items-center gap-2 text-foreground/60 hover:text-accent mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <Trans>Back to Events</Trans>
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Event Info */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <Badge className="mb-3 bg-accent/20 text-accent border-accent/50">
                  {event.status === "published" ? tr("Available") : event.status}
                </Badge>
                <h1 className="text-4xl font-bold mb-4">{event.title}</h1>

                <div className="flex flex-wrap gap-4 text-foreground/70">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-accent" />
                    <span>{eventDate.toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-accent" />
                    <span>{eventDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-accent" />
                    <span>{event.venue}{event.city ? `, ${event.city}` : ""}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-xl font-semibold mb-4"><Trans>About this event</Trans></h2>
                  <div className="text-foreground/80 whitespace-pre-wrap leading-relaxed">
                    {event.description || tr("More information coming soon.")}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Purchase Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 border-accent/20">
                <CardContent className="pt-6 space-y-6">
                  <div className="text-center">
                    <p className="text-sm text-foreground/60 mb-1">
                      {selectedTier?.name || tr("Price per ticket")}
                    </p>
                    <p className="text-4xl font-bold text-accent">£{price.toFixed(2)}</p>
                  </div>

                  {hasTicket ? (
                    <div className="space-y-3">
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                        <Ticket className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="font-semibold text-green-400"><Trans>You have your ticket</Trans></p>
                        <p className="text-sm text-foreground/60 mt-1"><Trans>Check your dashboard for the code</Trans></p>
                      </div>
                      <Link href="/dashboard">
                        <Button className="w-full" variant="outline">
                          <Trans>View my ticket</Trans>
                        </Button>
                      </Link>
                    </div>
                  ) : isSoldOut ? (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center">
                      <p className="font-semibold text-destructive"><Trans>Sold Out</Trans></p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Ticket Type selector (only shown when the event has 2+ tiers) */}
                      {hasTiers && tiers!.length > 1 && (
                        <div>
                          <p className="text-sm text-foreground/60 mb-2"><Trans>Ticket type</Trans></p>
                          <div className="space-y-2">
                            {tiers!.map((t: any) => {
                              const tierPrice = parseFloat(String(t.price));
                              const tierRemaining = t.maxQuantity != null ? t.maxQuantity - (t.soldCount ?? 0) : null;
                              const tierSoldOutRow = tierRemaining != null && tierRemaining <= 0;
                              const active = selectedTierId === t.id;
                              return (
                                <button
                                  key={t.id}
                                  type="button"
                                  disabled={tierSoldOutRow}
                                  onClick={() => setSelectedTierId(t.id)}
                                  className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                                    active
                                      ? "border-accent bg-accent/10"
                                      : "border-border/40 bg-background/40 hover:border-accent/40"
                                  } ${tierSoldOutRow ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className={`font-semibold ${active ? "text-accent" : "text-foreground"}`}>
                                        {t.name}
                                      </p>
                                      {t.description && (
                                        <p className="text-xs text-foreground/60 mt-0.5 line-clamp-2">{t.description}</p>
                                      )}
                                      {tierRemaining != null && tierRemaining > 0 && tierRemaining <= 10 && (
                                        <p className="text-xs text-orange-400 mt-1">Only {tierRemaining} left</p>
                                      )}
                                      {tierSoldOutRow && (
                                        <p className="text-xs text-destructive mt-1">Sold out</p>
                                      )}
                                    </div>
                                    <div className="text-right shrink-0">
                                      <p className="font-bold text-accent">£{tierPrice.toFixed(2)}</p>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Quantity selector */}
                      <div>
                        <p className="text-sm text-foreground/60 mb-2"><Trans>Quantity</Trans></p>
                        <div className="flex items-center justify-center gap-4">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            disabled={quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="text-2xl font-bold w-8 text-center">{quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10"
                            onClick={() => setQuantity(Math.min(10, quantity + 1))}
                            disabled={quantity >= 10}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="border-t border-border/50 pt-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-foreground/60">{quantity}x {tr("Ticket")}</span>
                          <span>£{(price * quantity).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg mt-2">
                          <span><Trans>Total</Trans></span>
                          <span className="text-accent">£{(price * quantity).toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Dynamic button based on payment methods */}
                      {(() => {
                        const allowsCash = (event as any)?.allowCashPayment || (event as any)?.paymentMethod === "cash" || (event as any)?.paymentMethod === "both";
                        const allowsOnline = (event as any)?.allowOnlinePayment !== false && (event as any)?.paymentMethod !== "cash";
                        const allowsBoth = allowsCash && allowsOnline;

                        if (allowsBoth) {
                          // Both methods - show button that opens modal
                          return (
                            <Button
                              onClick={handleReserveClick}
                              disabled={cashReservationMutation.isPending}
                              className="w-full py-6 text-lg bg-gradient-to-r from-pink-500 to-red-500"
                            >
                              {cashReservationMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                  {tr("Processing...")}
                                </>
                              ) : (
                                tr("Reserve Your Spot")
                              )}
                            </Button>
                          );
                        } else if (allowsCash && !allowsOnline) {
                          // Cash only
                          return (
                            <Button
                              onClick={handleReserveClick}
                              disabled={cashReservationMutation.isPending}
                              className="w-full py-6 text-lg bg-gradient-to-r from-green-500 to-emerald-500"
                            >
                              {cashReservationMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                  Reserving...
                                </>
                              ) : (
                                <>💵 Reserve (Pay at Door)</>
                              )}
                            </Button>
                          );
                        } else {
                          // Online only (default)
                          return (
                            <AddToCartButton
                              item={{
                                type: "event",
                                id: event.id,
                                title: selectedTier ? `${event.title} — ${selectedTier.name}` : event.title,
                                price: price,
                                imageUrl: event.imageUrl || undefined,
                                date: eventDate.toISOString(),
                                location: event.venue,
                                quantity: quantity,
                                ...(selectedTier ? { tierId: selectedTier.id, tierName: selectedTier.name } : {}),
                              }}
                              maxStock={selectedTier?.maxQuantity ?? event.maxTickets ?? undefined}
                              currentlySold={selectedTier?.soldCount ?? event.ticketsSold ?? 0}
                              className="w-full py-6 text-lg"
                              data-cart-button="event"
                            />
                          );
                        }
                      })()}

                      {event.showLowTicketAlert && spotsLeft !== null && spotsLeft <= 20 && (
                        <p className="text-sm text-center text-orange-400">
                          Only {spotsLeft} tickets left!
                        </p>
                      )}


                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Footer spacer */}
      <div className="h-16" />

      {/* Payment Method Modal */}
      {event && (
        <PaymentMethodModal
          open={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSelectOnline={handlePayOnline}
          onSelectCash={handlePayCash}
          price={price.toFixed(2)}
          itemTitle={event.title}
          itemType="event"
        />
      )}
    </div>
  );
}
