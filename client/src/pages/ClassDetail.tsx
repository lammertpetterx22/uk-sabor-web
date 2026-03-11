import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Calendar, Clock, Users, MapPin, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function ClassDetail() {
  const [, params] = useRoute("/classes/:id");
  const classId = parseInt(params?.id || "0");
  const { user, isAuthenticated } = useAuth();

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

        {/* Cover image */}
        {(classItem as any).imageUrl && (
          <div className="w-full h-56 md:h-72 rounded-xl overflow-hidden mb-8">
            <img
              src={(classItem as any).imageUrl}
              alt={classItem.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

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
                ) : classItem.paymentMethod === "cash" ? (
                  <div className="space-y-4">
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
                      <AlertCircle className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <p className="font-semibold text-blue-400">Payment in cash at the door</p>
                      <p className="text-sm text-foreground/60 mt-1">Contact the instructor for more details</p>
                    </div>
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

                    {isAuthenticated ? (
                      <Button
                        className="w-full btn-vibrant text-lg py-6"
                        onClick={() => checkoutMutation.mutate({ classId: classItem.id })}
                        disabled={checkoutMutation.isPending}
                      >
                        {checkoutMutation.isPending ? (
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        ) : null}
                        Enroll - £{price.toFixed(2)}
                      </Button>
                    ) : (
                      <Link href="/login">
                        <Button className="w-full btn-vibrant text-lg py-6">
                          Sign in to enrol
                        </Button>
                      </Link>
                    )}

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
    </div>
  );
}
