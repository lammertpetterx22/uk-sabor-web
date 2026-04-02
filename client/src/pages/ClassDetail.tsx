import { useState } from "react";
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

  const handlePayOnline = () => {
    setShowPaymentModal(false);
    const addToCartBtn = document.querySelector('[data-cart-button="class"]') as HTMLButtonElement;
    if (addToCartBtn) {
      addToCartBtn.click();
    }
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
  const price = parseFloat(String(classItem.price));
  const isFull = classItem.maxParticipants ? (classItem.currentParticipants || 0) >= classItem.maxParticipants : false;
  const spotsLeft = classItem.maxParticipants ? classItem.maxParticipants - (classItem.currentParticipants || 0) : null;

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
                <p className="text-sm font-medium text-foreground/80">Grabación de la clase</p>
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
                  <p className="text-sm text-foreground/60 mb-1">Price per class</p>
                  <p className="text-4xl font-bold text-accent">£{price.toFixed(2)}</p>
                </div>

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
                              title: classItem.title,
                              price: price,
                              imageUrl: classItem.imageUrl || undefined,
                              instructorName: instructor?.name,
                              danceStyle: classItem.danceStyle || undefined,
                              date: classDate.toISOString(),
                            }}
                            maxStock={classItem.maxParticipants || undefined}
                            currentlySold={classItem.currentParticipants || 0}
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
