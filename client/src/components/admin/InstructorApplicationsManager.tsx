import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Mail,
  Phone,
  Instagram,
  Globe,
  Calendar,
  Music,
  GraduationCap,
  Trash2,
  Loader2,
  FileText,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

type ApplicationStatus = "pending" | "approved" | "rejected" | "all";

export default function InstructorApplicationsManager() {
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus>("pending");
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");
  const [adminNotes, setAdminNotes] = useState("");
  const [createProfile, setCreateProfile] = useState(true);

  // Fetch applications
  const {
    data: applications,
    isLoading,
    refetch,
  } = trpc.admin.listInstructorApplications.useQuery({
    status: statusFilter,
  });

  // Mutations
  const approveApplication = trpc.admin.approveInstructorApplication.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
      setShowReviewDialog(false);
      setSelectedApplication(null);
      setAdminNotes("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const rejectApplication = trpc.admin.rejectInstructorApplication.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
      setShowReviewDialog(false);
      setSelectedApplication(null);
      setAdminNotes("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteApplication = trpc.admin.deleteInstructorApplication.useMutation({
    onSuccess: () => {
      toast.success("Solicitud eliminada");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleReview = (application: any, action: "approve" | "reject") => {
    setSelectedApplication(application);
    setReviewAction(action);
    setAdminNotes("");
    setShowReviewDialog(true);
  };

  const handleSubmitReview = () => {
    if (!selectedApplication) return;

    if (reviewAction === "approve") {
      approveApplication.mutate({
        applicationId: selectedApplication.id,
        adminNotes: adminNotes || undefined,
        createInstructorProfile: createProfile,
      });
    } else {
      if (!adminNotes.trim()) {
        toast.error("Debes proporcionar una razón para el rechazo");
        return;
      }
      rejectApplication.mutate({
        applicationId: selectedApplication.id,
        adminNotes: adminNotes,
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Estás seguro de eliminar esta solicitud?")) {
      deleteApplication.mutate({ applicationId: id });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-amber-600 border-amber-300">
            <Clock className="w-3 h-3" />
            Pendiente
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-green-600 border-green-300">
            <CheckCircle2 className="w-3 h-3" />
            Aprobado
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-red-600 border-red-300">
            <XCircle className="w-3 h-3" />
            Rechazado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = applications?.filter((app) => app.status === "pending").length || 0;
  const approvedCount = applications?.filter((app) => app.status === "approved").length || 0;
  const rejectedCount = applications?.filter((app) => app.status === "rejected").length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-3xl">{applications?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setStatusFilter("pending")}
        >
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Pendientes
            </CardDescription>
            <CardTitle className="text-3xl text-amber-600">{pendingCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setStatusFilter("approved")}
        >
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Aprobados
            </CardDescription>
            <CardTitle className="text-3xl text-green-600">{approvedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setStatusFilter("rejected")}
        >
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              Rechazados
            </CardDescription>
            <CardTitle className="text-3xl text-red-600">{rejectedCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={(val) => setStatusFilter(val as ApplicationStatus)}>
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="pending">
            Pendientes {pendingCount > 0 && `(${pendingCount})`}
          </TabsTrigger>
          <TabsTrigger value="approved">Aprobadas</TabsTrigger>
          <TabsTrigger value="rejected">Rechazadas</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Applications List */}
      <div className="space-y-4">
        {applications && applications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No hay solicitudes {statusFilter !== "all" ? statusFilter : ""}</p>
            </CardContent>
          </Card>
        ) : (
          applications?.map((application) => (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl">{application.fullName}</CardTitle>
                      {getStatusBadge(application.status)}
                      <Badge variant="secondary" className="capitalize">
                        {application.requestType}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm text-gray-500">
                      Solicitado el {new Date(application.requestedAt).toLocaleDateString("es-ES")}
                      {application.reviewedAt &&
                        ` • Revisado el ${new Date(application.reviewedAt).toLocaleDateString("es-ES")}`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {application.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-300 hover:bg-green-50"
                          onClick={() => handleReview(application, "approve")}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => handleReview(application, "reject")}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rechazar
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(application.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{application.email}</span>
                  </div>
                  {application.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{application.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Rol actual: {application.currentRole}</span>
                  </div>
                </div>

                {/* Social Links */}
                {(application.instagramHandle || application.websiteUrl) && (
                  <div className="flex gap-4 text-sm">
                    {application.instagramHandle && (
                      <a
                        href={`https://instagram.com/${application.instagramHandle.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-purple-600 hover:underline"
                      >
                        <Instagram className="w-4 h-4" />
                        {application.instagramHandle}
                      </a>
                    )}
                    {application.websiteUrl && (
                      <a
                        href={application.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:underline"
                      >
                        <Globe className="w-4 h-4" />
                        Sitio Web
                      </a>
                    )}
                  </div>
                )}

                {/* Interested In */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Interesado en publicar:</p>
                  <div className="flex flex-wrap gap-2">
                    {application.interestedInEvents && (
                      <Badge variant="secondary">
                        <Calendar className="w-3 h-3 mr-1" />
                        Eventos
                      </Badge>
                    )}
                    {application.interestedInClasses && (
                      <Badge variant="secondary">
                        <Music className="w-3 h-3 mr-1" />
                        Clases
                      </Badge>
                    )}
                    {application.interestedInCourses && (
                      <Badge variant="secondary">
                        <GraduationCap className="w-3 h-3 mr-1" />
                        Cursos
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Specialties */}
                {application.specialtiesArray && application.specialtiesArray.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Especialidades:</p>
                    <div className="flex flex-wrap gap-2">
                      {application.specialtiesArray.map((specialty: string, idx: number) => (
                        <Badge key={idx} variant="outline">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bio */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Biografía:</p>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{application.bio}</p>
                </div>

                {/* Experience */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Experiencia:</p>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{application.experience}</p>
                </div>

                {/* Admin Notes */}
                {application.adminNotes && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Notas del Administrador:</strong>
                      <p className="mt-1">{application.adminNotes}</p>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "Aprobar Solicitud" : "Rechazar Solicitud"}
            </DialogTitle>
            <DialogDescription>
              {selectedApplication &&
                `${selectedApplication.fullName} - ${selectedApplication.requestType}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {reviewAction === "approve" && selectedApplication?.requestType === "instructor" && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="createProfile"
                  checked={createProfile}
                  onChange={(e) => setCreateProfile(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <Label htmlFor="createProfile" className="cursor-pointer">
                  Crear perfil de instructor automáticamente
                </Label>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="adminNotes">
                Notas {reviewAction === "reject" ? "(Requerido)" : "(Opcional)"}
              </Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={
                  reviewAction === "approve"
                    ? "Notas adicionales sobre la aprobación..."
                    : "Explica la razón del rechazo..."
                }
                rows={4}
              />
            </div>

            {reviewAction === "approve" && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  El usuario obtendrá el rol de{" "}
                  <strong className="capitalize">{selectedApplication?.requestType}</strong> y podrá empezar
                  a publicar contenido.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={approveApplication.isPending || rejectApplication.isPending}
              className={
                reviewAction === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {(approveApplication.isPending || rejectApplication.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {reviewAction === "approve" ? "Aprobar" : "Rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
