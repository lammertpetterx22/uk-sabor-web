import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Edit2, Trash2, AlertCircle, Upload, X, Image as ImageIcon, Video, Users, QrCode, Mail, Calendar, LayoutTemplate, Eye, Send, Settings, RefreshCw, CheckCircle, Copy, ExternalLink, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useLocation, Link } from "wouter";
import ImageCropperModal from "@/components/ImageCropperModal";
import InstagramCropSelector from "@/components/InstagramCropSelector";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import UpgradePlanDialog from "@/components/UpgradePlanDialog";
import DashboardOverview from "@/components/admin/DashboardOverview";
import AdminRrpSection from "@/components/admin/AdminRrpSection";
import QuickActions from "@/components/admin/QuickActions";
import InstructorOverview from "@/components/instructor/InstructorOverview";
import LessonsManager from "@/components/admin/LessonsManager";
import MyCoursesDashboard from "@/components/instructor/MyCoursesDashboard";
import MyEventsDashboard from "@/components/instructor/MyEventsDashboard";
import MyClassesDashboard from "@/components/instructor/MyClassesDashboard";
import InstructorApplicationsManager from "@/components/admin/InstructorApplicationsManager";
import { useTranslations } from "@/hooks/useTranslations";
import { logger } from "@/lib/logger";

