import { useEffect, useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Calendar, Clock, Users, MapPin, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import BunnyVideoPlayer from "@/components/BunnyVideoPlayer";
import ProtectedVideoPlayer from "@/components/ProtectedVideoPlayer";
import { Play, BookOpen } from "lucide-react";
import AddToCartButton from "@/components/cart/AddToCartButton";
import PaymentMethodModal from "@/components/payment/PaymentMethodModal";
import { useCartStore } from "@/stores/cartStore";


export default function ClassDetail() {
  const [, params] = useRoute("/classes/:id");
  const [, setLocation] = useLocation();
  const classId = parseInt(params?.id || "0");
  const { user, isAuthenticated } = useAuth();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { data: classItem, isLoading } = trpc.classes.getById.useQuery(classId, { enabled: !!classId });
  const { data: instructor } = trpc.instructors.getById.useQuery(classItem?.instructorId || 0, { enabled: !!classItem?.instructorId });
  const hasAccessQuery = trpc.classes.hasAccess.useQuery(classId, { enabled: !!classId && isAuthenticated });
  const hasAccess = hasAccessQuery.data === true;
  const { data: tiers } = trpc.classes.listTiers.useQuery(classId, { enabled: !!classId });

  const [selectedTierId, setSelectedTierId] = useState<number | null>(null);
  useEffect(() => {
    if (tiers && tiers.length > 0 && selectedTierId === null) {
      setSelectedTierId(tiers[0].id);
    }
  }, [tiers, selectedTierId]);

  const checkoutMutation = trpc.payments.createClassCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.success("Redirecting to checkout...");
        window.open(data.checkoutUrl, "_blank");
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const cashReservationMutation = trpc.classes.createCashReservation.useMutation({
    onSuccess: (data) => {
      toast.success("Reservation confirmed!");
      sessionStorage.setItem("reservationData", JSON.stringify({ ...data, itemType: "class" }));
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

    const allowsBoth = (classItem as any)?.allowCashPayment && (classItem as any)?.allowOnlinePayment;
    const cashOnly = (classItem as any)?.paymentMethod === "cash";

    if (cashOnly || ((classItem as any)?.allowCashPayment && !allowsBoth)) {
      cashReservationMutation.mutate({ classId });
    } else if (allowsBoth) {
      setShowPaymentModal(true);
    }
  };

  const addToCart = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  const handlePayOnline = () => {
    setShowPaymentModal(false);

    if (!classItem) return;

    // Validate against the selected tier's remaining capacity (or the flat
    // class cap when there are no tiers) so the modal path matches the
    // AddToCartButton validation used by the online-only branch.
    const cap = selectedTier?.maxQuantity ?? classItem.maxParticipants ?? null;
    const sold = selectedTier?.soldCount ?? classItem.currentParticipants ?? 0;
    if (cap != null) {
      const alreadyInCart = cartItems
        .filter((i) => i.type === "class" && i.id === classItem.id && (i.tierId ?? null) === (selectedTier?.id ?? null))
        .reduce((s, i) => s + (i.quantity || 1), 0);
      const available = Math.max(0, cap - sold - alreadyInCart);
      const requested = 1; // ClassDetail doesn't expose a quantity selector currently
      if (requested > available) {
        toast.error(available === 0 ? "Class is full" : `Only ${available} spot${available === 1 ? "" : "s"} left`);
        return;
      }
    }

    addToCart({
      type: "class",
      id: classItem.id,
      title: selectedTier ? `${classItem.title} — ${selectedTier.name}` : classItem.title,
      price,
      imageUrl: classItem.imageUrl || undefined,
      instructorName: instructor?.name,
      danceStyle: classItem.danceStyle || undefined,
      date: classDate.toISOString(),
      quantity: 1,
      ...(selectedTier ? { tierId: selectedTier.id, tierName: selectedTier.name } : {}),
    });
    toast.success("Added to cart", {
      description: `"${selectedTier ? `${classItem.title} — ${selectedTier.name}` : classItem.title}" is in your cart`,
    });
  };

  const handlePayCash = () => {
    setShowPaymentModal(false);
    cashReservationMutation.mutate({ classId });
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

  if (!classItem) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-16 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Class Not Found</h1>
          <Link href="/classes">
            <Button variant="outline">Back to Classes</Button>
          </Link>
        </div>
      </div>
    );
  }

  const classDate = new Date(classItem.classDate);
  const hasTiers = (tiers?.length ?? 0) > 0;
  const selectedTier = hasTiers ? tiers!.find((t: any) => t.id === selectedTierId) : null;
  const price = selectedTier
    ? parseFloat(String(selectedTier.price))
    : parseFloat(String(classItem.price));

  const tierFull = selectedTier?.maxQuantity != null
    ? (selectedTier.soldCount ?? 0) >= selectedTier.maxQuantity
    : false;
  const flatFull = classItem.maxParticipants ? (classItem.currentParticipants || 0) >= classItem.maxParticipants : false;
  const isFull = hasTiers ? tierFull : flatFull;
  const spotsLeft = hasTiers
    ? (selectedTier?.maxQuantity != null ? selectedTier.maxQuantity - (selectedTier.soldCount ?? 0) : null)
    : (classItem.maxParticipants ? classItem.maxParticipants - (classItem.currentParticipants || 0) : null);

  return (
    <div className="min-h-screen bg-background">

      <div className="container py-8 pt-24">
        <Link href="/classes" className="inline-flex items-center gap-2 text-foreground/60 hover:text-accent mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Classes
        </Link>

        {/* Video Player or Cover Image */}
        <div className="w-full mb-8">
          {hasAccess && ((classItem as any).bunnyVideoId || (classItem as any).videoUrl) ? (
            <Card className="overflow-hidden border-border/50 shadow-2xl max-w-4xl mx-auto">
              {(classItem as any).bunnyVideoId && (classItem as any).bunnyLibraryId ? (
                <BunnyVideoPlayer
                  bunnyVideoId={(classItem as any).bunnyVideoId}
                  bunnyLibraryId={(classItem as any).bunnyLibraryId}
                  title={classItem.title}
                />
              ) : (classItem as any).videoUrl ? (
                <ProtectedVideoPlayer
                  src={(classItem as any).videoUrl}
                  poster={(classItem as any).imageUrl || undefined}
                  title={classItem.title}
                  isBunnyVideo={(classItem as any).videoUrl.includes('iframe.mediadelivery.net')}
                />
              ) : null}
              <div className="px-4 py-3 bg-card/80 border-t border-border/30 flex items-center gap-3">
                <Play size={14} className="text-[#FA3698]" />
                <p className="text-sm font-medium text-foreground/80">Grabación de la class</p>
              </div>
            </Card>
          ) : (classItem as any).imageUrl && (
            <div className="w-full h-56 md:h-72 rounded-xl overflow-hidden shadow-lg">
              <img
                src={(classItem as any).imageUrl}
                alt={classItem.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {classItem.danceStyle && (
                  <Badge className="bg-accent/20 text-accent border-accent/50">{classItem.danceStyle}</Badge>
                )}
                <Badge variant="outline" className="text-foreground/70">
                  {classItem.level ? classItem.level.charAt(0).toUpperCase() + classItem.level.slice(1) : "All levels"}
                </Badge>
              </div>
              <h1 className="text-4xl font-bold mb-4">{classItem.title}</h1>

              <div className="flex flex-wrap gap-4 text-foreground/70">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-accent" />
                  <span>{classDate.toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-accent" />
                  <span>{classDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                {classItem.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-accent" />
                    <span>{classItem.duration} min</span>
                  </div>
                )}
                {classItem.maxParticipants && (
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-accent" />
                    <span>{classItem.currentParticipants || 0} / {classItem.maxParticipants} participants</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">About this class</h2>
                <div className="text-foreground/80 whitespace-pre-wrap leading-relaxed">
                  {classItem.description || "Dance class with a professional instructor. Come ready to dance and have fun."}
                </div>
              </CardContent>
            </Card>

            {/* Instructor */}
            {instructor && (
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-xl font-semibold mb-4">Your Instructor</h2>
                  <div className="flex items-center gap-4">
                    {instructor.photoUrl ? (
                      <img src={instructor.photoUrl} alt={instructor.name} className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-bold text-xl">
                        {instructor.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-lg">{instructor.name}</p>
                      <p className="text-sm text-foreground/60">{instructor.bio || "Professional Dance Instructor"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Purchase Card */}
          <div>
            <Card className="sticky top-24 border-accent/20">
              <CardContent className="pt-6 space-y-6">
                <div className="text-center">
                  <p className="text-sm text-foreground/60 mb-1">{selectedTier?.name || "Price per class"}</p>
                  <p className="text-4xl font-bold text-accent">£{price.toFixed(2)}</p>
                </div>

                {hasTiers && tiers!.length > 1 && (
                  <div>
                    <p className="text-sm text-foreground/60 mb-2">Ticket type</p>
                    <div className="space-y-2">
                      {tiers!.map((t: any) => {
                        const tierPrice = parseFloat(String(t.price));
                        const tierRemaining = t.maxQuantity != null ? t.maxQuantity - (t.soldCount ?? 0) : null;
                        const tierSoldOut = tierRemaining != null && tierRemaining <= 0;
                        const active = selectedTierId === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            disabled={tierSoldOut}
                            onClick={() => setSelectedTierId(t.id)}
                            className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                              active
                                ? "border-accent bg-accent/10"
                                : "border-border/40 bg-background/40 hover:border-accent/40"
                            } ${tierSoldOut ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className={`font-semibold ${active ? "text-accent" : "text-foreground"}`}>{t.name}</p>
                                {t.description && (
                                  <p className="text-xs text-foreground/60 mt-0.5 line-clamp-2">{t.description}</p>
                                )}
                                {tierRemaining != null && tierRemaining > 0 && tierRemaining <= 10 && (
                                  <p className="text-xs text-orange-400 mt-1">Only {tierRemaining} left</p>
                                )}
                                {tierSoldOut && (
                                  <p className="text-xs text-destructive mt-1">Sold out</p>
                                )}
                              </div>
                              <p className="font-bold text-accent shrink-0">£{tierPrice.toFixed(2)}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {hasAccess ? (
                  <div className="space-y-3">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                      <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="font-semibold text-green-400">You're already enrolled</p>
                      <p className="text-sm text-foreground/60 mt-1">Check your dashboard for details</p>
                    </div>
                    <Link href="/dashboard">
                      <Button className="w-full" variant="outline">
                        View my enrolment
                      </Button>
                    </Link>
                  </div>
                ) : isFull ? (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center">
                    <p className="font-semibold text-destructive">Class Full</p>
                    <p className="text-sm text-foreground/60 mt-1">No spots available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-foreground/80">Professional instructor</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-foreground/80">Small group setting</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-foreground/80">All levels welcome</span>
                      </li>
                    </ul>

                    {/* Dynamic button based on payment methods */}
                    {(() => {
                      const allowsCash = (classItem as any)?.allowCashPayment || (classItem as any)?.paymentMethod === "cash" || (classItem as any)?.paymentMethod === "both";
                      const allowsOnline = (classItem as any)?.allowOnlinePayment !== false && (classItem as any)?.paymentMethod !== "cash";
                      const allowsBoth = allowsCash && allowsOnline;

                      if (allowsBoth) {
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
                        return (
                          <AddToCartButton
                            item={{
                              type: "class",
                              id: classItem.id,
                              title: selectedTier ? `${classItem.title} — ${selectedTier.name}` : classItem.title,
                              price: price,
                              imageUrl: classItem.imageUrl || undefined,
                              instructorName: instructor?.name,
                              danceStyle: classItem.danceStyle || undefined,
                              date: classDate.toISOString(),
                              ...(selectedTier ? { tierId: selectedTier.id, tierName: selectedTier.name } : {}),
                            }}
                            maxStock={selectedTier?.maxQuantity ?? classItem.maxParticipants ?? undefined}
                            currentlySold={selectedTier?.soldCount ?? classItem.currentParticipants ?? 0}
                            className="w-full py-6 text-lg"
                            data-cart-button="class"
                          />
                        );
                      }
                    })()}

                    {spotsLeft !== null && spotsLeft <= 5 && (
                      <p className="text-sm text-center text-orange-400">
                        Only {spotsLeft} spots left!
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="h-16" />

      {/* Payment Method Modal */}
      {classItem && (
        <PaymentMethodModal
          open={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSelectOnline={handlePayOnline}
          onSelectCash={handlePayCash}
          price={price.toFixed(2)}
          itemTitle={classItem.title}
          itemType="class"
        />
      )}
    </div>
  );
}
