import { useState } from "react";
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

export default function EventDetail() {
  const [, params] = useRoute("/events/:id");
  const [, setLocation] = useLocation();
  const eventId = parseInt(params?.id || "0");
  const { user, isAuthenticated } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { data: event, isLoading } = trpc.events.getById.useQuery(eventId, { enabled: !!eventId });
  const hasAccessQuery = trpc.events.hasAccess.useQuery(eventId, { enabled: !!eventId && isAuthenticated });

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

  const handlePayOnline = () => {
    setShowPaymentModal(false);
    // Trigger the add to cart button click programmatically
    // Or we can implement the checkout logic here
    const addToCartBtn = document.querySelector('[data-cart-button="event"]') as HTMLButtonElement;
    if (addToCartBtn) {
      addToCartBtn.click();
    }
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
          <h1 className="text-2xl font-bold mb-4">Event not found</h1>
          <Link href="/events">
            <Button variant="outline">Back to Events</Button>
          </Link>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.eventDate);
  const price = parseFloat(String(event.ticketPrice));
  const isSoldOut = event.maxTickets ? (event.ticketsSold || 0) >= event.maxTickets : false;
  const hasTicket = hasAccessQuery.data === true;
  const spotsLeft = event.maxTickets ? event.maxTickets - (event.ticketsSold || 0) : null;

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
            Back to Events
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Event Info */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <Badge className="mb-3 bg-accent/20 text-accent border-accent/50">
                  {event.status === "published" ? "Available" : event.status}
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
                  <h2 className="text-xl font-semibold mb-4">About this event</h2>
                  <div className="text-foreground/80 whitespace-pre-wrap leading-relaxed">
                    {event.description || "More information coming soon."}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Purchase Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 border-accent/20">
                <CardContent className="pt-6 space-y-6">
                  <div className="text-center">
                    <p className="text-sm text-foreground/60 mb-1">Price per ticket</p>
                    <p className="text-4xl font-bold text-accent">£{price.toFixed(2)}</p>
                  </div>

                  {hasTicket ? (
                    <div className="space-y-3">
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                        <Ticket className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="font-semibold text-green-400">You have your ticket</p>
                        <p className="text-sm text-foreground/60 mt-1">Check your dashboard for the code</p>
                      </div>
                      <Link href="/dashboard">
                        <Button className="w-full" variant="outline">
                          View my ticket
                        </Button>
                      </Link>
                    </div>
                  ) : isSoldOut ? (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center">
                      <p className="font-semibold text-destructive">Sold Out</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Quantity selector */}
                      <div>
                        <p className="text-sm text-foreground/60 mb-2">Quantity</p>
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
                          <span className="text-foreground/60">{quantity}x Ticket</span>
                          <span>£{(price * quantity).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg mt-2">
                          <span>Total</span>
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
                                  Processing...
                                </>
                              ) : (
                                "Reserve Your Spot"
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
                                title: event.title,
                                price: price,
                                imageUrl: event.imageUrl || undefined,
                                date: eventDate.toISOString(),
                                location: event.venue,
                                quantity: quantity,
                              }}
                              maxStock={event.maxTickets || undefined}
                              currentlySold={event.ticketsSold || 0}
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
