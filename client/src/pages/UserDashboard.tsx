import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TRPCClientError } from "@trpc/client";
import {
  Loader2, Ticket, BookOpen, Users, Calendar, Clock, MapPin, Play,
  ShoppingBag, ArrowRight, Music, GraduationCap, Sparkles, QrCode, Download, X, Mail, FileText
} from "lucide-react";
import { toast } from "sonner";

// ─── Invoice Download Button ─────────────────────────────────────────────────
function InvoiceDownloadButton({ orderId }: { orderId: number }) {
  const [loading, setLoading] = useState(false);
  const downloadMutation = trpc.payments.downloadInvoice.useMutation({
    onSuccess: (data) => {
      // Decode base64 and trigger download
      const byteChars = atob(data.base64);
      const byteNums = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
      const blob = new Blob([new Uint8Array(byteNums)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
      setLoading(false);
      toast.success("Invoice downloaded!");
    },
    onError: (err: any) => {
      setLoading(false);
      toast.error(err?.message || "Failed to download invoice");
    },
  });

  const handleClick = () => {
    setLoading(true);
    downloadMutation.mutate({ orderId });
  };

  return (
    <Button
      size="sm"
      variant="outline"
      className="border-border/40 text-foreground/60 hover:text-foreground hover:border-border"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
      ) : (
        <FileText className="h-3.5 w-3.5 mr-1.5" />
      )}
      Invoice PDF
    </Button>
  );
}

