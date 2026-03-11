import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, BookOpen, Calendar, MapPin, Play, GraduationCap, FileText
} from "lucide-react";
import { toast } from "sonner";

// ─── Invoice Download Button ─────────────────────────────────────────────────
export function InvoiceDownloadButton({ orderId }: { orderId: number }) {
  const [loading, setLoading] = useState(false);
  const downloadMutation = trpc.payments.downloadInvoice.useMutation({
    onSuccess: (data) => {
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

// ─── Shared UI ────────────────────────────────────────────────────────────────
export function LoadingState() {
  return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
    </div>
  );
}

export function EmptyState({ icon, gradientFrom, gradientTo, title, description, linkHref, linkText, linkIcon }: {
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

// ─── Courses Tab ──────────────────────────────────────────────────────────────
export function UserCoursesTab() {
  const { data: purchases, isLoading } = trpc.payments.getUserCourses.useQuery();

  if (isLoading) return <LoadingState />;

  if (!purchases || purchases.length === 0) {
    return (
      <EmptyState
        icon={<GraduationCap className="h-10 w-10 text-blue-400/60" />}
        gradientFrom="from-blue-500/20"
        gradientTo="to-purple-500/20"
        title="No hay cursos aún"
        description="Inscríbete en nuestros cursos de baile online y obtén acceso a videos exclusivos de instructores profesionales."
        linkHref="/courses"
        linkText="Explorar Cursos"
        linkIcon={<BookOpen className="h-4 w-4 mr-2" />}
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
      {purchases.map((purchase) => (
        <Card key={purchase.id} className="border-border/50 hover:border-accent/30 transition-colors">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{purchase.course?.title || "Course"}</h3>
                {purchase.course?.danceStyle && (
                  <Badge variant="outline" className="mt-1 text-xs">{purchase.course.danceStyle}</Badge>
                )}
              </div>
              <Badge className={purchase.completed ? "bg-green-500/20 text-green-400" : "bg-accent/20 text-accent"}>
                {purchase.completed ? "Completado" : `${purchase.progress || 0}%`}
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
                {purchase.progress && purchase.progress > 0 ? "Continuar Viendo" : "Empezar Curso"}
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