export default function AdminDashboard() {
  const { t } = useTranslations();
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const isAdmin = user?.role === "admin";
  const isInstructor = user?.role === "instructor";
  const isPromoter = user?.role === "promoter";
  const isCreator = isInstructor || isPromoter; // instructors and promoters share creator access
  const canManageCourses = isAdmin || isInstructor; // courses: instructors and admins only
  const [activeTab, setActiveTab] = useState("overview"); // All roles start at overview

  // Fetch courses for LessonsManager and MyCoursesDashboard (only if user can manage courses)
  const coursesQuery = canManageCourses && isAdmin
    ? trpc.courses.listAll.useQuery({ limit: 100, offset: 0 })
    : canManageCourses
    ? trpc.admin.listMyCourses.useQuery()
    : { data: undefined, isLoading: false };

  const courses = coursesQuery.data;
  const isLoadingCourses = coursesQuery.isLoading || false;

  // Fetch instructors and instructor profile for course creation
  const { data: instructors } = trpc.instructors.list.useQuery();
  const { data: myInstructorProfile } = trpc.instructors.getMyProfile.useQuery(undefined, {
    enabled: isInstructor,
  });

  // Fetch events and classes for instructor/promoter panels
  const eventsQuery = isAdmin
    ? trpc.admin.listAllEvents.useQuery()
    : (isCreator ? trpc.admin.listMyEvents.useQuery() : { data: undefined, isLoading: false });

  const classesQuery = isAdmin
    ? trpc.classes.listAll.useQuery({ limit: 100, offset: 0 })
    : (isCreator ? trpc.admin.listMyClasses.useQuery() : { data: undefined, isLoading: false });

  const events = eventsQuery.data || [];
  const isLoadingEvents = eventsQuery.isLoading || false;
  const classes = classesQuery.data || [];
  const isLoadingClasses = classesQuery.isLoading || false;

  // Redirect unauthenticated users in an effect (not in render body)
  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) setLocation("/login");
  }, [loading, isAuthenticated, setLocation]);

  // Show spinner while auth is resolving
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
          <p className="text-foreground/50 text-sm">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Only admin, instructor, and promoter can access
  if (!isAdmin && !isInstructor && !isPromoter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="text-destructive" />
              {t("messages.accessDenied")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/80">{t("messages.noPermission")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Modern Header */}
      <div className="border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-40 shadow-lg">
        <div className="container h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-accent/20 to-purple-500/20 flex items-center justify-center border border-accent/30">
              <Settings className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {isAdmin ? "Panel de Administración" : isPromoter ? t("dashboard.promoterPanel") : t("dashboard.instructorPanel")}
              </h1>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? "Gestión completa del sistema" : "Gestiona tu contenido"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/attendance" target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="btn-vibrant gap-2 shadow-lg">
                <QrCode className="h-4 w-4" />
                <span className="hidden sm:inline">Escanear QR</span>
              </Button>
            </a>
            <div className="flex flex-col items-end gap-1">
              <Badge className={isAdmin ? "bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-400 border-red-500/50" : isPromoter ? "bg-accent/20 text-accent border-accent/50" : "bg-purple-500/20 text-purple-400 border-purple-500/50"}>
                {isAdmin ? "Administrador" : isPromoter ? t("roles.promoter") : t("roles.instructor")}
              </Badge>
              <span className="text-xs text-foreground/60">{user?.name || user?.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {isAdmin ? (
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2 mb-8 h-auto p-2 bg-card/50 backdrop-blur-sm border border-border/50">
              <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-accent/20 data-[state=active]:to-purple-500/20 data-[state=active]:border-accent/50">
                <LayoutTemplate className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Inicio</span>
              </TabsTrigger>
              <TabsTrigger value="content" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500/20 data-[state=active]:to-cyan-500/20 data-[state=active]:border-blue-500/50">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Contenido</span>
              </TabsTrigger>
              <TabsTrigger value="my-courses" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:border-purple-500/50">
                <Video className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Cursos</span>
              </TabsTrigger>
              <TabsTrigger value="management" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-500/20 data-[state=active]:to-emerald-500/20 data-[state=active]:border-green-500/50">
                <Users className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Gestión</span>
              </TabsTrigger>
              <TabsTrigger value="applications" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500/20 data-[state=active]:to-yellow-500/20 data-[state=active]:border-amber-500/50">
                <UserPlus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Solicitudes</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-pink-500/20 data-[state=active]:to-rose-500/20 data-[state=active]:border-pink-500/50">
                <Mail className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Órdenes</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-gray-500/20 data-[state=active]:to-slate-500/20 data-[state=active]:border-gray-500/50">
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Ajustes</span>
              </TabsTrigger>
            </TabsList>
          ) : isInstructor ? (
            // Instructors: Overview + Events + Classes + My Courses (unified) + Profile
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2 mb-8 h-auto p-2 bg-card/50 backdrop-blur-sm border border-border/50">
              <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-accent/20 data-[state=active]:to-purple-500/20 data-[state=active]:border-accent/50">
                <LayoutTemplate className="h-4 w-4 mr-2" />
                Inicio
              </TabsTrigger>
              <TabsTrigger value="events" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500/20 data-[state=active]:to-cyan-500/20 data-[state=active]:border-blue-500/50">
                <Calendar className="h-4 w-4 mr-2" />
                Mis Eventos
              </TabsTrigger>
              <TabsTrigger value="classes" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500/20 data-[state=active]:to-red-500/20 data-[state=active]:border-orange-500/50">
                <Users className="h-4 w-4 mr-2" />
                Mis Clases
              </TabsTrigger>
              <TabsTrigger value="my-courses" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:border-purple-500/50">
                <Video className="h-4 w-4 mr-2" />
                Mis Cursos
              </TabsTrigger>
              <TabsTrigger value="profile" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-500/20 data-[state=active]:to-emerald-500/20 data-[state=active]:border-green-500/50">
                <Users className="h-4 w-4 mr-2" />
                Mi Perfil
              </TabsTrigger>
            </TabsList>
          ) : (
            // Promoters: Overview + Events + Classes + Profile (no courses)
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 mb-8 h-auto p-2 bg-card/50 backdrop-blur-sm border border-border/50">
              <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-accent/20 data-[state=active]:to-purple-500/20 data-[state=active]:border-accent/50">
                <LayoutTemplate className="h-4 w-4 mr-2" />
                Inicio
              </TabsTrigger>
              <TabsTrigger value="events" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500/20 data-[state=active]:to-cyan-500/20 data-[state=active]:border-blue-500/50">
                <Calendar className="h-4 w-4 mr-2" />
                Mis Eventos
              </TabsTrigger>
              <TabsTrigger value="classes" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500/20 data-[state=active]:to-red-500/20 data-[state=active]:border-orange-500/50">
                <Users className="h-4 w-4 mr-2" />
                Mis Clases
              </TabsTrigger>
              <TabsTrigger value="profile" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-500/20 data-[state=active]:to-emerald-500/20 data-[state=active]:border-green-500/50">
                <Users className="h-4 w-4 mr-2" />
                Mi Perfil
              </TabsTrigger>
            </TabsList>
          )}

          {/* OVERVIEW TAB - Admin Only */}
          {isAdmin && (
            <TabsContent value="overview" className="space-y-8">
              <DashboardOverview />
              <QuickActions />
            </TabsContent>
          )}

          {/* OVERVIEW TAB - Instructor & Promoter */}
          {isCreator && (
            <TabsContent value="overview" className="space-y-8">
              <InstructorOverview onTabChange={setActiveTab} />
            </TabsContent>
          )}

          {/* EVENTS TAB - Instructor, Promoter (mantiene nombre "events") */}
          {isCreator && !isAdmin && (
            <TabsContent value="events">
              <MyEventsDashboard
                events={events}
                isLoadingEvents={isLoadingEvents}
                isAdmin={false}
                onRefresh={() => {
                  if (eventsQuery && 'refetch' in eventsQuery) {
                    (eventsQuery as any).refetch();
                  }
                }}
              />
            </TabsContent>
          )}

          {/* CLASSES TAB - Instructor, Promoter (mantiene nombre "classes") */}
          {isCreator && !isAdmin && (
            <TabsContent value="classes">
              <MyClassesDashboard
                classes={classes}
                isLoadingClasses={isLoadingClasses}
                isAdmin={false}
                instructors={instructors || []}
                myInstructorProfile={myInstructorProfile}
                onRefresh={() => {
                  if (classesQuery && 'refetch' in classesQuery) {
                    (classesQuery as any).refetch();
                  }
                }}
              />
            </TabsContent>
          )}

          {/* CONTENT TAB - Admin only (Eventos + Clases con subtabs) */}
          {isAdmin && (
            <TabsContent value="content" className="space-y-6">
              <Tabs defaultValue="events" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="events" className="data-[state=active]:bg-blue-500/20">
                    <Calendar className="h-4 w-4 mr-2" />
                    Eventos
                  </TabsTrigger>
                  <TabsTrigger value="classes" className="data-[state=active]:bg-orange-500/20">
                    <Users className="h-4 w-4 mr-2" />
                    Clases
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="events">
                  <MyEventsDashboard
                    events={events}
                    isLoadingEvents={isLoadingEvents}
                    isAdmin={true}
                    onRefresh={() => {
                      if (eventsQuery && 'refetch' in eventsQuery) {
                        (eventsQuery as any).refetch();
                      }
                    }}
                  />
                </TabsContent>

                <TabsContent value="classes">
                  <MyClassesDashboard
                    classes={classes}
                    isLoadingClasses={isLoadingClasses}
                    isAdmin={true}
                    instructors={instructors || []}
                    myInstructorProfile={myInstructorProfile}
                    onRefresh={() => {
                      if (classesQuery && 'refetch' in classesQuery) {
                        (classesQuery as any).refetch();
                      }
                    }}
                  />
                </TabsContent>
              </Tabs>
            </TabsContent>
          )}

          {/* MY COURSES TAB - Admin e Instructor (nuevo tab unificado para admin) */}
          {(isAdmin || isInstructor) && (
            <TabsContent value="my-courses">
              <MyCoursesDashboard
                courses={courses || []}
                isLoadingCourses={isLoadingCourses}
                isAdmin={isAdmin}
                instructors={instructors || []}
                myInstructorProfile={myInstructorProfile}
                onRefresh={() => {
                  if (coursesQuery && 'refetch' in coursesQuery) {
                    (coursesQuery as any).refetch();
                  }
                }}
              />
            </TabsContent>
          )}

          {/* MANAGEMENT TAB - Admin only (Instructores + Usuarios con subtabs) */}
          {isAdmin && (
            <TabsContent value="management" className="space-y-6">
              <Tabs defaultValue="instructors" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="instructors" className="data-[state=active]:bg-green-500/20">
                    <Users className="h-4 w-4 mr-2" />
                    Instructores
                  </TabsTrigger>
                  <TabsTrigger value="users" className="data-[state=active]:bg-yellow-500/20">
                    <Users className="h-4 w-4 mr-2" />
                    Usuarios
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="instructors">
                  <InstructorsTab />
                </TabsContent>

                <TabsContent value="users" className="space-y-8">
                  <AdminRrpSection />
                  <UsersTab />
                </TabsContent>
              </Tabs>
            </TabsContent>
          )}

          {/* APPLICATIONS TAB - Admin only */}
          {isAdmin && (
            <TabsContent value="applications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Solicitudes de Instructor / Promotor
                  </CardTitle>
                  <CardDescription>
                    Revisa y gestiona las solicitudes para convertirse en instructor o promotor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <InstructorApplicationsManager />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* ORDERS TAB - Admin only */}
          {isAdmin && (
            <TabsContent value="orders">
              <OrdersTab />
            </TabsContent>
          )}

          {/* SETTINGS TAB - Admin only */}
          {isAdmin && (
            <TabsContent value="settings">
              <SettingsTab />
            </TabsContent>
          )}

          {/* PROFILE TAB - Instructor and Promoter */}
          {isCreator && (
            <TabsContent value="profile">
              <InstructorProfileTab />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

// ===== EVENTS TAB =====
function EventsTab() {
  const { t } = useTranslations();
  const utils = trpc.useUtils();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { data: events, isLoading } = isAdmin
    ? trpc.admin.listAllEvents.useQuery()
    : trpc.admin.listMyEvents.useQuery();
  const invalidateEvents = () => {
    if (isAdmin) utils.admin.listAllEvents.invalidate();
    else utils.admin.listMyEvents.invalidate();
  };

  // Get list of potential collaborators (instructors/promoters/admins)
  const { data: potentialCollaborators } = trpc.admin.listUsers.useQuery();
  const collaboratorsList = potentialCollaborators?.filter(u =>
    (u.role === "instructor" || u.role === "promoter" || u.role === "admin") && u.id !== user?.id
  ) || [];

  const addCollaboratorMutation = trpc.events.addCollaborator.useMutation();

  const createMutation = trpc.admin.createEvent.useMutation({
    onSuccess: async (data) => {
      toast.success(t("admin.events.toastCreated"));
      invalidateEvents();

      // If collaborator was selected, add them after event creation
      if (formData.collaboratorId && data?.id) {
        try {
          await addCollaboratorMutation.mutateAsync({
            eventId: data.id,
            collaboratorId: parseInt(formData.collaboratorId),
            split: formData.collaboratorSplit,
          });
          toast.success("Collaborator added successfully!");
        } catch (err: any) {
          toast.error(`Event created, but failed to add collaborator: ${err.message}`);
        }
      }
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
  const updateMutation = trpc.admin.updateEvent.useMutation({
    onSuccess: () => {
      toast.success(t("admin.events.toastUpdated"));
      invalidateEvents();
      setEditingEvent(null);
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteMutation = trpc.admin.deleteEvent.useMutation({
    onSuccess: () => {
      toast.success(t("admin.events.toastDeleted"));
      invalidateEvents();
    },
    onError: (err) => toast.error(err.message),
  });
  const uploadFileMutation = trpc.uploads.uploadFile.useMutation();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    venue: "",
    city: "",
    eventDate: "",
    ticketPrice: "",
    maxTickets: "" as string,
    imageFile: null as File | null,
    imageUrl: "" as string,
    imagePreview: "" as string,
    paymentMethod: "online" as "online" | "cash" | "both",
    collaboratorId: "" as string,
    collaboratorSplit: "50/50" as "50/50" | "60/40",
  });
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);
  const [emailingEvent, setEmailingEvent] = useState<any>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailSegment, setEmailSegment] = useState("all");
  const [emailSendNow, setEmailSendNow] = useState(true);
  const [emailScheduledAt, setEmailScheduledAt] = useState("");
  const [emailPreview, setEmailPreview] = useState(false);
  const { data: emailTemplates } = trpc.emailMarketing.listTemplates.useQuery();
  // Entitlement enforcement
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");
  const [pendingResourceType, setPendingResourceType] = useState<"event" | "class" | "course">("event");
  const { refetch: checkEventEntitlement } = trpc.subscriptions.checkEntitlement.useQuery(
    { resourceType: "event" },
    { enabled: false }
  );
  const createCampaignMutation = trpc.emailMarketing.createCampaign.useMutation({
    onSuccess: (data) => {
      if (emailSendNow) {
        sendCampaignMutation.mutate({ campaignId: data.id });
      } else {
        toast.success(t("admin.events.toastCampaignScheduled"));
        setEmailingEvent(null);
        utils.emailMarketing.listCampaigns.invalidate();
      }
    },
    onError: (e) => toast.error(e.message),
  });
  const sendCampaignMutation = trpc.emailMarketing.sendCampaign.useMutation({
    onSuccess: (data) => {
      toast.success(t("admin.events.toastEmailSent", { count: data.sent }));
      setEmailingEvent(null);
      utils.emailMarketing.listCampaigns.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const { data: eventQRCodes } = trpc.qrcode.getQRCode.useQuery(
    expandedEventId ? { itemType: "event", itemId: expandedEventId } : { itemType: "event", itemId: -1 },
    { enabled: expandedEventId !== null }
  );

  const handleEditClick = (event: any) => {
    setEditingEvent(event);
    setEditForm({
      title: event.title,
      description: event.description || "",
      venue: event.venue,
      city: event.city || "",
      eventDate: event.eventDate ? new Date(event.eventDate).toISOString().slice(0, 16) : "",
      ticketPrice: event.ticketPrice?.toString() || "",
      maxTickets: event.maxTickets?.toString() || "",
      imageUrl: event.imageUrl || "",
      status: event.status,
    });
  };

  const handleSaveEdit = () => {
    if (!editingEvent) return;
    updateMutation.mutate({
      id: editingEvent.id,
      title: editForm.title,
      description: editForm.description,
      venue: editForm.venue,
      city: editForm.city,
      eventDate: editForm.eventDate,
      ticketPrice: editForm.ticketPrice,
      maxTickets: editForm.maxTickets ? parseInt(editForm.maxTickets) : undefined,
      imageUrl: editForm.imageUrl,
      status: editForm.status,
    });
  };

  const handleTogglePublish = (event: any) => {
    const newStatus = event.status === "published" ? "draft" : "published";
    updateMutation.mutate({ id: event.id, status: newStatus });
  };

  // Step 1: read file → open cropper
  const handleImageSelect = (file: File) => {
    // SECURITY & UX: Validate image file type
    if (!file.type.startsWith('image/')) {
      toast.error(t("admin.events.errorInvalidImage"));
      return;
    }

    // SECURITY: Validate file size (max 10MB for images)
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(t("admin.events.errorImageTooLarge", { size: (file.size / 1024 / 1024).toFixed(1) }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setCropSrc(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Step 2: receive cropped data URL → upload to S3
  const handleCropComplete = async (croppedDataUrl: string) => {
    setCropSrc(null);
    setFormData(prev => ({ ...prev, imagePreview: croppedDataUrl, imageUrl: "" }));
    setUploading(true);
    try {
      const result = await uploadFileMutation.mutateAsync({
        fileBase64: croppedDataUrl,
        fileName: "event-flyer.jpg",
        mimeType: "image/jpeg",
        folder: "events",
      });
      setFormData(prev => ({ ...prev, imageUrl: result.url }));
      toast.success(t("upload.imageUploadedSuccess"));
    } catch (uploadErr: any) {
      toast.error(t("admin.events.errorUpload", { message: uploadErr.message }));
      setFormData(prev => ({ ...prev, imagePreview: "", imageUrl: "" }));
    } finally {
      setUploading(false);
    }
  };

  // Legacy alias
  const handleImageUpload = handleImageSelect;

  const handleCreateEvent = async () => {
    if (!formData.title || !formData.venue || !formData.eventDate || !formData.ticketPrice) {
      toast.error(t("validation.fillRequiredFields"));
      return;
    }

    // Check entitlement before creating
    try {
      const result = await checkEventEntitlement();
      const entitlement = result.data;
      if (entitlement && !entitlement.allowed) {
        setUpgradeReason(entitlement.reason ?? t("admin.events.errorPlanLimit"));
        setUpgradeDialogOpen(true);
        return;
      }
    } catch {
      // If entitlement check fails, allow creation (fail open)
    }

    createMutation.mutate({
      title: formData.title,
      description: formData.description,
      venue: formData.venue,
      city: formData.city,
      eventDate: formData.eventDate,
      ticketPrice: formData.ticketPrice,
      maxTickets: formData.maxTickets ? parseInt(formData.maxTickets) : undefined,
      imageUrl: formData.imageUrl,
      paymentMethod: formData.paymentMethod,
    });

    setFormData({
      title: "",
      description: "",
      venue: "",
      city: "",
      eventDate: "",
      ticketPrice: "",
      maxTickets: "",
      imageFile: null,
      imageUrl: "",
      imagePreview: "",
      paymentMethod: "online",
      collaboratorId: "",
      collaboratorSplit: "50/50",
    });
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.events.createNewEvent")}</CardTitle>
          <CardDescription>{t("admin.events.createDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder={t("admin.events.eventTitle")}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <Input
              placeholder={t("admin.events.venue")}
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
            />
            <Input
              placeholder={t("admin.events.city")}
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <div className="space-y-1">
              <label className="text-xs text-foreground/60 font-medium">{t("admin.events.eventDateTime")}</label>
              <Input
                type="datetime-local"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                className="block w-full"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            <Input
              type="number"
              placeholder={t("admin.events.ticketPrice")}
              value={formData.ticketPrice}
              onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value })}
            />
            <Input
              type="number"
              placeholder={t("admin.events.maxTickets")}
              value={formData.maxTickets.toString()}
              onChange={(e) => setFormData({ ...formData, maxTickets: e.target.value })}
            />
          </div>

          <Textarea
            placeholder={t("admin.events.eventDescription")}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
          />

          {/* Image Upload */}
          <div className="border-2 border-dashed border-accent/30 rounded-lg p-6">
            {formData.imagePreview ? (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={formData.imagePreview}
                    alt={t("admin.events.flyerPreview")}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  {!formData.imageUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                      <span className="text-white ml-2">{t("admin.buttons.uploading")}</span>
                    </div>
                  )}
                  {formData.imageUrl && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                      ✓ Uploaded
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={!formData.imageUrl}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Change Image
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setFormData({ ...formData, imageFile: null, imageUrl: "", imagePreview: "" })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 text-accent/40" />
                <p className="text-foreground/60 mb-4">{t("admin.events.uploadFlyer")}</p>
                <Button
                  variant="outline"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Select Image
                    </>
                  )}
                </Button>
              </div>
            )}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleImageSelect(e.target.files[0]);
                  e.target.value = "";
                }
              }}
              className="hidden"
            />
          </div>

          {/* Image Cropper Modal for Events (16:9) */}
          <ImageCropperModal
            imageSrc={cropSrc}
            aspect={16 / 9}
            label={t("admin.events.cropImage")}
            onCropComplete={handleCropComplete}
            onClose={() => setCropSrc(null)}
          />

          {/* Payment Method Section */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground/80 mb-3">Payment Method</p>
            <Select value={formData.paymentMethod} onValueChange={(val: any) => setFormData({ ...formData, paymentMethod: val })}>
              <SelectTrigger>
                <SelectValue placeholder={t("admin.events.selectPaymentMethod")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">{t("admin.events.paymentOnline")}</SelectItem>
                <SelectItem value="cash">{t("admin.events.paymentCash")}</SelectItem>
                <SelectItem value="both">{t("admin.events.paymentBoth")}</SelectItem>
              </SelectContent>
            </Select>
            {formData.paymentMethod === "cash" && (
              <p className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded px-3 py-2">
                ⚠️ Cash only: The "Buy Ticket" button will be hidden for this event. Attendees will be told to pay at the door.
              </p>
            )}
            {formData.paymentMethod === "both" && (
              <p className="text-xs text-blue-400 bg-blue-400/10 border border-blue-400/30 rounded px-3 py-2">
                ℹ️ Both options: Attendees can pay online or at the door.
              </p>
            )}
          </div>

          {/* Collaborator Section (Optional) */}
          <div className="border-t border-border/30 pt-4 mt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" />
              <p className="text-sm font-medium text-foreground/80">Collaborator (Optional)</p>
            </div>
            <p className="text-xs text-foreground/50">Add a collaborator to share earnings from online sales. Cash payments are handled manually between you.</p>

            <Select value={formData.collaboratorId} onValueChange={(val: string) => setFormData({ ...formData, collaboratorId: val })}>
              <SelectTrigger>
                <SelectValue placeholder="No collaborator (solo event)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No collaborator</SelectItem>
                {collaboratorsList.map(collab => (
                  <SelectItem key={collab.id} value={collab.id.toString()}>
                    {collab.name || collab.email} ({collab.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {formData.collaboratorId && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground/70">Revenue Split</p>
                <Select value={formData.collaboratorSplit} onValueChange={(val: any) => setFormData({ ...formData, collaboratorSplit: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50/50">50/50 - Equal split</SelectItem>
                    <SelectItem value="60/40">60/40 - You get 60%</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-green-400 bg-green-400/10 border border-green-400/30 rounded px-3 py-2">
                  🤝 {formData.collaboratorSplit === "50/50" ? "Each of you will receive 50% of online earnings" : "You will receive 60%, collaborator gets 40% of online earnings"}
                </p>
              </div>
            )}
          </div>

          <Button
            onClick={handleCreateEvent}
            disabled={createMutation.isPending || (!!formData.imagePreview && !formData.imageUrl)}
            className="btn-vibrant w-full"
            title={formData.imagePreview && !formData.imageUrl ? t("upload.uploadingToServer") : ""}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Edit Event Modal */}
      {editingEvent && (
        <Card className="border-accent/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Edit Event: {editingEvent.title}</span>
              <Button variant="ghost" size="sm" onClick={() => setEditingEvent(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input placeholder={t("admin.events.eventTitle")} value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
              <Input placeholder={t("admin.events.venue")} value={editForm.venue} onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })} />
              <Input placeholder={t("admin.events.city")} value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
              <div className="space-y-1">
                <label className="text-xs text-foreground/60 font-medium">Event Date & Time</label>
                <Input type="datetime-local" value={editForm.eventDate} onChange={(e) => setEditForm({ ...editForm, eventDate: e.target.value })} />
              </div>
              <Input placeholder={t("admin.events.ticketPrice")} value={editForm.ticketPrice} onChange={(e) => setEditForm({ ...editForm, ticketPrice: e.target.value })} />
              <Input type="number" placeholder={t("admin.events.maxTickets")} value={editForm.maxTickets} onChange={(e) => setEditForm({ ...editForm, maxTickets: e.target.value })} />
            </div>
            <Textarea placeholder={t("common.description") || t("admin.events.eventDescription")} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} />
            <Input placeholder={t("admin.events.imageUrl")} value={editForm.imageUrl} onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })} />
            <div className="flex gap-2">
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveEdit} disabled={updateMutation.isPending} className="btn-vibrant flex-1">
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setEditingEvent(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle>All Events ({events?.length || 0})</CardTitle>
          <CardDescription>{t("admin.events.manageAllEvents")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : events && events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="border border-border/50 rounded-lg p-4">
                  <div className="flex gap-4">
                    {event.imageUrl && (
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">{event.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${event.status === 'published' ? 'bg-green-500/20 text-green-400' :
                          event.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                          {event.status}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/60">{event.venue}{event.city ? `, ${event.city}` : ''}</p>
                      <p className="text-sm text-foreground/60">{new Date(event.eventDate).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                      <p className="text-sm text-accent font-medium">£{event.ticketPrice} · {event.ticketsSold || 0} sold{event.maxTickets ? ` / ${event.maxTickets}` : ''}</p>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTogglePublish(event)}
                        disabled={updateMutation.isPending}
                        className={event.status === 'published' ? 'border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10' : 'border-green-500/50 text-green-400 hover:bg-green-500/10'}
                      >
                        {event.status === 'published' ? 'Unpublish' : 'Publish'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setEmailingEvent(event)} className="gap-2">
                        <Mail className="h-4 w-4" />
                        Send Email
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditClick(event)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {confirmDeleteId === event.id ? (
                        <div className="flex gap-1">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => { deleteMutation.mutate({ id: event.id }); setConfirmDeleteId(null); }}
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Yes'}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <Button variant="destructive" size="sm" onClick={() => setConfirmDeleteId(event.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {expandedEventId === event.id && (
                    <div className="mt-4 pt-4 border-t border-border/30">
                      <h4 className="text-sm font-semibold text-accent mb-2 flex items-center gap-2">
                        <QrCode className="h-4 w-4" />
                        Scan Attendance
                      </h4>
                      <p className="text-xs text-foreground/50 mb-3">Open the QR scanner to check in attendees. Point the camera at each attendee's personal QR code from their dashboard.</p>
                      <div className="flex gap-2 flex-wrap">
                        <a href="/attendance" target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="btn-vibrant gap-2">
                            <QrCode className="h-4 w-4" />
                            Open QR Scanner
                          </Button>
                        </a>
                        <a href="/attendance" target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="border-accent/50 text-accent hover:bg-accent/10 gap-2">
                            <Users className="h-4 w-4" />
                            View Attendees
                          </Button>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-foreground/60 text-center py-8">{t("admin.events.noEvents")}</p>
          )}
        </CardContent>
      </Card>

      {/* Email Campaign Modal */}
      {emailingEvent && (
        <Dialog open={!!emailingEvent} onOpenChange={(open) => { if (!open) { setEmailingEvent(null); setEmailSubject(""); setEmailBody(""); setEmailSegment("all"); setEmailSendNow(true); setEmailScheduledAt(""); setEmailPreview(false); } }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-accent" />{t("admin.events.emailCampaign")}</DialogTitle>
              <DialogDescription>Promote "{emailingEvent.title}" — pick a template or write custom HTML</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Template picker */}
              <div className="md:col-span-1">
                <h3 className="text-sm font-semibold text-foreground/70 mb-3 flex items-center gap-1"><LayoutTemplate className="h-4 w-4" /> Templates</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {emailTemplates?.map((tpl) => (
                    <button key={tpl.id} onClick={() => { setEmailSubject(tpl.subject); setEmailBody(tpl.htmlContent); }} className="w-full text-left p-2 rounded-lg border border-border/30 hover:border-accent/50 hover:bg-accent/5 transition-colors">
                      <p className="text-xs font-semibold truncate">{tpl.name}</p>
                      <p className="text-xs text-foreground/40 truncate">{tpl.subject}</p>
                    </button>
                  ))}
                  {(!emailTemplates || emailTemplates.length === 0) && <p className="text-xs text-foreground/40 text-center py-4">No templates — <Link href="/email-marketing" className="text-accent underline">create some</Link></p>}
                </div>
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">{t("admin.events.audience")}</label>
                    <Select value={emailSegment} onValueChange={setEmailSegment}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("admin.events.audienceAll")}</SelectItem>
                        <SelectItem value="customer">{t("admin.events.audienceCustomers")}</SelectItem>
                        <SelectItem value="vip">{t("admin.events.audienceVip")}</SelectItem>
                        <SelectItem value="lead">{t("admin.events.audienceLeads")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">{t("admin.events.send")}</label>
                    <Select value={emailSendNow ? "now" : "schedule"} onValueChange={(v) => setEmailSendNow(v === "now")}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="now">Send Immediately</SelectItem>
                        <SelectItem value="schedule">Schedule for Later</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {!emailSendNow && (
                    <div>
                      <label className="text-xs font-medium mb-1 flex items-center gap-1 block"><Calendar className="h-3 w-3" /> Date & Time</label>
                      <Input type="datetime-local" value={emailScheduledAt} onChange={(e) => setEmailScheduledAt(e.target.value)} min={new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16)} className="h-8 text-xs" />
                    </div>
                  )}
                </div>
              </div>
              {/* Compose */}
              <div className="md:col-span-2 space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">{t("admin.events.subjectLine")}</label>
                  <Input placeholder={t("admin.events.subjectPlaceholder")} value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium">{t("admin.events.emailContent")}</label>
                    <Button variant="ghost" size="sm" onClick={() => setEmailPreview(!emailPreview)} className="text-xs h-6"><Eye className="h-3 w-3 mr-1" />{emailPreview ? t("common.edit") : t("admin.events.preview")}</Button>
                  </div>
                  {emailPreview ? (
                    <div className="border border-border/50 rounded-lg overflow-hidden h-56"><iframe srcDoc={emailBody} className="w-full h-full" sandbox="allow-same-origin" title={t("admin.events.preview") || "Preview"} /></div>
                  ) : (
                    <Textarea placeholder={t("admin.events.contentPlaceholder")} value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={10} className="font-mono text-xs" />
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-border/30">
              <Button variant="outline" onClick={() => setEmailingEvent(null)}>Cancel</Button>
              <Button
                onClick={() => createCampaignMutation.mutate({ name: `${emailingEvent.title} – Campaign`, subject: emailSubject || `Join us at ${emailingEvent.title}!`, htmlContent: emailBody || `<p>Don't miss <strong>${emailingEvent.title}</strong>!</p>`, segment: emailSegment as any, scheduledAt: !emailSendNow && emailScheduledAt ? emailScheduledAt : undefined })}
                disabled={createCampaignMutation.isPending || sendCampaignMutation.isPending}
                className="btn-vibrant gap-2"
              >
                {(createCampaignMutation.isPending || sendCampaignMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : emailSendNow ? <Send className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                {emailSendNow ? t("admin.events.sendNow") : t("admin.events.schedule")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {/* Upgrade plan dialog */}
      <UpgradePlanDialog
        open={upgradeDialogOpen}
        onClose={() => setUpgradeDialogOpen(false)}
        resourceType={pendingResourceType}
        reason={upgradeReason}
      />
    </div>
  );
}

// ===== COURSES TAB =====
function CoursesTab() {
  const { t } = useTranslations();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { data: courses, isLoading, refetch } = isAdmin
    ? trpc.courses.listAll.useQuery({ limit: 100, offset: 0 })
    : trpc.admin.listMyCourses.useQuery();
  const { data: instructors } = trpc.instructors.list.useQuery();
  const { data: myInstructorProfile } = trpc.instructors.getMyProfile.useQuery(undefined, {
    enabled: !isAdmin,
  });
  const [emailingCourse, setEmailingCourse] = useState<any>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailSegment, setEmailSegment] = useState("all");
  const [emailSendNow, setEmailSendNow] = useState(true);
  const [emailScheduledAt, setEmailScheduledAt] = useState("");
  const [emailPreview, setEmailPreview] = useState(false);
  const { data: emailTemplates } = trpc.emailMarketing.listTemplates.useQuery();
  const utils = trpc.useUtils();
  // Entitlement enforcement
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");
  const { refetch: checkCourseEntitlement } = trpc.subscriptions.checkEntitlement.useQuery(
    { resourceType: "course" },
    { enabled: false }
  );
  const createCampaignMutation = trpc.emailMarketing.createCampaign.useMutation({
    onSuccess: (data) => {
      if (emailSendNow) {
        sendCampaignMutation.mutate({ campaignId: data.id });
      } else {
        toast.success(t("admin.events.toastCampaignScheduled"));
        setEmailingCourse(null);
        utils.emailMarketing.listCampaigns.invalidate();
      }
    },
    onError: (e) => toast.error(e.message),
  });
  const sendCampaignMutation = trpc.emailMarketing.sendCampaign.useMutation({
    onSuccess: (data) => {
      toast.success(t("admin.events.toastEmailSent", { count: data.sent }));
      setEmailingCourse(null);
      utils.emailMarketing.listCampaigns.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const createMutation = trpc.courses.create.useMutation({
    onSuccess: () => {
      toast.success(t("admin.courses.toastCreated"));
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
  const updateMutation = trpc.courses.update.useMutation({
    onSuccess: () => {
      toast.success(t("admin.courses.toastUpdated"));
      refetch();
      resetForm();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
  const deleteMutation = trpc.courses.delete.useMutation({
    onSuccess: () => {
      toast.success(t("admin.courses.toastDeleted"));
      refetch();
      setConfirmDeleteId(null);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
  const uploadFileMutation = trpc.uploads.uploadFile.useMutation();
  const uploadVideoMutation = trpc.uploads.uploadVideoToBunny.useMutation();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    danceStyle: "",
    level: "all-levels" as const,
    price: "",
    instructorId: "",
    duration: "",
    lessonsCount: "" as string,
    videoFile: null as File | null,
    videoUrl: "" as string,
    videoPreview: "" as string,
    bunnyVideoId: undefined as string | undefined,
    bunnyLibraryId: undefined as string | undefined,
    imageUrl: "" as string,
    imagePreview: "" as string,
  });
  const [uploading, setUploading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Auto-fill instructorId for instructor role users
  useEffect(() => {
    if (!isAdmin && myInstructorProfile && !editingId) {
      setFormData(prev => ({ ...prev, instructorId: myInstructorProfile.id.toString() }));
    }
  }, [myInstructorProfile, isAdmin, editingId]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      danceStyle: "",
      level: "all-levels",
      price: "",
      instructorId: "",
      duration: "",
      lessonsCount: "",
      videoFile: null,
      videoPreview: "",
      bunnyVideoId: undefined,
      bunnyLibraryId: undefined,
      videoUrl: "",
      imageUrl: "",
      imagePreview: "",
    });
    setEditingId(null);
    if (videoInputRef.current) videoInputRef.current.value = "";
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleEditClick = (course: any) => {
    setEditingId(course.id);
    setFormData({
      title: course.title || "",
      description: course.description || "",
      danceStyle: course.danceStyle || "",
      level: course.level || "all-levels",
      price: course.price?.toString() || "",
      instructorId: course.instructorId?.toString() || "",
      duration: course.duration || "",
      lessonsCount: course.lessonsCount?.toString() || "",
      videoFile: null,
      videoUrl: course.videoUrl || "",
      videoPreview: course.videoUrl ? "existing" : "",
      bunnyVideoId: "",
      bunnyLibraryId: "",
      imageUrl: course.imageUrl || "",
      imagePreview: course.imageUrl || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Course cover image: step 1 → open cropper
  const handleImageSelect = (file: File) => {
    // SECURITY & UX: Validate image file type
    if (!file.type.startsWith('image/')) {
      toast.error(t("admin.events.errorInvalidImage"));
      return;
    }

    // SECURITY: Validate file size (max 10MB for images)
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(t("admin.events.errorImageTooLarge", { size: (file.size / 1024 / 1024).toFixed(1) }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setCropSrc(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Course cover image: step 2 → upload to S3
  const handleCropComplete = async (croppedDataUrl: string) => {
    setCropSrc(null);
    setFormData(prev => ({ ...prev, imagePreview: croppedDataUrl, imageUrl: "" }));
    setImageUploading(true);
    try {
      const result = await uploadFileMutation.mutateAsync({
        fileBase64: croppedDataUrl,
        fileName: "course-cover.jpg",
        mimeType: "image/jpeg",
        folder: "courses",
      });
      setFormData(prev => ({ ...prev, imageUrl: result.url }));
      toast.success('Cover image uploaded');
    } catch (err: any) {
      toast.error('Upload error: ' + err.message);
      setFormData(prev => ({ ...prev, imagePreview: "", imageUrl: "" }));
    } finally {
      setImageUploading(false);
    }
  };

  const handleTogglePublish = (course: any) => {
    updateMutation.mutate({
      id: course.id,
      status: course.status === "published" ? "draft" : "published",
    });
  };

  const handleVideoUpload = async (file: File) => {
    // SECURITY & UX: Validate video file type - support all common formats
    const validVideoTypes = [
      'video/mp4',
      'video/quicktime',      // .mov
      'video/x-msvideo',      // .avi
      'video/webm',
      'video/x-matroska',     // .mkv
      'video/mpeg',
      'video/x-flv',          // .flv
      'video/3gpp',           // .3gp
      'video/x-ms-wmv',       // .wmv
    ];

    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|mov|avi|webm|mkv|mpeg|flv|3gp|wmv)$/i)) {
      toast.error('❌ Por favor selecciona un archivo de video válido\n(.mp4, .mov, .avi, .webm, .mkv, etc.)');
      return;
    }

    // SECURITY: Validate file size (max 2GB for Bunny.net)
    const MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
    const fileSizeMB = file.size / 1024 / 1024;

    if (file.size > MAX_VIDEO_SIZE) {
      toast.error(
        `❌ El video es demasiado grande.\n\n` +
        `📦 Tamaño máximo: 2GB (2048MB)\n` +
        `📁 Tu archivo: ${fileSizeMB.toFixed(1)}MB\n\n` +
        `💡 Tip: Comprime el video con Handbrake o similar.`,
        { duration: 8000 }
      );
      return;
    }

    // UX: Show informative toast based on file size
    if (fileSizeMB > 500) {
      toast.info(
        `📤 Subiendo video grande: ${fileSizeMB.toFixed(1)}MB\n` +
        `⏱️ Tiempo estimado: ${Math.ceil(fileSizeMB / 10)} minutos\n` +
        `⚠️ No cierres esta ventana hasta que termine.`,
        { duration: 10000 }
      );
    } else if (fileSizeMB > 100) {
      toast.info(
        `📤 Subiendo video de ${fileSizeMB.toFixed(1)}MB...\n` +
        `⏱️ Esto puede tardar unos minutos.`,
        { duration: 6000 }
      );
    }

    setUploading(true);
    const uploadStartTime = Date.now();

    try {
      const reader = new FileReader();

      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentLoaded = Math.round((e.loaded / e.total) * 100);
          logger.debug('[Video Upload] Reading file', {
            percentLoaded,
            loadedMB: (e.loaded / 1024 / 1024).toFixed(1),
            totalMB: fileSizeMB.toFixed(1)
          });
        }
      };

      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const readTime = ((Date.now() - uploadStartTime) / 1000).toFixed(1);
        logger.info('[Video Upload] File read complete', { readTime: `${readTime}s` });

        // Show file name as preview indicator
        setFormData(prev => ({ ...prev, videoFile: file, videoPreview: file.name }));

        // Upload to Bunny.net Stream API (NOT Storage - videos use Stream)
        try {
          toast.info('☁️ Subiendo a Bunny.net...', { duration: 3000 });

          // Use uploadVideoToBunny for videos (NOT uploadFile)
          const result = await uploadVideoMutation.mutateAsync({
            videoBase64: base64,
            fileName: file.name,
            title: formData.title || file.name.replace(/\.[^/.]+$/, ""),
          });

          const totalTime = ((Date.now() - uploadStartTime) / 1000).toFixed(1);
          const uploadSpeed = (fileSizeMB / (totalTime as any)).toFixed(2);

          // Save bunnyVideoId to use when creating lessons
          setFormData(prev => ({
            ...prev,
            bunnyVideoId: result.bunnyVideoId,
            bunnyLibraryId: result.bunnyLibraryId,
            videoUrl: "", // Clear old videoUrl, we use bunnyVideoId now
          }));

          toast.success(
            `✅ ¡Video subido exitosamente a Bunny.net!\n\n` +
            `📁 ${file.name}\n` +
            `📦 ${fileSizeMB.toFixed(1)}MB\n` +
            `⏱️ ${totalTime}s (${uploadSpeed}MB/s)\n` +
            `🎬 Video ID: ${result.bunnyVideoId.substring(0, 20)}...\n\n` +
            `⚠️ El video se está procesando en Bunny.net`,
            { duration: 10000 }
          );

          logger.info('[Video Upload] SUCCESS', { bunnyVideoId: result.bunnyVideoId });
        } catch (uploadErr: any) {
          logger.error('[Video Upload] Bunny.net upload failed', uploadErr);
          toast.error(
            `❌ Error al subir el video al servidor:\n\n` +
            `${uploadErr.message}\n\n` +
            `💡 Intenta de nuevo o contacta soporte si persiste.`,
            { duration: 8000 }
          );
          setFormData(prev => ({ ...prev, videoFile: null, videoPreview: "", videoUrl: "", bunnyVideoId: undefined, bunnyLibraryId: undefined }));
        }
      };

      reader.onerror = () => {
        logger.error('[Video Upload] File read error');
        toast.error('❌ Error al leer el archivo. Por favor intenta de nuevo.');
        setUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      logger.error('[Video Upload] Unexpected error', error);
      toast.error('❌ Error inesperado al procesar el video. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!formData.title || !formData.price || !formData.instructorId) {
      toast.error(t("validation.fillRequiredFields"));
      return;
    }

    // Check entitlement only when creating (not updating)
    if (!editingId) {
      try {
        const result = await checkCourseEntitlement();
        const entitlement = result.data;
        if (entitlement && !entitlement.allowed) {
          setUpgradeReason(entitlement.reason ?? t("admin.events.errorPlanLimit"));
          setUpgradeDialogOpen(true);
          return;
        }
      } catch {
        // Fail open
      }
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        title: formData.title,
        description: formData.description,
        danceStyle: formData.danceStyle,
        level: formData.level,
        price: formData.price,
        instructorId: parseInt(formData.instructorId),
        duration: formData.duration,
        lessonsCount: formData.lessonsCount ? parseInt(formData.lessonsCount) : undefined,
        videoUrl: formData.videoUrl || undefined,
        imageUrl: formData.imageUrl || undefined,
      });
    } else {
      createMutation.mutate({
        title: formData.title,
        description: formData.description,
        danceStyle: formData.danceStyle,
        level: formData.level,
        price: formData.price,
        instructorId: parseInt(formData.instructorId),
        duration: formData.duration,
        lessonsCount: formData.lessonsCount ? parseInt(formData.lessonsCount) : undefined,
        videoUrl: formData.videoUrl || undefined,
        imageUrl: formData.imageUrl || undefined,
      });
      resetForm();
    }
  };

  return (
    <div className="space-y-6">
      {/* Warning for instructors without a profile */}
      {!isAdmin && !myInstructorProfile && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-yellow-500/50 bg-yellow-500/10">
          <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-yellow-400">Perfil de instructor no encontrado</p>
            <p className="text-sm text-foreground/70 mt-1">
              Para subir cursos, el administrador debe crear tu perfil de instructor con el mismo nombre que tu cuenta de usuario (<strong>{user?.name}</strong>).
            </p>
          </div>
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? t("admin.courses.editCourse") : t("admin.courses.createCourse")}</CardTitle>
          <CardDescription>Add or edit dance courses with video</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder={t("admin.courses.courseTitle")}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <Input
              placeholder={t("admin.courses.danceStyle")}
              value={formData.danceStyle}
              onChange={(e) => setFormData({ ...formData, danceStyle: e.target.value })}
            />
            <Input
              type="number"
              placeholder={t("admin.courses.price")}
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />
            <Input
              placeholder={t("admin.courses.duration")}
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            />
            <Input
              type="number"
              placeholder={t("admin.courses.lessonsCount")}
              value={formData.lessonsCount.toString()}
              onChange={(e) => setFormData({ ...formData, lessonsCount: e.target.value })}
            />
            <Select value={formData.level} onValueChange={(val: any) => setFormData({ ...formData, level: val })}>
              <SelectTrigger>
                <SelectValue placeholder={t("admin.courses.selectLevel")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="all-levels">All Levels</SelectItem>
              </SelectContent>
            </Select>
            {isAdmin ? (
              <Select value={formData.instructorId} onValueChange={(val) => setFormData({ ...formData, instructorId: val })}>
                <SelectTrigger>
                  <SelectValue placeholder={t("admin.courses.selectInstructor")} />
                </SelectTrigger>
                <SelectContent>
                  {instructors?.map((instructor) => (
                    <SelectItem key={instructor.id} value={instructor.id.toString()}>
                      {instructor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 border border-border/50 rounded-md bg-card/50">
                <span className="text-sm text-foreground/60">Instructor:</span>
                <span className="text-sm font-medium">{user?.name || user?.email}</span>
              </div>
            )}
          </div>

          <Textarea
            placeholder={t("admin.courses.courseDescription")}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
          />

          {/* Video Upload */}
          <div className="border-2 border-dashed border-accent/30 rounded-lg p-6">
            {formData.videoUrl ? (
              <div className="space-y-4">
                <div className="bg-black/20 rounded-lg p-4 text-center">
                  <Video className="h-8 w-8 mx-auto mb-2 text-accent" />
                  <p className="text-foreground/60 text-sm">{formData.videoFile?.name}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Change Video
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setFormData({ ...formData, videoFile: null, videoUrl: "" })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Video className="h-8 w-8 mx-auto mb-2 text-accent/40" />
                <p className="text-foreground/60 mb-4">{t("admin.courses.uploadCourseVideo")}</p>
                <Button
                  variant="outline"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Select Video
                    </>
                  )}
                </Button>
              </div>
            )}
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleVideoUpload(e.target.files[0]);
                }
              }}
              className="hidden"
            />
          </div>

          {/* Cover Image Upload */}
          <div className="border-2 border-dashed border-accent/30 rounded-lg p-4">
            <p className="text-sm font-medium text-foreground/70 mb-3">Cover image (optional)</p>
            {formData.imagePreview ? (
              <div className="space-y-3">
                <div className="relative">
                  <img src={formData.imagePreview} alt={t("admin.courses.coverAlt")} className="w-full h-40 object-cover rounded-lg" />
                  {!formData.imageUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                      <span className="text-white ml-2 text-sm">{t("admin.buttons.uploading")}</span>
                    </div>
                  )}
                  {formData.imageUrl && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">✓ Uploaded</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} disabled={imageUploading}>
                    <ImageIcon className="h-4 w-4 mr-2" />Cambiar imagen
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setFormData(prev => ({ ...prev, imageUrl: "", imagePreview: "" }))}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-2">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 text-accent/40" />
                <p className="text-foreground/60 text-sm mb-3">{t("admin.courses.uploadCover")}</p>
                <Button variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} disabled={imageUploading}>
                  {imageUploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</> : <><Upload className="h-4 w-4 mr-2" />Select image</>}
                </Button>
              </div>
            )}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) { handleImageSelect(f); e.target.value = ""; } }}
              className="hidden"
            />
          </div>

          {/* Image Cropper Modal for Courses (16:9) */}
          <ImageCropperModal
            imageSrc={cropSrc}
            aspect={16 / 9}
            label={t("admin.courses.cropCover")}
            onCropComplete={handleCropComplete}
            onClose={() => setCropSrc(null)}
          />

          <div className="flex gap-2">
            <Button
              onClick={handleCreateCourse}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="btn-vibrant flex-1"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingId ? t("admin.buttons.updating") : t("admin.buttons.creating")}
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {editingId ? t("admin.courses.updateCourse") : t("admin.courses.createCourseButton")}
                </>
              )}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={resetForm} className="flex-1">Cancel</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Courses List */}
      <Card>
        <CardHeader>
          <CardTitle>{isAdmin ? t("admin.courses.allCourses") : t("admin.courses.myCourses")}</CardTitle>
          <CardDescription>
            {isAdmin
              ? `${courses?.length || 0} total courses`
              : myInstructorProfile
                ? `Courses by ${myInstructorProfile.name}`
                : t("admin.courses.manageCourses")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : courses && courses.length > 0 ? (
            <div className="space-y-4">
              {courses.map((course) => (
                <div key={course.id} className="border border-border/50 rounded-lg p-4 flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{course.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${course.status === 'published'
                        ? 'bg-green-500/20 text-green-400 border-green-500/50'
                        : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                        }`}>
                        {course.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/60">{course.danceStyle} · {course.level}</p>
                    <p className="text-sm text-accent font-medium">£{course.price}</p>
                    {course.videoUrl && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-green-500">
                        <Video className="h-3 w-3" />
                        Video uploaded
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTogglePublish(course)}
                      disabled={updateMutation.isPending}
                      className={course.status === 'published'
                        ? 'border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10'
                        : 'border-green-500/50 text-green-400 hover:bg-green-500/10'}
                    >
                      {course.status === 'published' ? 'Despublicar' : 'Publicar'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEmailingCourse(course)} className="gap-2">
                      <Mail className="h-4 w-4" />
                      Send Email
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(course)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    {confirmDeleteId === course.id ? (
                      <div className="flex gap-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => { deleteMutation.mutate(course.id); }}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Yes'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <Button variant="destructive" size="sm" onClick={() => setConfirmDeleteId(course.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-foreground/60 mb-2">
                {isAdmin ? t("admin.courses.noCourses") : t("admin.courses.noCoursesYet")}
              </p>
              {!isAdmin && !myInstructorProfile && (
                <p className="text-sm text-yellow-400">
                  ⚠️ Your instructor profile was not found. Make sure the admin has created your profile with the same name as your account.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Campaign Modal */}
      {emailingCourse && (
        <Dialog open={!!emailingCourse} onOpenChange={(open) => { if (!open) { setEmailingCourse(null); setEmailSubject(""); setEmailBody(""); setEmailSegment("all"); setEmailSendNow(true); setEmailScheduledAt(""); setEmailPreview(false); } }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-accent" />{t("admin.events.emailCampaign")}</DialogTitle>
              <DialogDescription>Promote "{emailingCourse.title}" — pick a template or write custom HTML</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <h3 className="text-sm font-semibold text-foreground/70 mb-3 flex items-center gap-1"><LayoutTemplate className="h-4 w-4" /> Templates</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {emailTemplates?.map((tpl) => (
                    <button key={tpl.id} onClick={() => { setEmailSubject(tpl.subject); setEmailBody(tpl.htmlContent); }} className="w-full text-left p-2 rounded-lg border border-border/30 hover:border-accent/50 hover:bg-accent/5 transition-colors">
                      <p className="text-xs font-semibold truncate">{tpl.name}</p>
                      <p className="text-xs text-foreground/40 truncate">{tpl.subject}</p>
                    </button>
                  ))}
                  {(!emailTemplates || emailTemplates.length === 0) && <p className="text-xs text-foreground/40 text-center py-4">No templates — <Link href="/email-marketing" className="text-accent underline">create some</Link></p>}
                </div>
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">{t("admin.events.audience")}</label>
                    <Select value={emailSegment} onValueChange={setEmailSegment}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("admin.events.audienceAll")}</SelectItem>
                        <SelectItem value="customer">{t("admin.events.audienceCustomers")}</SelectItem>
                        <SelectItem value="vip">{t("admin.events.audienceVip")}</SelectItem>
                        <SelectItem value="lead">{t("admin.events.audienceLeads")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">{t("admin.events.send")}</label>
                    <Select value={emailSendNow ? "now" : "schedule"} onValueChange={(v) => setEmailSendNow(v === "now")}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="now">Send Immediately</SelectItem>
                        <SelectItem value="schedule">Schedule for Later</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {!emailSendNow && (
                    <div>
                      <label className="text-xs font-medium mb-1 flex items-center gap-1 block"><Calendar className="h-3 w-3" /> Date & Time</label>
                      <Input type="datetime-local" value={emailScheduledAt} onChange={(e) => setEmailScheduledAt(e.target.value)} min={new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16)} className="h-8 text-xs" />
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-2 space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">{t("admin.events.subjectLine")}</label>
                  <Input placeholder={t("admin.events.subjectPlaceholder")} value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium">{t("admin.events.emailContent")}</label>
                    <Button variant="ghost" size="sm" onClick={() => setEmailPreview(!emailPreview)} className="text-xs h-6"><Eye className="h-3 w-3 mr-1" />{emailPreview ? t("common.edit") : t("admin.events.preview")}</Button>
                  </div>
                  {emailPreview ? (
                    <div className="border border-border/50 rounded-lg overflow-hidden h-56"><iframe srcDoc={emailBody} className="w-full h-full" sandbox="allow-same-origin" title={t("admin.events.preview") || "Preview"} /></div>
                  ) : (
                    <Textarea placeholder={t("admin.events.contentPlaceholder")} value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={10} className="font-mono text-xs" />
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-border/30">
              <Button variant="outline" onClick={() => setEmailingCourse(null)}>Cancel</Button>
              <Button
                onClick={() => createCampaignMutation.mutate({ name: `${emailingCourse.title} – Campaign`, subject: emailSubject || `Discover ${emailingCourse.title}!`, htmlContent: emailBody || `<p>Discover <strong>${emailingCourse.title}</strong>!</p>`, segment: emailSegment as any, scheduledAt: !emailSendNow && emailScheduledAt ? emailScheduledAt : undefined })}
                disabled={createCampaignMutation.isPending || sendCampaignMutation.isPending}
                className="btn-vibrant gap-2"
              >
                {(createCampaignMutation.isPending || sendCampaignMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : emailSendNow ? <Send className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                {emailSendNow ? t("admin.events.sendNow") : t("admin.events.schedule")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {/* Upgrade plan dialog */}
      <UpgradePlanDialog
        open={upgradeDialogOpen}
        onClose={() => setUpgradeDialogOpen(false)}
        resourceType="course"
        reason={upgradeReason}
      />
    </div>
  );
}

// ===== CLASSES TAB =====
function ClassesTab() {
  const { t } = useTranslations();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { data: classes, isLoading, refetch } = isAdmin
    ? trpc.classes.listAll.useQuery({ limit: 100, offset: 0 })
    : trpc.admin.listMyClasses.useQuery();
  const { data: instructors } = trpc.instructors.list.useQuery();
  const { data: myInstructorProfile } = trpc.instructors.getMyProfile.useQuery(undefined, {
    enabled: !isAdmin,
  });
  const [emailingClass, setEmailingClass] = useState<any>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailSegment, setEmailSegment] = useState("all");
  const [emailSendNow, setEmailSendNow] = useState(true);
  const [emailScheduledAt, setEmailScheduledAt] = useState("");
  const [emailPreview, setEmailPreview] = useState(false);
  const { data: emailTemplates } = trpc.emailMarketing.listTemplates.useQuery();
  const utils = trpc.useUtils();
  // Entitlement enforcement
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");
  const { refetch: checkClassEntitlement } = trpc.subscriptions.checkEntitlement.useQuery(
    { resourceType: "class" },
    { enabled: false }
  );
  const createCampaignMutation = trpc.emailMarketing.createCampaign.useMutation({
    onSuccess: (data) => {
      if (emailSendNow) {
        sendCampaignMutation.mutate({ campaignId: data.id });
      } else {
        toast.success(t("admin.events.toastCampaignScheduled"));
        setEmailingClass(null);
        utils.emailMarketing.listCampaigns.invalidate();
      }
    },
    onError: (e) => toast.error(e.message),
  });
  const sendCampaignMutation = trpc.emailMarketing.sendCampaign.useMutation({
    onSuccess: (data) => {
      toast.success(t("admin.events.toastEmailSent", { count: data.sent }));
      setEmailingClass(null);
      utils.emailMarketing.listCampaigns.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const createMutation = trpc.classes.create.useMutation({
    onSuccess: () => {
      toast.success(t("admin.classes.toastCreated"));
      refetch();
    },
    onError: (err) => { toast.error(err.message); },
  });

  const updateMutation = trpc.classes.update.useMutation({
    onSuccess: () => {
      toast.success(t("admin.classes.toastUpdated"));
      refetch();
      resetForm();
    },
    onError: (err) => { toast.error(err.message); },
  });

  const deleteMutation = trpc.classes.delete.useMutation({
    onSuccess: () => {
      toast.success(t("admin.classes.toastDeleted"));
      refetch();
      setConfirmDeleteId(null);
    },
    onError: (err) => { toast.error(err.message); },
  });

  const uploadFileMutation = trpc.uploads.uploadFile.useMutation();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  // Note: email state is already declared above
  const [expandedClassId, setExpandedClassId] = useState<number | null>(null);
  const { data: classQRCodes } = trpc.qrcode.getQRCode.useQuery(
    expandedClassId ? { itemType: "class", itemId: expandedClassId } : { itemType: "class", itemId: -1 },
    { enabled: expandedClassId !== null }
  );
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    danceStyle: "",
    level: "all-levels",
    price: "",
    instructorId: "",
    classDate: "",
    duration: "",
    maxParticipants: "",
    imageUrl: "",
    imagePreview: "",
    hasSocial: false,
    socialTime: "",
    socialLocation: "",
    socialDescription: "",
    paymentMethod: "online" as "online" | "cash" | "both",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      danceStyle: "",
      level: "all-levels",
      price: "",
      instructorId: "",
      classDate: "",
      duration: "",
      maxParticipants: "",
      imageUrl: "",
      imagePreview: "",
      hasSocial: false,
      socialTime: "",
      socialLocation: "",
      socialDescription: "",
      paymentMethod: "online",
    });
    setEditingId(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  // Step 1: read file → open cropper
  const handleImageSelect = (file: File) => {
    // SECURITY & UX: Validate image file type
    if (!file.type.startsWith('image/')) {
      toast.error(t("admin.events.errorInvalidImage"));
      return;
    }

    // SECURITY: Validate file size (max 10MB for images)
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(t("admin.events.errorImageTooLarge", { size: (file.size / 1024 / 1024).toFixed(1) }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setCropSrc(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Step 2: receive cropped data URL → upload to S3
  const handleCropComplete = async (croppedDataUrl: string) => {
    setCropSrc(null);
    setFormData(prev => ({ ...prev, imagePreview: croppedDataUrl, imageUrl: "" }));
    setUploading(true);
    try {
      const result = await uploadFileMutation.mutateAsync({
        fileBase64: croppedDataUrl,
        fileName: "class-cover.jpg",
        mimeType: "image/jpeg",
      });
      setFormData(prev => ({ ...prev, imageUrl: result.url }));
      toast.success(t("upload.imageUploadedSuccess"));
    } catch {
      toast.error('Failed to upload image');
      setFormData(prev => ({ ...prev, imagePreview: "", imageUrl: "" }));
    } finally {
      setUploading(false);
    }
  };

  // Legacy alias
  const handleImageUpload = handleImageSelect;

  const handleEditClick = (cls: any) => {
    setEditingId(cls.id);
    const d = new Date(cls.classDate);
    const pad = (n: number) => String(n).padStart(2, "0");
    const localDateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setFormData({
      title: cls.title || "",
      description: cls.description || "",
      danceStyle: cls.danceStyle || "",
      level: cls.level || "all-levels",
      price: cls.price?.toString() || "",
      instructorId: cls.instructorId?.toString() || "",
      classDate: localDateStr,
      duration: cls.duration?.toString() || "",
      maxParticipants: cls.maxParticipants?.toString() || "",
      imageUrl: cls.imageUrl || "",
      imagePreview: cls.imageUrl || "",
      hasSocial: cls.hasSocial || false,
      socialTime: cls.socialTime || "",
      socialLocation: cls.socialLocation || "",
      socialDescription: cls.socialDescription || "",
      paymentMethod: (cls.paymentMethod || "online") as "online" | "cash" | "both",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTogglePublish = (cls: any) => {
    updateMutation.mutate({
      id: cls.id,
      status: cls.status === "published" ? "draft" : "published",
    });
  };

  const handleMarkCompleted = (cls: any) => {
    updateMutation.mutate({ id: cls.id, status: "completed" });
  };

  const handleSaveClass = async () => {
    if (!formData.title || !formData.price || !formData.instructorId || !formData.classDate) {
      toast.error(t("validation.fillRequiredFields"));
      return;
    }

    // Check entitlement only when creating (not updating)
    if (!editingId) {
      try {
        const result = await checkClassEntitlement();
        const entitlement = result.data;
        if (entitlement && !entitlement.allowed) {
          setUpgradeReason(entitlement.reason ?? t("admin.events.errorPlanLimit"));
          setUpgradeDialogOpen(true);
          return;
        }
      } catch {
        // Fail open
      }
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        title: formData.title,
        description: formData.description,
        danceStyle: formData.danceStyle,
        level: formData.level as any,
        price: formData.price,
        instructorId: parseInt(formData.instructorId),
        classDate: formData.classDate,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
        imageUrl: formData.imageUrl || undefined,
        hasSocial: formData.hasSocial,
        socialTime: formData.socialTime || undefined,
        socialLocation: formData.socialLocation || undefined,
        socialDescription: formData.socialDescription || undefined,
        paymentMethod: formData.paymentMethod,
      });
    } else {
      createMutation.mutate({
        title: formData.title,
        description: formData.description,
        danceStyle: formData.danceStyle,
        level: formData.level as any,
        price: formData.price,
        instructorId: parseInt(formData.instructorId),
        classDate: formData.classDate,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
        imageUrl: formData.imageUrl || undefined,
        hasSocial: formData.hasSocial,
        socialTime: formData.socialTime || undefined,
        socialLocation: formData.socialLocation || undefined,
        socialDescription: formData.socialDescription || undefined,
        paymentMethod: formData.paymentMethod,
      });
      resetForm();
    }
  };

  return (
    <div className="space-y-6">
      {/* Warning for instructors without a profile */}
      {!isAdmin && !myInstructorProfile && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-yellow-500/50 bg-yellow-500/10">
          <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-yellow-400">Perfil de instructor no encontrado</p>
            <p className="text-sm text-foreground/70 mt-1">
              Para crear clases, primero ve a la pestaña <strong>My Profile</strong> y guarda tu perfil de instructor. Esto lo vinculará automáticamente a tu cuenta.
            </p>
          </div>
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? t("admin.classes.editClass") : t("admin.classes.createClass")}</CardTitle>
          <CardDescription>Add or edit live dance classes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder={t("admin.classes.classTitle")}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <Input
              placeholder={t("admin.classes.danceStyle")}
              value={formData.danceStyle}
              onChange={(e) => setFormData({ ...formData, danceStyle: e.target.value })}
            />
            <Input
              type="number"
              placeholder={t("admin.courses.price")}
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />
            <Input
              type="datetime-local"
              value={formData.classDate}
              onChange={(e) => setFormData({ ...formData, classDate: e.target.value })}
            />
            <Input
              type="number"
              placeholder={t("admin.classes.duration")}
              value={formData.duration.toString()}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            />
            <Input
              type="number"
              placeholder={t("admin.classes.maxParticipants")}
              value={formData.maxParticipants.toString()}
              onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
            />
            <Select value={formData.level} onValueChange={(val: any) => setFormData({ ...formData, level: val })}>
              <SelectTrigger>
                <SelectValue placeholder={t("admin.classes.level")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="all-levels">All Levels</SelectItem>
              </SelectContent>
            </Select>
            <Select value={formData.instructorId} onValueChange={(val) => setFormData({ ...formData, instructorId: val })}>
              <SelectTrigger>
                <SelectValue placeholder={t("admin.classes.selectInstructor")} />
              </SelectTrigger>
              <SelectContent>
                {instructors?.map((instructor) => (
                  <SelectItem key={instructor.id} value={instructor.id.toString()}>
                    {instructor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            placeholder={t("admin.classes.classDescription")}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
          />
          {/* Image Upload */}
          <div>
            <p className="text-sm font-medium text-foreground/80 mb-2">Cover image</p>
            <div
              className="border-2 border-dashed border-border/50 rounded-lg p-4 text-center cursor-pointer hover:border-accent/50 transition-colors relative"
              onClick={() => imageInputRef.current?.click()}
            >
              {uploading ? (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-accent" />
                  <span className="text-sm text-foreground/60">{t("admin.classes.uploadingImage")}</span>
                </div>
              ) : formData.imagePreview ? (
                <div className="relative">
                  <img src={formData.imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-md" />
                  <button
                    type="button"
                    className="absolute top-2 right-2 bg-black/60 rounded-full p-1 hover:bg-black/80"
                    onClick={(e) => { e.stopPropagation(); setFormData(prev => ({ ...prev, imageUrl: '', imagePreview: '' })); if (imageInputRef.current) imageInputRef.current.value = ''; }}
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ) : (
                <div className="py-4">
                  <ImageIcon className="h-8 w-8 text-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-foreground/60">{t("admin.classes.uploadCover")}</p>
                  <p className="text-xs text-foreground/40 mt-1">{t("admin.classes.imageFormats")}</p>
                </div>
              )}
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) { handleImageSelect(f); e.target.value = ""; } }}
              className="hidden"
            />
          </div>

          {/* Payment Method Section */}
          <div className="border-t border-border/30 pt-4 mt-4">
            <p className="text-sm font-medium text-foreground/80 mb-3">Payment Method</p>
            <Select value={formData.paymentMethod} onValueChange={(val: any) => setFormData({ ...formData, paymentMethod: val })}>
              <SelectTrigger>
                <SelectValue placeholder={t("admin.events.selectPaymentMethod")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">{t("admin.events.paymentOnline")}</SelectItem>
                <SelectItem value="cash">{t("admin.events.paymentCash")}</SelectItem>
                <SelectItem value="both">{t("admin.classes.paymentBoth")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Social Event Section */}
          <div className="border-t border-border/30 pt-4 mt-4">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors duration-200 ${formData.hasSocial ? "bg-accent" : "bg-border"
                  }`}
                onClick={() => setFormData({ ...formData, hasSocial: !formData.hasSocial })}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${formData.hasSocial ? "translate-x-5" : "translate-x-0"
                    }`}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground cursor-pointer" onClick={() => setFormData({ ...formData, hasSocial: !formData.hasSocial })}>
                  🎉 Social after class?
                </label>
                <p className="text-xs text-foreground/50">{t("admin.classes.socialDescription")}</p>
              </div>
            </div>

            {formData.hasSocial && (
              <div className="space-y-3 bg-accent/5 border border-accent/20 rounded-xl p-4">
                <p className="text-xs font-semibold text-accent uppercase tracking-wide mb-3">Social Event Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-foreground/60 font-medium">{t("admin.classes.socialStartTime")}</label>
                    <Input
                      type="time"
                      value={formData.socialTime}
                      onChange={(e) => setFormData({ ...formData, socialTime: e.target.value })}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-foreground/60 font-medium">{t("admin.classes.socialLocation")}</label>
                    <Input
                      placeholder={t("admin.classes.socialLocationPlaceholder")}
                      value={formData.socialLocation}
                      onChange={(e) => setFormData({ ...formData, socialLocation: e.target.value })}
                      className="bg-background/50"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-foreground/60 font-medium">{t("admin.classes.socialDescriptionLabel")}</label>
                  <textarea
                    placeholder={t("admin.classes.socialDescriptionPlaceholder")}
                    value={formData.socialDescription}
                    onChange={(e) => setFormData({ ...formData, socialDescription: e.target.value })}
                    rows={2}
                    className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  />
                </div>
                {(formData.socialTime || formData.socialLocation) && (
                  <div className="flex items-center gap-2 text-xs text-accent bg-accent/10 rounded-lg px-3 py-2">
                    <span>{t("admin.classes.socialCheckmark")}</span>
                    <span>
                      Social at {formData.socialTime || "TBD"}
                      {formData.socialLocation ? ` · ${formData.socialLocation}` : ""}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Image Cropper Modal for Classes (16:9) */}
          <ImageCropperModal
            imageSrc={cropSrc}
            aspect={16 / 9}
            label={t("admin.classes.cropImage")}
            onCropComplete={handleCropComplete}
            onClose={() => setCropSrc(null)}
          />

          <div className="flex gap-2">
            <Button
              onClick={handleSaveClass}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="btn-vibrant flex-1"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingId ? t("admin.buttons.updating") : t("admin.buttons.creating")}
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {editingId ? t("admin.classes.updateClass") : t("admin.classes.createClassButton")}
                </>
              )}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={resetForm} className="flex-1">
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Classes List */}
      <Card>
        <CardHeader>
          <CardTitle>{isAdmin ? t("admin.classes.allClasses") : t("admin.classes.myClasses")}</CardTitle>
          <CardDescription>
            {isAdmin
              ? `${classes?.length || 0} clases en total`
              : myInstructorProfile
                ? `Clases impartidas por ${myInstructorProfile.name}`
                : t("admin.classes.manageClasses")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : classes && classes.length > 0 ? (() => {
            const now = new Date();
            const upcoming = classes.filter(c => new Date(c.classDate) >= now && c.status !== 'completed');
            const past = classes.filter(c => new Date(c.classDate) < now || c.status === 'completed');

            const renderClass = (cls: any) => (
              <div key={cls.id}>
                <div className={`border rounded-lg overflow-hidden flex flex-col sm:flex-row ${cls.status === 'completed' ? 'border-border/30 opacity-70' : 'border-border/50'
                  }`}>
                  {/* Cover image */}
                  {cls.imageUrl ? (
                    <div className="sm:w-32 h-24 sm:h-auto flex-shrink-0">
                      <img src={cls.imageUrl} alt={cls.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="sm:w-32 h-24 sm:h-auto flex-shrink-0 bg-accent/10 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-foreground/20" />
                    </div>
                  )}
                  <div className="flex-1 p-4 flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-foreground">{cls.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${cls.status === 'published'
                          ? 'bg-green-500/20 text-green-400 border-green-500/50'
                          : cls.status === 'completed'
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                            : cls.status === 'cancelled'
                              ? 'bg-red-500/20 text-red-400 border-red-500/50'
                              : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                          }`}>
                          {cls.status === 'published' ? 'Published' : cls.status === 'completed' ? 'Completed' : cls.status === 'cancelled' ? 'Cancelled' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/60">{cls.danceStyle} · {cls.level}</p>
                      <p className="text-sm text-foreground/60">{new Date(cls.classDate).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                      <p className="text-sm text-accent font-medium">£{cls.price}{cls.maxParticipants ? ` · max. ${cls.maxParticipants}` : ''}</p>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedClassId(expandedClassId === cls.id ? null : cls.id)}
                        className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 gap-1 text-xs"
                        title={t("admin.classes.qrTooltip")}
                      >
                        <QrCode className="h-4 w-4" />
                        <span>QR</span>
                      </Button>
                      {cls.status !== 'completed' && cls.status !== 'cancelled' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePublish(cls)}
                          disabled={updateMutation.isPending}
                          className={cls.status === 'published'
                            ? 'border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10'
                            : 'border-green-500/50 text-green-400 hover:bg-green-500/10'}
                        >
                          {cls.status === 'published' ? 'Unpublish' : 'Publish'}
                        </Button>
                      )}
                      {cls.status !== 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkCompleted(cls)}
                          disabled={updateMutation.isPending}
                          className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 text-xs"
                        >
                          Mark Done
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => setEmailingClass(cls)} className="gap-2">
                        <Mail className="h-4 w-4" />
                        Send Email
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditClick(cls)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {confirmDeleteId === cls.id ? (
                        <div className="flex gap-1">
                          <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(cls.id)} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Yes'}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <Button variant="destructive" size="sm" onClick={() => setConfirmDeleteId(cls.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                {expandedClassId === cls.id && (
                  <div className="p-4 border-t border-border/30 space-y-6">
                    {/* Attendance Scanner Section */}
                    <div>
                      <h4 className="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-2">
                        <QrCode className="h-4 w-4" />
                        Scan Attendance
                      </h4>
                      <p className="text-xs text-foreground/50 mb-3">Open the QR scanner to check in attendees. Point the camera at each attendee's personal QR code from their dashboard.</p>
                      <div className="flex gap-2 flex-wrap">
                        <a href="/attendance" target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="btn-vibrant gap-2">
                            <QrCode className="h-4 w-4" />
                            Open QR Scanner
                          </Button>
                        </a>
                        <a href="/attendance" target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 gap-2">
                            <Users className="h-4 w-4" />
                            View Attendees
                          </Button>
                        </a>
                      </div>
                    </div>
                    {/* Co-Instructors Section */}
                    <div className="border-t border-border/30 pt-4">
                      <h4 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Co-Instructors
                      </h4>
                      <CoInstructorManager classId={cls.id} instructors={instructors || []} />
                    </div>
                  </div>
                )}
              </div>
            );

            return (
              <div className="space-y-6">
                {upcoming.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground/60 uppercase tracking-wider mb-3">Upcoming classes ({upcoming.length})</h3>
                    <div className="space-y-3">{upcoming.map(renderClass)}</div>
                  </div>
                )}
                {past.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground/40 uppercase tracking-wider mb-3">Past / completed classes ({past.length})</h3>
                    <div className="space-y-3">{past.map(renderClass)}</div>
                  </div>
                )}
              </div>
            );
          })() : (
            <div className="text-center py-8">
              <p className="text-foreground/60 mb-2">
                {isAdmin ? t("admin.classes.noClasses") : t("admin.classes.noClassesYet")}
              </p>
              {!isAdmin && !myInstructorProfile && (
                <p className="text-sm text-yellow-400">
                  ⚠️ Your instructor profile was not found. Make sure the admin has created your profile with the same name as your account.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Campaign Modal */}
      {emailingClass && (
        <Dialog open={!!emailingClass} onOpenChange={(open) => { if (!open) { setEmailingClass(null); setEmailSubject(""); setEmailBody(""); setEmailSegment("all"); setEmailSendNow(true); setEmailScheduledAt(""); setEmailPreview(false); } }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-accent" />{t("admin.events.emailCampaign")}</DialogTitle>
              <DialogDescription>Promote "{emailingClass.title}" — pick a template or write custom HTML</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <h3 className="text-sm font-semibold text-foreground/70 mb-3 flex items-center gap-1"><LayoutTemplate className="h-4 w-4" /> Templates</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {emailTemplates?.map((tpl) => (
                    <button key={tpl.id} onClick={() => { setEmailSubject(tpl.subject); setEmailBody(tpl.htmlContent); }} className="w-full text-left p-2 rounded-lg border border-border/30 hover:border-accent/50 hover:bg-accent/5 transition-colors">
                      <p className="text-xs font-semibold truncate">{tpl.name}</p>
                      <p className="text-xs text-foreground/40 truncate">{tpl.subject}</p>
                    </button>
                  ))}
                  {(!emailTemplates || emailTemplates.length === 0) && <p className="text-xs text-foreground/40 text-center py-4">No templates — <Link href="/email-marketing" className="text-accent underline">create some</Link></p>}
                </div>
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">{t("admin.events.audience")}</label>
                    <Select value={emailSegment} onValueChange={setEmailSegment}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("admin.events.audienceAll")}</SelectItem>
                        <SelectItem value="customer">{t("admin.events.audienceCustomers")}</SelectItem>
                        <SelectItem value="vip">{t("admin.events.audienceVip")}</SelectItem>
                        <SelectItem value="lead">{t("admin.events.audienceLeads")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">{t("admin.events.send")}</label>
                    <Select value={emailSendNow ? "now" : "schedule"} onValueChange={(v) => setEmailSendNow(v === "now")}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="now">Send Immediately</SelectItem>
                        <SelectItem value="schedule">Schedule for Later</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {!emailSendNow && (
                    <div>
                      <label className="text-xs font-medium mb-1 flex items-center gap-1 block"><Calendar className="h-3 w-3" /> Date & Time</label>
                      <Input type="datetime-local" value={emailScheduledAt} onChange={(e) => setEmailScheduledAt(e.target.value)} min={new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16)} className="h-8 text-xs" />
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-2 space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">{t("admin.events.subjectLine")}</label>
                  <Input placeholder={t("admin.events.subjectPlaceholder")} value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium">{t("admin.events.emailContent")}</label>
                    <Button variant="ghost" size="sm" onClick={() => setEmailPreview(!emailPreview)} className="text-xs h-6"><Eye className="h-3 w-3 mr-1" />{emailPreview ? t("common.edit") : t("admin.events.preview")}</Button>
                  </div>
                  {emailPreview ? (
                    <div className="border border-border/50 rounded-lg overflow-hidden h-56"><iframe srcDoc={emailBody} className="w-full h-full" sandbox="allow-same-origin" title={t("admin.events.preview") || "Preview"} /></div>
                  ) : (
                    <Textarea placeholder={t("admin.events.contentPlaceholder")} value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={10} className="font-mono text-xs" />
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-border/30">
              <Button variant="outline" onClick={() => setEmailingClass(null)}>Cancel</Button>
              <Button
                onClick={() => createCampaignMutation.mutate({ name: `${emailingClass.title} – Campaign`, subject: emailSubject || `Join us for ${emailingClass.title}!`, htmlContent: emailBody || `<p>Don't miss <strong>${emailingClass.title}</strong>!</p>`, segment: emailSegment as any, scheduledAt: !emailSendNow && emailScheduledAt ? emailScheduledAt : undefined })}
                disabled={createCampaignMutation.isPending || sendCampaignMutation.isPending}
                className="btn-vibrant gap-2"
              >
                {(createCampaignMutation.isPending || sendCampaignMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : emailSendNow ? <Send className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                {emailSendNow ? t("admin.events.sendNow") : t("admin.events.schedule")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {/* Upgrade plan dialog */}
      <UpgradePlanDialog
        open={upgradeDialogOpen}
        onClose={() => setUpgradeDialogOpen(false)}
        resourceType="class"
        reason={upgradeReason}
      />
    </div>
  );
}

// ===== CO-INSTRUCTOR MANAGER COMPONENT =====
function CoInstructorManager({ classId, instructors }: { classId: number; instructors: any[] }) {
  const { t } = useTranslations();
  const utils = trpc.useUtils();
  const { data: coInstructors, isLoading } = trpc.classes.getCoInstructors.useQuery(classId);
  const addMutation = trpc.classes.addCoInstructor.useMutation({
    onSuccess: () => {
      toast.success(t("admin.coInstructors.toastAdded"));
      utils.classes.getCoInstructors.invalidate(classId);
    },
    onError: (err) => toast.error(err.message),
  });
  const removeMutation = trpc.classes.removeCoInstructor.useMutation({
    onSuccess: () => {
      toast.success(t("admin.coInstructors.toastRemoved"));
      utils.classes.getCoInstructors.invalidate(classId);
    },
    onError: (err) => toast.error(err.message),
  });

  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [selectedRole, setSelectedRole] = useState<"lead" | "assistant">("assistant");

  const coInstructorIds = coInstructors?.map((ci: any) => ci.instructorId) || [];
  const availableInstructors = instructors.filter((i: any) => !coInstructorIds.includes(i.id));

  return (
    <div className="border border-border/30 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-foreground/80 mb-3 flex items-center gap-2">
        <Users className="h-4 w-4" /> Co-Instructors
      </h4>

      {/* Current co-instructors */}
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-accent" />
      ) : coInstructors && coInstructors.length > 0 ? (
        <div className="space-y-2 mb-3">
          {coInstructors.map((ci: any) => (
            <div key={ci.id} className="flex items-center justify-between bg-accent/5 rounded px-3 py-2">
              <div className="flex items-center gap-2">
                {ci.photoUrl ? (
                  <img src={ci.photoUrl} alt={ci.name} className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold">{ci.name?.[0]}</div>
                )}
                <span className="text-sm font-medium">{ci.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded border ${ci.role === 'lead' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  }`}>{ci.role}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                onClick={() => removeMutation.mutate({ classId, instructorId: ci.instructorId })}
                disabled={removeMutation.isPending}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-foreground/40 mb-3">{t("admin.coInstructors.noCoInstructors")}</p>
      )}

      {/* Add co-instructor */}
      {availableInstructors.length > 0 && (
        <div className="flex gap-2">
          <Select value={selectedInstructorId} onValueChange={setSelectedInstructorId}>
            <SelectTrigger className="flex-1 h-8 text-xs">
              <SelectValue placeholder={t("admin.coInstructors.addPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {availableInstructors.map((i: any) => (
                <SelectItem key={i.id} value={i.id.toString()}>{i.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedRole} onValueChange={(v: any) => setSelectedRole(v)}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lead">{t("admin.coInstructors.roleLead")}</SelectItem>
              <SelectItem value="assistant">{t("admin.coInstructors.roleAssistant")}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="h-8 text-xs"
            disabled={!selectedInstructorId || addMutation.isPending}
            onClick={() => {
              if (!selectedInstructorId) return;
              addMutation.mutate({ classId, instructorId: parseInt(selectedInstructorId), role: selectedRole });
              setSelectedInstructorId("");
            }}
          >
            {addMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          </Button>
        </div>
      )}
    </div>
  );
}

// ===== INSTRUCTORS TAB =====
function InstructorsTab() {
  const { t } = useTranslations();
  const { data: instructors, isLoading, refetch } = trpc.instructors.list.useQuery();
  const uploadFileMutation = trpc.uploads.uploadFile.useMutation();
  const createMutation = trpc.instructors.create.useMutation({
    onSuccess: () => {
      toast.success(t("admin.instructors.toastCreated"));
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const updateMutation = trpc.instructors.update.useMutation({
    onSuccess: () => {
      toast.success(t("admin.instructors.toastUpdated"));
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = trpc.instructors.delete.useMutation({
    onSuccess: () => {
      toast.success(t("admin.instructors.toastDeleted"));
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    instagramHandle: "",
    specialties: "" as string,
    photoFile: null as File | null,
    photoUrl: "",
    photoPreview: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Step 1: read file → open cropper
  // Instagram-style auto-fit image upload (no cropper needed!)
  const [showImageUpload, setShowImageUpload] = useState(false);

  const handlePhotoSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    // Open Instagram-style upload modal
    setShowImageUpload(true);
    // Store the file for the modal to process
    const reader = new FileReader();
    reader.onload = (e) => setCropSrc(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Receive auto-fitted image and upload to S3
  const handleImageReady = async (autoFittedDataUrl: string) => {
    setShowImageUpload(false);
    setCropSrc(null);
    setFormData(prev => ({ ...prev, photoPreview: autoFittedDataUrl, photoUrl: "" }));
    setUploading(true);
    try {
      // Generate unique filename: instructor-{id}-{timestamp}.jpg
      const timestamp = Date.now();
      const uniqueFileName = editingId
        ? `instructor-${editingId}-${timestamp}.jpg`
        : `instructor-new-${timestamp}.jpg`;

      const result = await uploadFileMutation.mutateAsync({
        fileBase64: autoFittedDataUrl,
        fileName: uniqueFileName,
        mimeType: "image/jpeg",
        folder: "instructors",
      });
      setFormData(prev => ({ ...prev, photoUrl: result.url }));
      toast.success('Foto subida correctamente');
    } catch (uploadErr: any) {
      toast.error(t("admin.events.errorUpload", { message: uploadErr.message }));
      setFormData(prev => ({ ...prev, photoPreview: "", photoUrl: "" }));
    } finally {
      setUploading(false);
    }
  };

  // Legacy alias kept for compatibility
  const handlePhotoUpload = handlePhotoSelect;

  const handleCreateOrUpdate = () => {
    if (!formData.name) {
      toast.error(t("admin.instructors.errorEnterName"));
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        name: formData.name,
        bio: formData.bio,
        instagramHandle: formData.instagramHandle,
        specialties: formData.specialties,
        photoUrl: formData.photoUrl,
      });
    } else {
      createMutation.mutate({
        name: formData.name,
        bio: formData.bio,
        instagramHandle: formData.instagramHandle,
        specialties: formData.specialties,
        photoUrl: formData.photoUrl,
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      bio: "",
      instagramHandle: "",
      specialties: "",
      photoFile: null,
      photoUrl: "",
      photoPreview: "",
    });
    setEditingId(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handleEdit = (instructor: any) => {
    setEditingId(instructor.id);
    setFormData({
      name: instructor.name,
      bio: instructor.bio || "",
      instagramHandle: instructor.instagramHandle || "",
      specialties: instructor.specialties || "",
      photoFile: null,
      photoUrl: instructor.photoUrl || "",
      photoPreview: instructor.photoUrl || "",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? t("admin.instructors.editInstructor") : t("admin.instructors.createInstructor")}</CardTitle>
          <CardDescription>Add or modify dance instructors with photos and specialties</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder={t("admin.instructors.name")}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              placeholder={t("admin.instructors.instagram")}
              value={formData.instagramHandle}
              onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
            />
          </div>

          <Textarea
            placeholder={t("admin.instructors.bio")}
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={3}
          />

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Specialties (comma-separated: Salsa, Bachata, Reggaeton, etc)
            </label>
            <Input
              placeholder={t("admin.instructors.specialtiesPlaceholder")}
              value={formData.specialties}
              onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
            />
          </div>

          {/* Photo Upload */}
          <div className="border-2 border-dashed border-accent/30 rounded-lg p-6">
            {formData.photoPreview ? (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={formData.photoPreview}
                    alt={t("admin.instructors.photoPreview")}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  {!formData.photoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                      <span className="text-white ml-2">{t("admin.buttons.uploading")}</span>
                    </div>
                  )}
                  {formData.photoUrl && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                      ✓ Uploaded
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={!formData.photoUrl}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Change Photo
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setFormData({ ...formData, photoFile: null, photoUrl: "", photoPreview: "" })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 text-accent/40" />
                <p className="text-foreground/60 mb-4">{t("admin.instructors.uploadPhoto")}</p>
                <Button
                  variant="outline"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Select Photo
                    </>
                  )}
                </Button>
              </div>
            )}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handlePhotoSelect(e.target.files[0]);
                  e.target.value = "";
                }
              }}
              className="hidden"
            />
          </div>

          {/* Instagram-Style Crop Selector - Drag square frame over fixed image */}
          <InstagramCropSelector
            open={showImageUpload && !!cropSrc}
            onClose={() => {
              setShowImageUpload(false);
              setCropSrc(null);
            }}
            onImageReady={handleImageReady}
            targetWidth={1080}
            targetHeight={1080}
            title="Recortar Foto del Profesor"
            description="Mueve y ajusta el cuadrado para seleccionar el área"
          />

          <div className="flex gap-2">
            <Button
              onClick={handleCreateOrUpdate}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="btn-vibrant flex-1"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingId ? t("admin.buttons.updating") : t("admin.buttons.creating")}
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {editingId ? t("admin.instructors.updateInstructor") : t("admin.instructors.createInstructorButton")}
                </>
              )}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={resetForm} className="flex-1">
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructors List */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.instructors.title")}</CardTitle>
          <CardDescription>{t("admin.instructors.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : instructors && instructors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {instructors.map((instructor) => (
                <div key={`${instructor.id}-${(instructor.updatedAt || instructor.createdAt)?.toString()}`} className="border border-border/50 rounded-lg p-4">
                  {instructor.photoUrl && (
                    <img
                      src={instructor.photoUrl}
                      alt={instructor.name}
                      className="w-full h-40 object-cover rounded-lg mb-4"
                      key={(instructor.updatedAt || instructor.createdAt)?.toString()}
                    />
                  )}
                  <h3 className="font-semibold text-foreground">{instructor.name}</h3>
                  <p className="text-sm text-foreground/60 mb-2" style={{ whiteSpace: "pre-line" }}>{instructor.bio}</p>
                  {instructor.instagramHandle && (
                    <p className="text-sm text-accent mb-2">@{instructor.instagramHandle}</p>
                  )}
                  {instructor.specialties && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {instructor.specialties.split(",").map((specialty: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-accent border-accent/50">
                          {specialty.trim()}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(instructor)}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => deleteMutation.mutate(instructor.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-foreground/60 text-center py-8">{t("admin.instructors.noInstructors")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ===== USERS/CRM TAB =====
function UsersTab() {
  const { t } = useTranslations();
  const { user: currentUser } = useAuth();
  const { data: usersList, isLoading, refetch } = trpc.admin.listUsers.useQuery();
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [editingRoles, setEditingRoles] = useState<{ userId: number; role: string } | null>(null);
  const [editingPlan, setEditingPlan] = useState<{ userId: number; plan: string } | null>(null);

  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success(t("admin.users.toastDeleted"));
      refetch();
      setConfirmDelete(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success(t("admin.users.toastRoleUpdated"));
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updatePlanMutation = trpc.admin.updateUserPlan.useMutation({
    onSuccess: () => {
      toast.success("Subscription plan updated successfully");
      refetch();
      setEditingPlan(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const [onlyUnverified, setOnlyUnverified] = useState(false);

  const filteredUsers = (usersList?.filter((u: any) =>
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []).filter((u: any) => {
    if (!onlyUnverified) return true;
    const roles = Array.isArray(u.rolesArray) ? u.rolesArray : [u.role];
    const canEarn = roles.some((r: string) => r === "instructor" || r === "promoter" || r === "rrp");
    return canEarn && u.stripeAccountStatus !== "verified";
  });

  const roleColors: Record<string, string> = {
    admin: "bg-red-500/20 text-red-400 border-red-500/50",
    instructor: "bg-purple-500/20 text-purple-400 border-purple-500/50",
    user: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Management
        </CardTitle>
        <CardDescription>{t("admin.users.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 items-center flex-wrap">
          <Input
            placeholder={t("admin.users.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[200px]"
          />
          <label className="flex items-center gap-2 text-sm text-foreground/70 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyUnverified}
              onChange={(e) => setOnlyUnverified(e.target.checked)}
              className="w-4 h-4"
            />
            Solo creadores sin Stripe verificado
          </label>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 font-semibold">Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Email</th>
                  <th className="text-left py-3 px-4 font-semibold">Role</th>
                  <th className="text-left py-3 px-4 font-semibold">Plan</th>
                  <th className="text-left py-3 px-4 font-semibold">Stripe</th>
                  <th className="text-left py-3 px-4 font-semibold">Method</th>
                  <th className="text-left py-3 px-4 font-semibold">Registered</th>
                  <th className="text-left py-3 px-4 font-semibold">Last Access</th>
                  <th className="text-center py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-border/30 hover:bg-card/50">
                    <td className="py-3 px-4 font-medium">{u.name || "—"}</td>
                    <td className="py-3 px-4 text-accent">{u.email || "—"}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Select
                          value={editingRoles?.userId === u.id ? editingRoles.role : u.role}
                          onValueChange={(newRole) => {
                            setEditingRoles({ userId: u.id, role: newRole });
                          }}
                        >
                          <SelectTrigger className="w-[120px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">
                              <span className="flex items-center gap-2">👤 Usuario</span>
                            </SelectItem>
                            <SelectItem value="instructor">
                              <span className="flex items-center gap-2">🎓 Instructor</span>
                            </SelectItem>
                            <SelectItem value="promoter">
                              <span className="flex items-center gap-2">📣 Promotor</span>
                            </SelectItem>
                            <SelectItem value="rrp">
                              <span className="flex items-center gap-2">📢 RRP</span>
                            </SelectItem>
                            <SelectItem value="admin">
                              <span className="flex items-center gap-2">🛡️ Admin</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {editingRoles?.userId === u.id && editingRoles.role !== u.role && (
                          <Button
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => {
                              updateRoleMutation.mutate({
                                id: u.id,
                                role: editingRoles.role as "user" | "instructor" | "promoter" | "admin" | "rrp",
                              });
                              setEditingRoles(null);
                            }}
                            disabled={updateRoleMutation.isPending}
                          >
                            {updateRoleMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Select
                          value={editingPlan?.userId === u.id ? editingPlan.plan : (u.subscriptionPlan || "starter")}
                          onValueChange={(newPlan) => {
                            setEditingPlan({ userId: u.id, plan: newPlan });
                          }}
                        >
                          <SelectTrigger className="w-[140px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="starter">
                              <span className="flex items-center gap-2">🆓 Starter</span>
                            </SelectItem>
                            <SelectItem value="creator">
                              <span className="flex items-center gap-2">⭐ Creator</span>
                            </SelectItem>
                            <SelectItem value="promoter_plan">
                              <span className="flex items-center gap-2">🎯 Promoter</span>
                            </SelectItem>
                            <SelectItem value="academy">
                              <span className="flex items-center gap-2">🏆 Academy</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {editingPlan?.userId === u.id && editingPlan.plan !== (u.subscriptionPlan || "starter") && (
                          <Button
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => {
                              updatePlanMutation.mutate({
                                id: u.id,
                                plan: editingPlan.plan as "starter" | "creator" | "promoter_plan" | "academy",
                              });
                            }}
                            disabled={updatePlanMutation.isPending}
                          >
                            {updatePlanMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {(() => {
                        const st = (u as any).stripeAccountStatus as string | undefined;
                        if (st === "verified") return <Badge className="bg-green-500/15 text-green-500 border-green-500/30 text-xs">✓ Verificado</Badge>;
                        if (st === "pending") return <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 text-xs">⏳ Pendiente</Badge>;
                        if (st === "restricted") return <Badge className="bg-red-500/15 text-red-500 border-red-500/30 text-xs">⚠️ Acción</Badge>;
                        return <Badge variant="outline" className="text-xs bg-foreground/5 text-foreground/40">Sin conectar</Badge>;
                      })()}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-xs">
                        {u.loginMethod === "custom" ? t("admin.users.loginMethodEmail") : t("admin.users.loginMethodOauth")}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-foreground/60 text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-foreground/60 text-xs">
                      {new Date(u.lastSignedIn).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {u.id === currentUser?.id ? (
                        <Badge variant="outline" className="text-xs">You</Badge>
                      ) : confirmDelete === u.id ? (
                        <div className="flex items-center gap-1 justify-center">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 text-xs"
                            onClick={() => deleteUserMutation.mutate({ id: u.id })}
                            disabled={deleteUserMutation.isPending}
                          >
                            {deleteUserMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirmar"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => setConfirmDelete(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setConfirmDelete(u.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-foreground/60 text-center py-8">
            {searchTerm ? "No users found matching your search." : "No registered users yet."}
          </p>
        )}

        <div className="pt-4 border-t border-border/50 flex items-center justify-between text-sm text-foreground/60">
          <p>Total usuarios: <span className="font-semibold text-foreground">{usersList?.length || 0}</span></p>
          <div className="flex gap-3">
            <span>👤 Usuarios: {usersList?.filter(u => u.role === "user").length || 0}</span>
            <span>🎓 Instructores: {usersList?.filter(u => u.role === "instructor").length || 0}</span>
            <span>📣 Promotores: {usersList?.filter(u => u.role === "promoter").length || 0}</span>
            <span>🛡️ Admins: {usersList?.filter(u => u.role === "admin").length || 0}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== ORDERS TAB =====
function OrdersTab() {
  const { t } = useTranslations();
  const { data: allOrders, isLoading } = trpc.admin.getAllOrders.useQuery();
  const [search, setSearch] = useState("");

  const filtered = (allOrders || []).filter((o) => {
    const q = search.toLowerCase();
    return (
      (o.userName || "").toLowerCase().includes(q) ||
      (o.userEmail || "").toLowerCase().includes(q) ||
      (o.itemTitle || "").toLowerCase().includes(q) ||
      o.itemType.toLowerCase().includes(q)
    );
  });

  const typeColor: Record<string, string> = {
    event: "bg-pink-500/20 text-pink-400 border-pink-500/50",
    course: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    class: "bg-purple-500/20 text-purple-400 border-purple-500/50",
  };

  const totalRevenue = (allOrders || [])
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + parseFloat(String(o.amount) || "0"), 0);

  return (
    <Card className="border-accent/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-accent" />
          All Orders
        </CardTitle>
        <CardDescription>
          All completed purchases — events, courses, and classes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card/50 border border-border/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-accent">{allOrders?.length || 0}</p>
            <p className="text-xs text-foreground/60 mt-1">{t("admin.orders.totalOrders")}</p>
          </div>
          <div className="bg-card/50 border border-border/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-400">£{totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-foreground/60 mt-1">{t("admin.orders.totalRevenue")}</p>
          </div>
          <div className="bg-card/50 border border-border/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">
              {new Set((allOrders || []).map((o) => o.userId)).size}
            </p>
            <p className="text-xs text-foreground/60 mt-1">{t("admin.orders.uniqueBuyers")}</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <Input
            placeholder={t("admin.orders.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-foreground/60 text-center py-8">{t("admin.orders.noOrders")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-foreground/60">
                  <th className="text-left py-3 px-2">ID</th>
                  <th className="text-left py-3 px-2">Customer</th>
                  <th className="text-left py-3 px-2">Item</th>
                  <th className="text-left py-3 px-2">Type</th>
                  <th className="text-left py-3 px-2">Amount</th>
                  <th className="text-left py-3 px-2">Status</th>
                  <th className="text-left py-3 px-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className="border-b border-border/30 hover:bg-card/50 transition-colors">
                    <td className="py-3 px-2 font-mono text-xs text-foreground/50">#{order.id}</td>
                    <td className="py-3 px-2">
                      <div className="font-medium">{order.userName}</div>
                      <div className="text-xs text-foreground/50">{order.userEmail}</div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="font-medium">{order.itemTitle || `ID: ${order.itemId}`}</span>
                    </td>
                    <td className="py-3 px-2">
                      <Badge className={typeColor[order.itemType] || ""} variant="outline">
                        {order.itemType}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 font-semibold text-green-400">
                      £{parseFloat(String(order.amount)).toFixed(2)}
                    </td>
                    <td className="py-3 px-2">
                      <Badge
                        className={
                          order.status === "completed"
                            ? "bg-green-500/20 text-green-400 border-green-500/50"
                            : "bg-red-500/20 text-red-400 border-red-500/50"
                        }
                        variant="outline"
                      >
                        {order.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-foreground/60 text-xs">
                      {new Date(order.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


// ===== SETTINGS TAB =====
function SettingsTab() {
  const { t } = useTranslations();
  const [syncResult, setSyncResult] = useState<null | {
    results: Array<{
      plan: string;
      productId: string;
      monthlyPriceId: string;
      yearlyPriceId: string;
      monthlyAmount: number;
      yearlyAmount: number;
    }>;
    envVars: Record<string, string>;
    instructions: string;
  }>(null);
  const [copied, setCopied] = useState(false);

  const { data: productStatus, isLoading: statusLoading, refetch: refetchStatus } =
    trpc.stripeSync.getProductStatus.useQuery();

  const syncMutation = trpc.stripeSync.syncProducts.useMutation({
    onSuccess: (data) => {
      setSyncResult(data);
      refetchStatus();
      toast.success(t("admin.settings.stripeToastSuccess"));
    },
    onError: (err) => {
      toast.error(t("admin.settings.stripeToastError", { message: err.message }));
    },
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(t("admin.settings.stripeToastCopied"));
  };

  return (
    <div className="space-y-6">
      {/* Stripe Products Sync */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Stripe Subscription Products
          </CardTitle>
          <CardDescription>
            Auto-create or update Stripe products and prices for all subscription plans.
            After syncing, copy the env vars and add them in{" "}
            <a href="#" className="text-primary underline">Settings → Secrets</a>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          {statusLoading ? (
            <div className="flex items-center gap-2 text-foreground/60">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking Stripe configuration...
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground/80">{t("admin.settings.stripeCurrentConfig")}</h3>
              <div className="grid gap-2">
                {productStatus?.map((p) => (
                  <div key={p.plan} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/50">
                    <div>
                      <span className="font-medium text-sm">{p.name}</span>
                      <span className="ml-2 text-xs text-foreground/50">{p.plan}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs">
                        {p.monthlyConfigured ? (
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
                        )}
                        <span className={p.monthlyConfigured ? "text-green-400" : "text-yellow-400"}>
                          Monthly
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        {p.yearlyConfigured ? (
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
                        )}
                        <span className={p.yearlyConfigured ? "text-green-400" : "text-yellow-400"}>
                          Yearly
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sync Button */}
          <Button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="btn-vibrant gap-2"
          >
            {syncMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {syncMutation.isPending ? t("admin.settings.stripeSyncing") : t("admin.settings.stripeSyncButton")}
          </Button>

          {/* Results */}
          {syncResult && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Sync complete! {syncResult.results.length} plans synced.</span>
              </div>

              {/* Plan results */}
              <div className="grid gap-3">
                {syncResult.results.map((r) => (
                  <div key={r.plan} className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="font-medium text-sm text-green-300 mb-2">{r.plan}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-foreground/70">
                      <div>
                        <span className="text-foreground/50">Monthly:</span>{" "}
                        <code className="text-primary">{r.monthlyPriceId}</code>
                        <span className="text-foreground/50 ml-1">(£{(r.monthlyAmount / 100).toFixed(2)}/mo)</span>
                      </div>
                      <div>
                        <span className="text-foreground/50">Yearly:</span>{" "}
                        <code className="text-primary">{r.yearlyPriceId}</code>
                        <span className="text-foreground/50 ml-1">(£{(r.yearlyAmount / 100).toFixed(2)}/yr)</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Env vars to copy */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Environment Variables to Add</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-xs"
                    onClick={() =>
                      handleCopy(
                        Object.entries(syncResult.envVars)
                          .map(([k, v]) => `${k}=${v}`)
                          .join("\n")
                      )
                    }
                  >
                    {copied ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? t("admin.settings.stripeCopied") : t("admin.settings.stripeCopyAll")}
                  </Button>
                </div>
                <div className="p-3 rounded-lg bg-black/40 border border-border/50 font-mono text-xs space-y-1">
                  {Object.entries(syncResult.envVars).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between group">
                      <span>
                        <span className="text-yellow-400">{k}</span>
                        <span className="text-foreground/50">=</span>
                        <span className="text-green-400">{v}</span>
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                        onClick={() => handleCopy(`${k}=${v}`)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-foreground/50">
                  Add these in{" "}
                  <strong>Settings → Secrets</strong> in the Management UI, then restart the server for them to take effect.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-primary" />
            Quick Links
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <a href="/pricing" target="_blank">
            <Button variant="outline" className="w-full gap-2 justify-start">
              <ExternalLink className="h-4 w-4" />
              View Pricing Page
            </Button>
          </a>
          <a href="/billing" target="_blank">
            <Button variant="outline" className="w-full gap-2 justify-start">
              <ExternalLink className="h-4 w-4" />
              View Billing Page
            </Button>
          </a>
          <a href="/email-marketing" target="_blank">
            <Button variant="outline" className="w-full gap-2 justify-start">
              <Mail className="h-4 w-4" />
              Email Marketing
            </Button>
          </a>
          <a href="/crm" target="_blank">
            <Button variant="outline" className="w-full gap-2 justify-start">
              <Users className="h-4 w-4" />
              CRM Dashboard
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

// ===== INSTRUCTOR/PROMOTER PROFILE TAB =====
function InstructorProfileTab() {
  const { t } = useTranslations();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: profile, isLoading } = trpc.instructors.getMyProfile.useQuery();
  const uploadFileMutation = trpc.uploads.uploadFile.useMutation();
  const updateProfileMutation = trpc.instructors.updateMyProfile.useMutation({
    onSuccess: async () => {
      toast.success(t("admin.profile.toastUpdated"));
      // Invalidate and refetch the profile to get updated data
      await utils.instructors.getMyProfile.invalidate();
      // Don't clear photoPreview here - let it update from the refetched profile
    },
    onError: (err) => toast.error(err.message),
  });

  const [form, setForm] = useState({
    name: "",
    bio: "",
    photoUrl: "",
    instagramHandle: "",
    websiteUrl: "",
    specialties: "",
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      logger.debug('[AdminDashboard] Profile loaded', {
        name: profile.name,
        hasPhoto: !!profile.photoUrl
      });
      setForm({
        name: profile.name || "",
        bio: profile.bio || "",
        photoUrl: profile.photoUrl || "",
        instagramHandle: profile.instagramHandle || "",
        websiteUrl: (profile as any).websiteUrl || "",
        specialties: profile.specialties || "",
      });
      // Always update preview when profile loads with a photo
      if (profile.photoUrl) {
        setPhotoPreview(profile.photoUrl);
      }
    } else if (user?.name) {
      setForm((f) => ({ ...f, name: user.name || "" }));
    }
  }, [profile, user]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCropSrc(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedDataUrl: string) => {
    setCropSrc(null);
    setUploading(true);
    try {
      // Generate unique filename: instructor-{userId}-{timestamp}.jpg
      const timestamp = Date.now();
      const uniqueFileName = `instructor-${user?.id || 'unknown'}-${timestamp}.jpg`;

      const result = await uploadFileMutation.mutateAsync({
        fileBase64: croppedDataUrl,
        fileName: uniqueFileName,
        mimeType: "image/jpeg",
        folder: "instructors",
      });
      logger.info('[AdminDashboard] Photo uploaded successfully', { url: result.url });
      setForm((f) => ({ ...f, photoUrl: result.url }));
      setPhotoPreview(result.url);
      toast.success(t("admin.profile.toastPhotoUploaded"));
    } catch (err: any) {
      logger.error('[AdminDashboard] Photo upload failed', err);
      toast.error(t("admin.profile.errorUploadFailed", { message: err.message }));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logger.debug('[AdminDashboard] Submitting profile update', {
      name: form.name,
      hasPhoto: !!form.photoUrl,
      hasBio: !!form.bio
    });
    updateProfileMutation.mutate({
      name: form.name,
      bio: form.bio || undefined,
      photoUrl: form.photoUrl || undefined,
      instagramHandle: form.instagramHandle || undefined,
      websiteUrl: form.websiteUrl || undefined,
      specialties: form.specialties || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5 text-accent" />
            My Instructor Profile
          </CardTitle>
          <CardDescription>
            This profile is shown publicly on your instructor page and promoter profile.
            {!profile && (
              <span className="block mt-1 text-yellow-400 text-xs">
                ⚠️ No profile found yet — fill in the form below to create yours.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Photo */}
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted border border-border/50 flex-shrink-0">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-foreground/30">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? t("admin.buttons.uploading") : t("admin.profile.uploadPhoto")}
                </Button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                <p className="text-xs text-foreground/40 mt-1">{t("admin.profile.imageFormats")}</p>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="text-sm font-medium mb-1 block">{t("admin.profile.displayName")}</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={t("admin.profile.displayNamePlaceholder")}
                required
              />
            </div>

            {/* Bio */}
            <div>
              <label className="text-sm font-medium mb-1 block">{t("admin.profile.bio")}</label>
              <Textarea
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder={t("admin.profile.bioPlaceholder")}
                rows={4}
              />
            </div>

            {/* Specialties */}
            <div>
              <label className="text-sm font-medium mb-1 block">{t("admin.profile.specialties")}</label>
              <Input
                value={form.specialties}
                onChange={(e) => setForm((f) => ({ ...f, specialties: e.target.value }))}
                placeholder={t("admin.profile.specialtiesPlaceholder")}
              />
              <p className="text-xs text-foreground/40 mt-1">{t("admin.profile.specialtiesHelp")}</p>
            </div>

            {/* Instagram */}
            <div>
              <label className="text-sm font-medium mb-1 block">{t("admin.profile.instagram")}</label>
              <div className="flex items-center gap-2">
                <span className="text-foreground/50 text-sm">@</span>
                <Input
                  value={form.instagramHandle}
                  onChange={(e) => setForm((f) => ({ ...f, instagramHandle: e.target.value.replace("@", "") }))}
                  placeholder={t("admin.profile.instagramPlaceholder")}
                />
              </div>
            </div>

            {/* Website */}
            <div>
              <label className="text-sm font-medium mb-1 block">{t("admin.profile.website")}</label>
              <Input
                value={form.websiteUrl}
                onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))}
                placeholder={t("admin.profile.websitePlaceholder")}
                type="url"
              />
            </div>

            <Button
              type="submit"
              className="btn-vibrant w-full"
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
              ) : (
                <><CheckCircle className="h-4 w-4 mr-2" /> Save Profile</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Preview link */}
      {profile && (
        <Card className="bg-card/30 border-border/30">
          <CardContent className="pt-4">
            <p className="text-sm text-foreground/60 mb-3">{t("admin.profile.publicProfileText")}</p>
            <a href={`/promoters/${profile.id}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                View Public Profile
              </Button>
            </a>
          </CardContent>
        </Card>
      )}

      {cropSrc && (
        <ImageCropperModal
          imageSrc={cropSrc}
          aspect={1}
          label={t("admin.profile.cropPhoto")}
          onCropComplete={handleCropComplete}
          onClose={() => setCropSrc(null)}
        />
      )}
    </div>
  );
}