// ─── QR Code Viewer Dialog ────────────────────────────────────────────────────
function QRDialog({ open, onClose, qrData, code, title }: {
  open: boolean;
  onClose: () => void;
  qrData: string;
  code: string;
  title: string;
}) {
  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = qrData;
    a.download = `qr-${code}.png`;
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-accent" />
            Your Check-In QR Code
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          <p className="text-sm text-foreground/60 text-center">{title}</p>
          <div className="border-4 border-accent/30 rounded-xl p-2 bg-white">
            <img src={qrData} alt="QR Code" className="w-52 h-52" />
          </div>
          <div className="bg-foreground/5 border border-border/50 rounded-lg px-4 py-2 text-center w-full">
            <p className="text-xs text-foreground/50 mb-1">Code</p>
            <p className="font-mono text-xs font-bold text-accent break-all">{code}</p>
          </div>
          <p className="text-xs text-foreground/50 text-center">
            Show this QR code at the entrance to check in. Screenshot it for offline use.
          </p>
          <Button onClick={handleDownload} variant="outline" size="sm" className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Download QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── QR Button (shows QR for a specific order) ───────────────────────────────
function QRButton({ orderId, itemType, itemId, title }: {
  orderId: number;
  itemType: "event" | "class";
  itemId: number;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const { data: userQRs, isLoading: qrLoading } = trpc.qrcode.getUserQRCodes.useQuery();
  const resendQRMutation = trpc.payments.resendQREmail.useMutation({
    onSuccess: () => {
      toast.success("QR code sent to your email!");
      setResendLoading(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to resend QR code");
      setResendLoading(false);
    },
  });

  // Find the personal QR code for this specific order
  const qr = userQRs?.find(q =>
    q.orderId === orderId && q.itemType === itemType && q.itemId === itemId
  );

  // Show loading spinner while QRs are being fetched/generated
  if (qrLoading) {
    return (
      <Button size="sm" variant="outline" className="border-accent/40 text-accent/50" disabled>
        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
        Loading QR...
      </Button>
    );
  }

  if (!qr) return null;

  const handleResendQR = () => {
    setResendLoading(true);
    resendQRMutation.mutate({ orderId, itemType, itemId });
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="border-accent/40 text-accent hover:bg-accent/10 flex-1"
          onClick={() => setOpen(true)}
        >
          <QrCode className="h-4 w-4 mr-1.5" />
          Show QR
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-accent/40 text-accent hover:bg-accent/10"
          onClick={handleResendQR}
          disabled={resendLoading}
        >
          {resendLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
        </Button>
      </div>
      <QRDialog
        open={open}
        onClose={() => setOpen(false)}
        qrData={qr.qrData}
        code={qr.code}
        title={title}
      />
    </>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function UserDashboard() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex justify-center items-center py-32">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-16 pt-28 text-center">
          <ShoppingBag className="h-16 w-16 text-foreground/20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sign in to view your dashboard</h1>
          <p className="text-foreground/60 mb-6">You need an account to view your purchases and tickets.</p>
          <Link href="/login">
            <Button className="btn-vibrant">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">

      <div className="container py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text">Hello, {user?.name || "Dancer"} 👋</h1>
          <p className="text-foreground/60 mt-1">View all your purchases and access information here.</p>
        </div>

        <Tabs defaultValue="tickets" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-3xl">
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              <span className="hidden sm:inline">Tickets</span>
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Courses</span>
            </TabsTrigger>
            <TabsTrigger value="classes" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Classes</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Subs</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Orders</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tickets">
            <TicketsTab />
          </TabsContent>
          <TabsContent value="courses">
            <CoursesTab />
          </TabsContent>
          <TabsContent value="classes">
            <ClassesTab />
          </TabsContent>
          <TabsContent value="subscriptions">
            <SubscriptionsTab />
          </TabsContent>
          <TabsContent value="orders">
            <OrdersTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─── Tickets Tab ──────────────────────────────────────────────────────────────
function TicketsTab() {
  const { data: tickets, isLoading } = trpc.payments.getUserTickets.useQuery();

  if (isLoading) return <LoadingState />;

  if (!tickets || tickets.length === 0) {
    return (
      <EmptyState
        icon={<Ticket className="h-10 w-10 text-accent/60" />}
        gradientFrom="from-accent/20"
        gradientTo="to-primary/20"
        title="No Tickets Yet"
        description="Purchase tickets for our dance events and they will appear here with your personal QR code"
        linkHref="/events"
        linkText="Browse Events"
        linkIcon={<Music className="h-4 w-4 mr-2" />}
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {tickets.map((ticket) => (
        <Card key={ticket.id} className="border-border/50 hover:border-accent/30 transition-colors">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{ticket.event?.title || "Event"}</h3>
                {ticket.event && (
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-foreground/60">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(ticket.event.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {ticket.event.venue}
                    </div>
                  </div>
                )}
              </div>
              <Badge className={ticket.status === "valid" ? "bg-green-500/20 text-green-400" : "bg-foreground/10 text-foreground/50"}>
                {ticket.status === "valid" ? "Valid" : ticket.status === "used" ? "Used" : "Cancelled"}
              </Badge>
            </div>

            {ticket.ticketCode && (
              <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 text-center mb-3">
                <p className="text-xs text-foreground/50 mb-1">Ticket Code</p>
                <p className="font-mono text-sm font-bold text-accent tracking-wider break-all">{ticket.ticketCode}</p>
              </div>
            )}

            {/* QR Code button + Invoice download */}
            {ticket.orderId && (
              <div className="space-y-2">
                <QRButton
                  orderId={ticket.orderId}
                  itemType="event"
                  itemId={ticket.eventId}
                  title={ticket.event?.title || "Event"}
                />
                <InvoiceDownloadButton orderId={ticket.orderId} />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Courses Tab ──────────────────────────────────────────────────────────────
function CoursesTab() {
  const { data: purchases, isLoading } = trpc.payments.getUserCourses.useQuery();

  if (isLoading) return <LoadingState />;

  if (!purchases || purchases.length === 0) {
    return (
      <EmptyState
        icon={<GraduationCap className="h-10 w-10 text-blue-400/60" />}
        gradientFrom="from-blue-500/20"
        gradientTo="to-purple-500/20"
        title="No courses yet"
        description="Enrol in our online dance courses and get access to exclusive videos from professional instructors"
        linkHref="/courses"
        linkText="Browse Courses"
        linkIcon={<BookOpen className="h-4 w-4 mr-2" />}
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {purchases.map((purchase) => (
        <Card key={purchase.id} className="border-border/50 hover:border-accent/30 transition-colors">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">{purchase.course?.title || "Course"}</h3>
                {purchase.course?.danceStyle && (
                  <Badge variant="outline" className="mt-1 text-xs">{purchase.course.danceStyle}</Badge>
                )}
              </div>
              <Badge className={purchase.completed ? "bg-green-500/20 text-green-400" : "bg-accent/20 text-accent"}>
                {purchase.completed ? "Completed" : `${purchase.progress || 0}%`}
              </Badge>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-foreground/10 rounded-full h-2 mb-4">
              <div
                className="bg-accent rounded-full h-2 transition-all"
                style={{ width: `${purchase.progress || 0}%` }}
              />
            </div>

            <Link href={`/courses/${purchase.courseId}`}>
              <Button className="w-full" variant="outline">
                <Play className="h-4 w-4 mr-2" />
                {purchase.progress && purchase.progress > 0 ? "Continue Watching" : "Start Course"}
              </Button>
            </Link>
            {purchase.orderId && (
              <div className="mt-2">
                <InvoiceDownloadButton orderId={purchase.orderId} />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Classes Tab ──────────────────────────────────────────────────────────────
function ClassesTab() {
  const { data: purchases, isLoading } = trpc.payments.getUserClasses.useQuery();

  if (isLoading) return <LoadingState />;

  if (!purchases || purchases.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="h-10 w-10 text-green-400/60" />}
        gradientFrom="from-green-500/20"
        gradientTo="to-emerald-500/20"
        title="No classes booked yet"
        description="Book in-person classes with our instructors and improve your dance technique"
        linkHref="/classes"
        linkText="Browse Classes"
        linkIcon={<Sparkles className="h-4 w-4 mr-2" />}
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {purchases.map((purchase) => (
        <Card key={purchase.id} className="border-border/50 hover:border-accent/30 transition-colors">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{purchase.classItem?.title || "Class"}</h3>
                {purchase.classItem && (
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-foreground/60">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(purchase.classItem.classDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(purchase.classItem.classDate).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                )}
              </div>
              <Badge className={purchase.status === "active" ? "bg-green-500/20 text-green-400" : "bg-foreground/10 text-foreground/50"}>
                {purchase.status === "active" ? "Active" : purchase.status === "cancelled" ? "Cancelled" : "Expired"}
              </Badge>
            </div>

            {purchase.accessCode && (
              <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 text-center mb-3">
                <p className="text-xs text-foreground/50 mb-1">Access Code</p>
                <p className="font-mono text-sm font-bold text-accent tracking-wider break-all">{purchase.accessCode}</p>
              </div>
            )}

            {/* QR Code button + Invoice download */}
            {purchase.orderId && (
              <div className="space-y-2">
                <QRButton
                  orderId={purchase.orderId}
                  itemType="class"
                  itemId={purchase.classId}
                  title={purchase.classItem?.title || "Class"}
                />
                <InvoiceDownloadButton orderId={purchase.orderId} />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────
function OrdersTab() {
  const { data: orders, isLoading } = trpc.payments.getUserOrders.useQuery();
  const { data: eventTickets } = trpc.payments.getUserTickets.useQuery();
  const { data: classPurchases } = trpc.payments.getUserClasses.useQuery();

  if (isLoading) return <LoadingState />;

  if (!orders || orders.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="h-10 w-10 text-foreground/30" />}
        gradientFrom="from-foreground/10"
        gradientTo="to-foreground/5"
        title="No Orders Yet"
        description="Your purchases will appear here with all details."
        linkHref="/events"
        linkText="Browse Events"
        linkIcon={<ArrowRight className="h-4 w-4 mr-2" />}
      />
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order: any) => {
        const relatedTicket = eventTickets?.find((t: any) => t.orderId === order.id);
        const relatedClass = classPurchases?.find((c: any) => c.orderId === order.id);
        const typeLabel = order.itemType === "event" ? "Event Ticket" : order.itemType === "course" ? "Online Course" : "Class";
        const typeIcon = order.itemType === "event" ? <Ticket className="h-5 w-5 text-accent" /> :
          order.itemType === "course" ? <BookOpen className="h-5 w-5 text-accent" /> :
            <Users className="h-5 w-5 text-accent" />;

        return (
          <Card key={order.id} className="overflow-hidden hover:border-accent/30 transition-colors">
            <CardContent className="p-0">
              {/* Item header with image */}
              <div className="flex gap-4 p-4">
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-accent/10 flex-shrink-0">
                  {order.itemImageUrl ? (
                    <img src={order.itemImageUrl} alt={order.itemTitle || ""} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">{typeIcon}</div>
                  )}
                </div>

                {/* Title and meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-foreground/50 mb-0.5">{typeLabel}</p>
                      <p className="font-bold text-base leading-tight truncate">
                        {order.itemTitle || `${typeLabel} #${order.itemId}`}
                      </p>
                      {order.itemDate && (
                        <p className="text-xs text-foreground/50 mt-1">
                          📅 {new Date(order.itemDate).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-lg text-accent">£{parseFloat(String(order.amount)).toFixed(2)}</p>
                      <Badge variant={order.status === "completed" ? "default" : "secondary"} className="text-xs mt-1">
                        {order.status === "completed" ? "✓ Paid" : order.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-foreground/40 mt-1">
                    Purchased {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>

              {/* Ticket / Access code + QR */}
              {(relatedTicket || relatedClass) && (
                <div className="mx-4 mb-3 bg-foreground/5 border border-border/50 rounded-xl p-3">
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    {relatedTicket && (
                      <>
                        <div>
                          <p className="text-xs text-foreground/50 mb-1">Ticket Code</p>
                          <p className="font-mono text-xs bg-background px-2 py-1 rounded border border-border/50 break-all">{relatedTicket.ticketCode}</p>
                        </div>
                        <div>
                          <p className="text-xs text-foreground/50 mb-1">Status</p>
                          <Badge variant="outline" className="text-xs">{relatedTicket.status}</Badge>
                        </div>
                      </>
                    )}
                    {relatedClass && (
                      <>
                        <div>
                          <p className="text-xs text-foreground/50 mb-1">Access Code</p>
                          <p className="font-mono text-xs bg-background px-2 py-1 rounded border border-border/50 break-all">{relatedClass.accessCode}</p>
                        </div>
                        <div>
                          <p className="text-xs text-foreground/50 mb-1">Status</p>
                          <Badge variant="outline" className="text-xs">{relatedClass.status}</Badge>
                        </div>
                      </>
                    )}
                  </div>

                  {/* QR Code button for events and classes */}
                  {order.itemType !== "course" && (
                    <QRButton
                      orderId={order.id}
                      itemType={order.itemType as "event" | "class"}
                      itemId={order.itemId}
                      title={order.itemTitle || typeLabel}
                    />
                  )}
                </div>
              )}

              {/* View link + Invoice download */}
              <div className="px-4 pb-4 flex gap-2">
                {order.itemSlug && (
                  <Link href={order.itemSlug} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs h-8">
                      View {typeLabel} →
                    </Button>
                  </Link>
                )}
                {order.status === "completed" && (
                  <InvoiceDownloadButton orderId={order.id} />
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Subscriptions Tab ────────────────────────────────────────────────────────
function SubscriptionsTab() {
  const { user } = useAuth();
  const { data: subscription } = trpc.subscriptions.getMySubscription.useQuery();
  const isCreator = user?.role === "instructor" || user?.role === "promoter" || user?.role === "admin";

  if (!subscription) {
    // Regular users who just buy tickets — explain what subscriptions are for
    if (!isCreator) {
      return (
        <EmptyState
          icon={<Sparkles className="h-10 w-10 text-accent/60" />}
          gradientFrom="from-accent/10"
          gradientTo="to-accent/5"
          title="Subscriptions are for creators"
          description="Are you a dance instructor, promoter or academy? Subscribe to get your own profile, publish events and classes, and start selling tickets on UK Sabor."
          linkHref="/pricing"
          linkText="Learn More"
          linkIcon={<ArrowRight className="h-4 w-4 mr-2" />}
        />
      );
    }
    return (
      <EmptyState
        icon={<Sparkles className="h-10 w-10 text-accent/60" />}
        gradientFrom="from-accent/10"
        gradientTo="to-accent/5"
        title="No Active Subscription"
        description="Upgrade to unlock premium features and create more content."
        linkHref="/pricing"
        linkText="View Plans"
        linkIcon={<ArrowRight className="h-4 w-4 mr-2" />}
      />
    );
  }

  const planBadgeColor = subscription.plan.key === "creator" ? "bg-blue-500/20 text-blue-400" :
    subscription.plan.key === "promoter_plan" ? "bg-purple-500/20 text-purple-400" :
      subscription.plan.key === "academy" ? "bg-pink-500/20 text-pink-400" :
        "bg-gray-500/20 text-gray-400";

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-accent/20 bg-gradient-to-br from-accent/5 to-background">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="h-6 w-6 text-accent" />
                <h3 className="text-2xl font-bold">{subscription.plan.name} Plan</h3>
              </div>
              <p className="text-foreground/60 mb-4">{subscription.plan.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs text-foreground/50 mb-1">Billing</p>
                  <p className="font-semibold">£{subscription.plan.priceGBP}/month</p>
                </div>
                {subscription.subscription?.currentPeriodEnd && (
                  <div>
                    <p className="text-xs text-foreground/50 mb-1">Renews</p>
                    <p className="font-semibold">{new Date(subscription.subscription.currentPeriodEnd).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground/80">Features:</p>
                <ul className="space-y-1">
                  {subscription.plan.features?.map((feature: string, i: number) => (
                    <li key={i} className="text-sm text-foreground/70 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <Badge className={`${planBadgeColor} shrink-0`}>{subscription.plan.key}</Badge>
          </div>

          <div className="flex gap-2 mt-6 pt-6 border-t border-border/50">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/billing">Manage Subscription</Link>
            </Button>
            <Button asChild className="flex-1 btn-vibrant">
              <Link href="/pricing">Upgrade Plan</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
    </div>
  );
}

function EmptyState({ icon, gradientFrom, gradientTo, title, description, linkHref, linkText, linkIcon }: {
  icon: React.ReactNode;
  gradientFrom: string;
  gradientTo: string;
  title: string;
  description: string;
  linkHref: string;
  linkText: string;
  linkIcon: React.ReactNode;
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="pt-16 pb-16">
        <div className="text-center space-y-6">
          <div className="relative mx-auto w-24 h-24">
            <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-full animate-pulse`} />
            <div className="absolute inset-2 bg-card rounded-full flex items-center justify-center">
              {icon}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
            <p className="text-foreground/60 max-w-md mx-auto">{description}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="btn-vibrant">
              <a href={linkHref}>
                {linkIcon}
                {linkText}
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
