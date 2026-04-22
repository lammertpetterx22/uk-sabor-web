import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
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
  PartyPopper,
  GraduationCap
} from "lucide-react";
import { useTranslations } from "@/hooks/useTranslations";
import { useTr } from "@/components/Trans";

interface MyClassesDashboardProps {
  classes: any[];
  isLoadingClasses: boolean;
  onRefresh: () => void;
  isAdmin: boolean;
  instructors: any[];
  myInstructorProfile?: any;
  autoOpenCreate?: boolean;
  onAutoOpenHandled?: () => void;
}

export default function MyClassesDashboard({
  classes,
  isLoadingClasses,
  onRefresh,
  isAdmin,
  instructors,
  myInstructorProfile,
  autoOpenCreate,
  onAutoOpenHandled,
}: MyClassesDashboardProps) {
  const { t } = useTranslations();
  const { tr } = useTr();
  const utils = trpc.useUtils();

  const [showClassDialog, setShowClassDialog] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [expandedClassId, setExpandedClassId] = useState<number | null>(null);

  useEffect(() => {
    if (autoOpenCreate) {
      setEditingClass(null);
      setShowClassDialog(true);
      onAutoOpenHandled?.();
    }
  }, [autoOpenCreate, onAutoOpenHandled]);

  // Mutations
  const updateMutation = trpc.classes.update.useMutation({
    onSuccess: () => {
      toast.success("✅ Class updated successfully");
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
      toast.success("🗑️ Class deleted successfully");
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

  const handleCreateClass = () => {
    setEditingClass(null);
    setShowClassDialog(true);
  };

  const handleEditClass = (cls: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingClass(cls);
    setShowClassDialog(true);
  };

  const handleDeleteClass = (classId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDeleteId === classId) {
      deleteMutation.mutate(classId);
    } else {
      setConfirmDeleteId(classId);
    }
  };

  const handleTogglePublish = (cls: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = cls.status === "published" ? "draft" : "published";
    updateMutation.mutate({
      id: cls.id,
      status: newStatus,
    });
  };

  const handleDownloadQR = (cls: any) => {
    if (!classQRCodes?.qrData) return;
    const link = document.createElement("a");
    link.href = classQRCodes.qrData;
    link.download = `qr-class-${cls.id}.png`;
    link.click();
  };

  const handleToggleExpanded = (classId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedClassId(expandedClassId === classId ? null : classId);
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

  const getLevelColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-green-500/10 text-green-600 border-green-500/30";
      case "intermediate":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/30";
      case "advanced":
        return "bg-red-500/10 text-red-600 border-red-500/30";
      default:
        return "bg-blue-500/10 text-blue-600 border-blue-500/30";
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case "beginner":
        return "Beginner";
      case "intermediate":
        return "Intermediate";
      case "advanced":
        return "Advanced";
      default:
        return "All";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header - mismo style que MyCoursesDashboard */}
      <Card className="border-border/50 bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
                <GraduationCap className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <CardTitle className="text-2xl gradient-text">My Classes</CardTitle>
                <CardDescription>
                  Manage your classes and schedule
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={handleCreateClass}
              className="btn-vibrant"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Class
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Classes Grid - mismo style que MyCoursesDashboard */}
      {isLoadingClasses ? (
        <div className="flex justify-center py-16">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-accent mx-auto mb-4" />
            <p className="text-foreground/60">{tr("Loading classes...")}</p>
          </div>
        </div>
      ) : classes && classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <Card
              key={cls.id}
              className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-accent/50 transition-all courser-pointer group overflow-hidden"
              onClick={() => handleToggleExpanded(cls.id, {} as React.MouseEvent)}
            >
              {/* Class Image */}
              {cls.imageUrl && (
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={cls.imageUrl}
                    alt={cls.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <Badge className="bg-black/50 backdrop-blur-sm border-0 text-white">
                      {cls.status === "published" ? (
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
                    {cls.title}
                  </h3>
                  {cls.description && (
                    <p className="text-sm text-foreground/60 mt-1 line-clamp-2">
                      {cls.description}
                    </p>
                  )}
                </div>

                {/* Status badge if no image */}
                {!cls.imageUrl && (
                  <Badge className="bg-black/10 backdrop-blur-sm">
                    {cls.status === "published" ? (
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
                )}

                {/* Dance Style and Level Badges */}
                <div className="flex flex-wrap gap-2">
                  {cls.danceStyle && (
                    <Badge variant="outline" className="text-xs">
                      <Music className="h-3 w-3 mr-1" />
                      {cls.danceStyle}
                    </Badge>
                  )}
                  <Badge variant="outline" className={`text-xs ${getLevelColor(cls.level)}`}>
                    <Award className="h-3 w-3 mr-1" />
                    {getLevelLabel(cls.level)}
                  </Badge>
                  {cls.hasSocial && (
                    <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/30">
                      <PartyPopper className="h-3 w-3 mr-1" />
                      Social
                    </Badge>
                  )}
                </div>

                <Separator className="bg-border/50" />

                {/* Class Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-foreground/80">
                    <Calendar className="h-4 w-4 text-accent flex-shrink-0" />
                    <span className="text-xs capitalize line-clamp-1">
                      {formatDate(cls.classDate)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-foreground/80">
                      <DollarSign className="h-4 w-4 text-accent" />
                      <span className="text-xs font-medium">${cls.price}</span>
                    </div>
                    {cls.duration && (
                      <div className="flex items-center gap-2 text-foreground/80">
                        <Clock className="h-4 w-4 text-accent" />
                        <span className="text-xs">{cls.duration}min</span>
                      </div>
                    )}
                  </div>

                  {cls.maxParticipants && (
                    <div className="flex items-center gap-2 text-foreground/80">
                      <Users className="h-4 w-4 text-accent" />
                      <span className="text-xs">{cls.maxParticipants} participbefore</span>
                    </div>
                  )}

                  {/* Instructor info */}
                  {cls.instructor && (
                    <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-accent/20 to-purple-500/20 flex items-center justify-center">
                        <span className="text-xs font-semibold text-accent">
                          {cls.instructor.name.charAt(0)}
                        </span>
                      </div>
                      <span className="text-xs text-foreground/70">{cls.instructor.name}</span>
                    </div>
                  )}
                </div>

                <Separator className="bg-border/50" />

                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleEditClass(cls, e)}
                    className="flex-1 text-xs"
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleTogglePublish(cls, e)}
                    className="flex-1 text-xs"
                  >
                    {cls.status === "published" ? (
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
                    onClick={(e) => handleToggleExpanded(cls.id, e)}
                    className="flex-1 text-xs"
                  >
                    <QrCode className="h-3 w-3 mr-1" />
                    {expandedClassId === cls.id ? "Hide QR" : "Ver QR"}
                  </Button>
                  <Button
                    variant={confirmDeleteId === cls.id ? "destructive" : "outline"}
                    size="sm"
                    onClick={(e) => handleDeleteClass(cls.id, e)}
                    className="text-xs"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    {confirmDeleteId === cls.id ? "Confirm" : "Delete"}
                  </Button>
                </div>

                {/* QR Code Section (expandable) */}
                {expandedClassId === cls.id && classQRCodes && (
                  <div className="pt-3 border-t space-y-3 animate-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-xs">Code QR</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadQR(cls);
                        }}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                    {classQRCodes.qrData && (
                      <div className="flex justify-center p-4 bg-muted rounded-lg">
                        <img
                          src={classQRCodes.qrData}
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
              <GraduationCap className="h-12 w-12 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No classes yet</h3>
            <p className="text-foreground/60 mb-6 max-w-sm">
              Start by creating your first class para ofrecer tus enseñanzas
            </p>
            <Button onClick={handleCreateClass} className="btn-vibrant">
              <Plus className="h-4 w-4 mr-2" />
              Create First Class
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Class Dialog */}
      <Dialog open={showClassDialog} onOpenChange={setShowClassDialog}>
        <DialogContent className="!max-w-5xl w-[95vw] max-h-[90vh] p-0 gap-0 rounded-2xl border border-white/10 shadow-2xl shadow-black/50 bg-gradient-to-br from-background via-background to-background/95 backdrop-blur-xl overflow-hidden">
          <div className="overflow-y-auto overflow-x-hidden max-h-[90vh]">
            <DialogHeader className="sticky top-0 z-10 px-6 md:px-10 py-5 border-b border-white/10 bg-background/80 backdrop-blur-xl text-left">
              <DialogTitle className="text-2xl md:text-3xl font-bold">
                {editingClass ? "Edit Class" : "Create New Class"}
              </DialogTitle>
              <DialogDescription className="text-foreground/60">
                {editingClass
                  ? "Update class information"
                  : "Complete the details to create a new class"}
              </DialogDescription>
            </DialogHeader>
            <div className="px-6 md:px-10 py-8">
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
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
