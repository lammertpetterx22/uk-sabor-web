import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import ClassFormCard from "@/components/admin/ClassFormCard";
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
  Clock,
  Music,
  Award,
  PartyPopper
} from "lucide-react";
import { useTranslations } from "@/hooks/useTranslations";

interface MyClassesDashboardProps {
  classes: any[];
  isLoadingClasses: boolean;
  onRefresh: () => void;
  isAdmin: boolean;
  instructors: any[];
  myInstructorProfile?: any;
}

export default function MyClassesDashboard({
  classes,
  isLoadingClasses,
  onRefresh,
  isAdmin,
  instructors,
  myInstructorProfile,
}: MyClassesDashboardProps) {
  const { t } = useTranslations();
  const utils = trpc.useUtils();

  // Estado para clases
  const [showClassDialog, setShowClassDialog] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [expandedClassId, setExpandedClassId] = useState<number | null>(null);

  // Mutations
  const updateMutation = trpc.classes.update.useMutation({
    onSuccess: () => {
      toast.success("✅ Clase actualizada exitosamente");
      utils.classes.listAll.invalidate();
      utils.admin.listMyClasses.invalidate();
      setEditingClass(null);
      setShowClassDialog(false);
      onRefresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.classes.delete.useMutation({
    onSuccess: () => {
      toast.success("🗑️ Clase eliminada exitosamente");
      utils.classes.listAll.invalidate();
      utils.admin.listMyClasses.invalidate();
      setConfirmDeleteId(null);
      onRefresh();
    },
    onError: (err) => toast.error(err.message),
  });

  // QR codes query
  const { data: classQRCodes } = trpc.qrcode.getQRCode.useQuery(
    expandedClassId ? { itemType: "class", itemId: expandedClassId } : { itemType: "class", itemId: -1 },
    { enabled: expandedClassId !== null }
  );

  // Handlers
  const handleCreateClass = () => {
    setEditingClass(null);
    setShowClassDialog(true);
  };

  const handleEditClass = (cls: any) => {
    setEditingClass(cls);
    setShowClassDialog(true);
  };

  const handleDeleteClass = (classId: number) => {
    if (confirmDeleteId === classId) {
      deleteMutation.mutate({ id: classId });
    } else {
      setConfirmDeleteId(classId);
    }
  };

  const handleTogglePublish = (cls: any) => {
    const newStatus = cls.status === "published" ? "draft" : "published";
    updateMutation.mutate({
      id: cls.id,
      status: newStatus,
    });
  };

  const handleDownloadQR = (cls: any) => {
    if (!classQRCodes?.qrCodeUrl) return;
    const link = document.createElement("a");
    link.href = classQRCodes.qrCodeUrl;
    link.download = `qr-class-${cls.id}.png`;
    link.click();
  };

  const handleToggleExpanded = (classId: number) => {
    setExpandedClassId(expandedClassId === classId ? null : classId);
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

  // Get level badge color
  const getLevelColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-green-500/10 text-green-500 border-green-500/30";
      case "intermediate":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
      case "advanced":
        return "bg-red-500/10 text-red-500 border-red-500/30";
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/30";
    }
  };

  // Get level label
  const getLevelLabel = (level: string) => {
    switch (level) {
      case "beginner":
        return "Principiante";
      case "intermediate":
        return "Intermedio";
      case "advanced":
        return "Avanzado";
      default:
        return "Todos los Niveles";
    }
  };

  // Loading state
  if (isLoadingClasses) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg text-muted-foreground">Cargando clases...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Mis Clases
          </h2>
          <p className="text-muted-foreground mt-1">
            Gestiona tus clases y horarios
          </p>
        </div>
        <Button
          onClick={handleCreateClass}
          size="lg"
          className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Crear Clase
        </Button>
      </div>

      {/* Classes Grid */}
      {classes.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-16 w-16 text-muted-foreground/40 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hay clases</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Comienza creando tu primera clase para ofrecer tus enseñanzas
            </p>
            <Button onClick={handleCreateClass} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Crear Primera Clase
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {classes.map((cls) => (
            <Card
              key={cls.id}
              className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 overflow-hidden"
            >
              {/* Image Header */}
              {cls.imageUrl && (
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={cls.imageUrl}
                    alt={cls.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Badge
                      variant={cls.status === "published" ? "default" : "secondary"}
                      className="shadow-lg"
                    >
                      {cls.status === "published" ? (
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
                      {cls.title}
                    </h3>
                  </div>
                </div>
              )}

              <CardContent className="p-6 space-y-4">
                {/* If no image, show title here */}
                {!cls.imageUrl && (
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{cls.title}</h3>
                      <Badge
                        variant={cls.status === "published" ? "default" : "secondary"}
                        className="mt-2"
                      >
                        {cls.status === "published" ? (
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

                {/* Class Details */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <Calendar className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Fecha y Hora</p>
                      <p className="text-muted-foreground capitalize">
                        {formatDate(cls.classDate)}
                      </p>
                    </div>
                  </div>

                  {/* Dance Style and Level */}
                  <div className="flex flex-wrap gap-2">
                    {cls.danceStyle && (
                      <Badge variant="outline" className="border-primary/30">
                        <Music className="h-3 w-3 mr-1" />
                        {cls.danceStyle}
                      </Badge>
                    )}
                    <Badge variant="outline" className={getLevelColor(cls.level)}>
                      <Award className="h-3 w-3 mr-1" />
                      {getLevelLabel(cls.level)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">${cls.price}</p>
                        <p className="text-xs text-muted-foreground">por clase</p>
                      </div>
                    </div>

                    {cls.duration && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{cls.duration} min</p>
                          <p className="text-xs text-muted-foreground">duración</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {cls.maxParticipants && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{cls.maxParticipants} participantes</p>
                        <p className="text-xs text-muted-foreground">capacidad máxima</p>
                      </div>
                    </div>
                  )}

                  {/* Social Dancing Badge */}
                  {cls.hasSocial && (
                    <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-500 border-purple-500/30">
                      <PartyPopper className="h-3 w-3 mr-1" />
                      Incluye Social Dancing
                    </Badge>
                  )}

                  {cls.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 pt-2 border-t">
                      {cls.description}
                    </p>
                  )}

                  {/* Instructor Info */}
                  {cls.instructor && (
                    <div className="flex items-center gap-2 pt-2 border-t text-sm">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                        <span className="font-semibold text-primary">
                          {cls.instructor.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{cls.instructor.name}</p>
                        <p className="text-xs text-muted-foreground">Instructor</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClass(cls)}
                    className="flex-1"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTogglePublish(cls)}
                    className="flex-1"
                  >
                    {cls.status === "published" ? (
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
                    onClick={() => handleToggleExpanded(cls.id)}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    QR
                  </Button>

                  <Button
                    variant={confirmDeleteId === cls.id ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => handleDeleteClass(cls.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {confirmDeleteId === cls.id ? "Confirmar" : "Eliminar"}
                  </Button>
                </div>

                {/* QR Code Section (expandable) */}
                {expandedClassId === cls.id && classQRCodes && (
                  <div className="pt-4 border-t space-y-3 animate-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">Código QR de la Clase</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadQR(cls)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </Button>
                    </div>
                    {classQRCodes.qrCodeUrl && (
                      <div className="flex justify-center p-4 bg-muted rounded-lg">
                        <img
                          src={classQRCodes.qrCodeUrl}
                          alt="QR Code"
                          className="w-48 h-48 border-4 border-white shadow-lg rounded-lg"
                        />
                      </div>
                    )}
                    <p className="text-xs text-center text-muted-foreground">
                      Los participantes pueden escanear este código para ver los detalles de la clase
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Class Dialog (Create/Edit) */}
      <Dialog open={showClassDialog} onOpenChange={setShowClassDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingClass ? "Editar Clase" : "Crear Nueva Clase"}
            </DialogTitle>
            <DialogDescription>
              {editingClass
                ? "Actualiza la información de la clase"
                : "Completa los detalles para crear una nueva clase"}
            </DialogDescription>
          </DialogHeader>
          <ClassFormCard
            editingClass={editingClass}
            instructors={instructors}
            myInstructorProfile={myInstructorProfile}
            isAdmin={isAdmin}
            onSuccess={() => {
              setShowClassDialog(false);
              setEditingClass(null);
              onRefresh();
            }}
            checkClassEntitlement={async () => ({ data: { allowed: true } })}
            onUpgradeRequired={() => {
              toast.error("Plan limit reached");
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
