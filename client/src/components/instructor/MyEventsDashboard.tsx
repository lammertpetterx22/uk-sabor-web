import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import EventFormCard from "@/components/admin/EventFormCard";
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Edit2,
  Trash2,
  Plus,
  QrCode,
  Eye,
  EyeOff,
  Download,
  Loader2,
  Sparkles,
  PartyPopper
} from "lucide-react";
import { useTranslations } from "@/hooks/useTranslations";
import { Trans, useTr } from "@/components/Trans";

interface MyEventsDashboardProps {
  events: any[];
  isLoadingEvents: boolean;
  onRefresh: () => void;
  isAdmin: boolean;
}

export default function MyEventsDashboard({
  events,
  isLoadingEvents,
  onRefresh,
  isAdmin,
}: MyEventsDashboardProps) {
  const { t } = useTranslations();
  const { tr } = useTr();
  const utils = trpc.useUtils();

  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);

  // Mutations
  const updateMutation = trpc.admin.updateEvent.useMutation({
    onSuccess: () => {
      toast.success("✅ Event updated successfully");
      utils.admin.listMyEvents.invalidate();
      utils.admin.listAllEvents.invalidate();
      setEditingEvent(null);
      setShowEventDialog(false);
      onRefresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.admin.deleteEvent.useMutation({
    onSuccess: () => {
      toast.success("🗑️ Event deleted successfully");
      utils.admin.listMyEvents.invalidate();
      utils.admin.listAllEvents.invalidate();
      setConfirmDeleteId(null);
      onRefresh();
    },
    onError: (err) => toast.error(err.message),
  });

  // QR codes query
  const { data: eventQRCodes } = trpc.qrcode.getQRCode.useQuery(
    expandedEventId ? { itemType: "event", itemId: expandedEventId } : { itemType: "event", itemId: -1 },
    { enabled: expandedEventId !== null }
  );

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setShowEventDialog(true);
  };

  const handleEditEvent = (event: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEvent(event);
    setShowEventDialog(true);
  };

  const handleDeleteEvent = (eventId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDeleteId === eventId) {
      deleteMutation.mutate({ id: eventId });
    } else {
      setConfirmDeleteId(eventId);
    }
  };

  const handleTogglePublish = (event: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = event.status === "published" ? "draft" : "published";
    updateMutation.mutate({
      id: event.id,
      status: newStatus,
    });
  };

  const handleDownloadQR = (event: any) => {
    if (!eventQRCodes?.qrData) return;
    const link = document.createElement("a");
    link.href = eventQRCodes.qrData;
    link.download = `qr-event-${event.id}.png`;
    link.click();
  };

  const handleToggleExpanded = (eventId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedEventId(expandedEventId === eventId ? null : eventId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header - mismo estilo que MyCoursesDashboard */}
      <Card className="border-border/50 bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
                <Calendar className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-2xl gradient-text"><Trans>My Events</Trans></CardTitle>
                <CardDescription>
                  <Trans>Manage your events and promotions</Trans>
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={handleCreateEvent}
              className="btn-vibrant"
            >
              <Plus className="h-4 w-4 mr-2" />
              <Trans>Create Event</Trans>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Events Grid - mismo estilo que MyCoursesDashboard */}
      {isLoadingEvents ? (
        <div className="flex justify-center py-16">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-accent mx-auto mb-4" />
            <p className="text-foreground/60">{tr("Loading events...")}</p>
          </div>
        </div>
      ) : events && events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card
              key={event.id}
              className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-accent/50 transition-all cursor-pointer group overflow-hidden"
              onClick={() => handleToggleExpanded(event.id, {} as React.MouseEvent)}
            >
              {/* Event Image */}
              {event.imageUrl && (
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <Badge className="bg-black/50 backdrop-blur-sm border-0 text-white">
                      {event.status === "published" ? (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          Published
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3 mr-1" />
                          Draft
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              )}



              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg text-foreground line-clamp-2 group-hover:text-accent transition-colors">
                    {event.title}
                  </h3>
                  {event.description && (
                    <p className="text-sm text-foreground/60 mt-1 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                </div>

                {!event.imageUrl && (
                  <Badge className="bg-black/10 backdrop-blur-sm">
                    {event.status === "published" ? (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        Publicado
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        Draft
                      </>
                    )}
                  </Badge>
                )}

                <Separator className="bg-border/50" />

                {/* Event Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-foreground/80">
                    <Calendar className="h-4 w-4 text-accent flex-shrink-0" />
                    <span className="text-xs capitalize line-clamp-1">
                      {formatDate(event.eventDate)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-foreground/80">
                    <MapPin className="h-4 w-4 text-accent flex-shrink-0" />
                    <span className="text-xs line-clamp-1">
                      {event.venue}{event.city && `, ${event.city}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-foreground/80">
                      <DollarSign className="h-4 w-4 text-accent" />
                      <span className="text-xs font-medium">${event.ticketPrice}</span>
                    </div>
                    {event.maxTickets && (
                      <div className="flex items-center gap-2 text-foreground/80">
                        <Users className="h-4 w-4 text-accent" />
                        <span className="text-xs">{event.maxTickets}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="bg-border/50" />

                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleEditEvent(event, e)}
                    className="flex-1 text-xs"
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleTogglePublish(event, e)}
                    className="flex-1 text-xs"
                  >
                    {event.status === "published" ? (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        Publish
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleToggleExpanded(event.id, e)}
                    className="flex-1 text-xs"
                  >
                    <QrCode className="h-3 w-3 mr-1" />
                    {expandedEventId === event.id ? "Hide QR" : "View QR"}
                  </Button>
                  <Button
                    variant={confirmDeleteId === event.id ? "destructive" : "outline"}
                    size="sm"
                    onClick={(e) => handleDeleteEvent(event.id, e)}
                    className="text-xs"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    {confirmDeleteId === event.id ? "Confirm" : "Delete"}
                  </Button>
                </div>

                {/* QR Code Section (expandable) */}
                {expandedEventId === event.id && eventQRCodes && (
                  <div className="pt-3 border-t space-y-3 animate-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-xs">QR Code</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadQR(event);
                        }}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                    {eventQRCodes.qrData && (
                      <div className="flex justify-center p-4 bg-muted rounded-lg">
                        <img
                          src={eventQRCodes.qrData}
                          alt="QR Code"
                          className="w-32 h-32 border-2 border-white shadow-lg rounded"
                        />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-2 border-dashed border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-accent/10 mb-4">
              <PartyPopper className="h-12 w-12 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No events yet</h3>
            <p className="text-foreground/60 mb-6 max-w-sm">
              Start by creating your first event to promote your activities
            </p>
            <Button onClick={handleCreateEvent} className="btn-vibrant">
              <Plus className="h-4 w-4 mr-2" />
              Create First Event
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Event Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="!top-0 !left-0 !translate-x-0 !translate-y-0 !w-screen !h-[100dvh] !max-w-none !max-h-none !rounded-none !border-0 overflow-y-auto overflow-x-hidden p-0">
          <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-10 md:py-12">
            <DialogHeader className="mb-8">
              <DialogTitle className="text-3xl font-bold">
                {editingEvent ? "Edit Event" : "Create New Event"}
              </DialogTitle>
              <DialogDescription>
                {editingEvent
                  ? "Update event information"
                  : "Complete the details to create a new event"}
              </DialogDescription>
            </DialogHeader>
            <EventFormCard
              editingEvent={editingEvent}
              onSuccess={() => {
                setShowEventDialog(false);
                setEditingEvent(null);
                onRefresh();
              }}
              checkEventEntitlement={async () => ({ data: { allowed: true } })}
              onUpgradeRequired={() => {
                toast.error("Plan limit reached");
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
