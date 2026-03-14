import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  ArrowLeft,
  Plus,
  Mail,
  QrCode,
  Eye,
  EyeOff,
  Download,
  Loader2,
  Image as ImageIcon
} from "lucide-react";
import { useTranslations } from "@/lib/i18n";

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
  const utils = trpc.useUtils();

  // Estado para eventos
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);

  // Mutations
  const updateMutation = trpc.admin.updateEvent.useMutation({
    onSuccess: () => {
      toast.success("✅ Evento actualizado exitosamente");
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
      toast.success("🗑️ Evento eliminado exitosamente");
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

  // Handlers
  const handleCreateEvent = () => {
    setEditingEvent(null);
    setShowEventDialog(true);
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    setShowEventDialog(true);
  };

  const handleDeleteEvent = (eventId: number) => {
    if (confirmDeleteId === eventId) {
      deleteMutation.mutate({ id: eventId });
    } else {
      setConfirmDeleteId(eventId);
    }
  };

  const handleTogglePublish = (event: any) => {
    const newStatus = event.status === "published" ? "draft" : "published";
    updateMutation.mutate({
      id: event.id,
      status: newStatus,
    });
  };

  const handleDownloadQR = (event: any) => {
    if (!eventQRCodes?.qrCodeUrl) return;
    const link = document.createElement("a");
    link.href = eventQRCodes.qrCodeUrl;
    link.download = `qr-event-${event.id}.png`;
    link.click();
  };

  const handleToggleExpanded = (eventId: number) => {
    setExpandedEventId(expandedEventId === eventId ? null : eventId);
  };

  // Format date
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

  // Loading state
  if (isLoadingEvents) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg text-muted-foreground">Cargando eventos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Mis Eventos
          </h2>
          <p className="text-muted-foreground mt-1">
            Gestiona tus eventos y promociones
          </p>
        </div>
        <Button
          onClick={handleCreateEvent}
          size="lg"
          className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Crear Evento
        </Button>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-16 w-16 text-muted-foreground/40 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hay eventos</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Comienza creando tu primer evento para promocionar tus clases y actividades
            </p>
            <Button onClick={handleCreateEvent} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Crear Primer Evento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {events.map((event) => (
            <Card
              key={event.id}
              className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 overflow-hidden"
            >
              {/* Image Header */}
              {event.imageUrl && (
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Badge
                      variant={event.status === "published" ? "default" : "secondary"}
                      className="shadow-lg"
                    >
                      {event.status === "published" ? (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          Publicado
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3 mr-1" />
                          Borrador
                        </>
                      )}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <h3 className="text-white font-bold text-xl drop-shadow-lg">
                      {event.title}
                    </h3>
                  </div>
                </div>
              )}

              <CardContent className="p-6 space-y-4">
                {/* If no image, show title here */}
                {!event.imageUrl && (
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{event.title}</h3>
                      <Badge
                        variant={event.status === "published" ? "default" : "secondary"}
                        className="mt-2"
                      >
                        {event.status === "published" ? (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Publicado
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Borrador
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Event Details */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <Calendar className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Fecha y Hora</p>
                      <p className="text-muted-foreground capitalize">
                        {formatDate(event.eventDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Ubicación</p>
                      <p className="text-muted-foreground">
                        {event.venue}
                        {event.city && `, ${event.city}`}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">${event.ticketPrice}</p>
                        <p className="text-xs text-muted-foreground">por ticket</p>
                      </div>
                    </div>

                    {event.maxTickets && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{event.maxTickets}</p>
                          <p className="text-xs text-muted-foreground">capacidad</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 pt-2 border-t">
                      {event.description}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditEvent(event)}
                    className="flex-1"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTogglePublish(event)}
                    className="flex-1"
                  >
                    {event.status === "published" ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Despublicar
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Publicar
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleExpanded(event.id)}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    QR
                  </Button>

                  <Button
                    variant={confirmDeleteId === event.id ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => handleDeleteEvent(event.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {confirmDeleteId === event.id ? "Confirmar" : "Eliminar"}
                  </Button>
                </div>

                {/* QR Code Section (expandable) */}
                {expandedEventId === event.id && eventQRCodes && (
                  <div className="pt-4 border-t space-y-3 animate-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">Código QR del Evento</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadQR(event)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </Button>
                    </div>
                    {eventQRCodes.qrCodeUrl && (
                      <div className="flex justify-center p-4 bg-muted rounded-lg">
                        <img
                          src={eventQRCodes.qrCodeUrl}
                          alt="QR Code"
                          className="w-48 h-48 border-4 border-white shadow-lg rounded-lg"
                        />
                      </div>
                    )}
                    <p className="text-xs text-center text-muted-foreground">
                      Los participantes pueden escanear este código para ver los detalles del evento
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Event Dialog (Create/Edit) */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingEvent ? "Editar Evento" : "Crear Nuevo Evento"}
            </DialogTitle>
            <DialogDescription>
              {editingEvent
                ? "Actualiza la información del evento"
                : "Completa los detalles para crear un nuevo evento"}
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
