import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, QrCode, Users, Calendar, Clock, Download, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import QRScanner from "@/components/QRScanner";

// CSV export helper
function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    toast.error("No attendance data to export");
    return;
  }
  const headers = ["Name", "Email", "Check-in Time"];
  const rows = data.map((r) => [
    r.userName || "Desconocido",
    r.userEmail || "",
    r.checkedInAt ? new Date(r.checkedInAt).toLocaleString("en-GB") : "",
  ]);
  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  toast.success(`Exported ${data.length} records`);
}

export default function AttendanceDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("events");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerType, setScannerType] = useState<"event" | "class">("event");
  const [scannerId, setScannerId] = useState<number | null>(null);
  const [scannerTitle, setScannerTitle] = useState("");
  const [lastScanResult, setLastScanResult] = useState<{ userName: string; itemTitle: string } | null>(null);

  const utils = trpc.useUtils();
  const isAuthorized = user?.role === "admin" || user?.role === "instructor" || user?.role === "promoter";

  // Hook MUST be before any conditional return (React rules of hooks)
  const checkInMutation = trpc.qrcode.checkIn.useMutation();

  if (!isAuthenticated || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="text-destructive" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/80">Only instructors, promoters, and admins can access the attendance panel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCheckIn = async (qrCode: string) => {
    const result = await checkInMutation.mutateAsync({ qrCode });
    // Invalidate attendance queries so lists refresh automatically
    await utils.qrcode.getAttendance.invalidate();
    await utils.qrcode.getAttendanceCount.invalidate();
    setLastScanResult({ userName: result.userName, itemTitle: result.itemTitle || "" });
    return { attendeeName: result.userName, eventTitle: result.itemTitle };
  };

  const openScanner = (type: "event" | "class", id: number, title: string) => {
    setScannerType(type);
    setScannerId(id);
    setScannerTitle(title);
    setScannerOpen(true);
    setLastScanResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-text">Attendance Panel</h1>
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
            {user?.role === "admin" ? "Admin" : user?.role === "promoter" ? "Promoter" : "Instructor"}
          </Badge>
        </div>
      </div>

      <div className="container py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
          </TabsList>

          <TabsContent value="events">
            <EventsAttendanceTab onOpenScanner={openScanner} />
          </TabsContent>

          <TabsContent value="classes">
            <ClassesAttendanceTab onOpenScanner={openScanner} />
          </TabsContent>
        </Tabs>
      </div>

      <QRScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleCheckIn}
        title={`Check-In: ${scannerTitle}`}
        description="Point the camera at the attendee's QR code"
      />
    </div>
  );
}

function EventsAttendanceTab({ onOpenScanner }: { onOpenScanner: (type: "event" | "class", id: number, title: string) => void }) {
  const { data: events, isLoading } = trpc.events.list.useQuery({ limit: 100, offset: 0 });

  if (isLoading) return <div className="text-center py-8 text-foreground/50">Loading...</div>;
  if (!events || events.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-foreground/60">No events found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {events.map((event) => (
        <EventAttendanceCard key={event.id} event={event} onOpenScanner={() => onOpenScanner("event", event.id, event.title)} />
      ))}
    </div>
  );
}

function ClassesAttendanceTab({ onOpenScanner }: { onOpenScanner: (type: "event" | "class", id: number, title: string) => void }) {
  const { data: classes, isLoading } = trpc.classes.list.useQuery({ limit: 100, offset: 0 });

  if (isLoading) return <div className="text-center py-8 text-foreground/50">Loading...</div>;
  if (!classes || classes.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-foreground/60">No classes found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {classes.map((cls) => (
        <ClassAttendanceCard key={cls.id} cls={cls} onOpenScanner={() => onOpenScanner("class", cls.id, cls.title)} />
      ))}
    </div>
  );
}

// Inline attendee list shown directly on the card (no dialog needed)
function AttendeeList({ itemType, itemId, title }: { itemType: "event" | "class"; itemId: number; title: string }) {
  const { data: records, isLoading, refetch } = trpc.qrcode.getAttendance.useQuery(
    { itemType, itemId },
    { refetchInterval: 10000 } // auto-refresh every 10 seconds
  );

  return (
    <div className="mt-4 pt-4 border-t border-border/30">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Users className="h-4 w-4 text-accent" />
          Check-ins ({isLoading ? "..." : records?.length || 0})
        </h4>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={() => exportToCSV(records || [], `attendance-${title.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.csv`)}
            disabled={!records || records.length === 0}
          >
            <Download className="h-3 w-3 mr-1" />
            CSV
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-xs text-foreground/40 py-2 text-center">Loading...</div>
      ) : !records || records.length === 0 ? (
        <div className="text-xs text-foreground/40 py-4 text-center flex flex-col items-center gap-1">
          <Users className="h-6 w-6 text-foreground/20" />
          No check-ins yet
        </div>
      ) : (
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {records.map((r: any, i: number) => (
            <div key={r.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-foreground/5 hover:bg-foreground/8 transition-colors">
              <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-green-500">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{r.userName || "Unknown"}</p>
                {r.userEmail && <p className="text-xs text-foreground/50 truncate">{r.userEmail}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-medium text-green-500">
                  {r.checkedInAt ? new Date(r.checkedInAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : ""}
                </p>
                <p className="text-xs text-foreground/30">
                  {r.checkedInAt ? new Date(r.checkedInAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}
                </p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EventAttendanceCard({ event, onOpenScanner }: { event: any; onOpenScanner: () => void }) {
  const [showList, setShowList] = useState(false);
  const { data: count } = trpc.qrcode.getAttendanceCount.useQuery(
    { itemType: "event", itemId: event.id },
    { refetchInterval: 10000 }
  );
  const eventDate = new Date(event.eventDate);
  const isUpcoming = eventDate > new Date();

  return (
    <Card className="hover:border-accent/30 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base truncate">{event.title}</CardTitle>
            <CardDescription className="flex items-center gap-1.5 mt-1">
              <Calendar className="h-3.5 w-3.5" />
              {eventDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} at {eventDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </CardDescription>
          </div>
          <Badge variant={isUpcoming ? "default" : "secondary"} className="flex-shrink-0">
            {isUpcoming ? "Upcoming" : "Past"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-500">{count || 0}</p>
              <p className="text-xs text-foreground/50">check-ins</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => setShowList(!showList)}
          >
            <Users className="h-3.5 w-3.5 mr-1" />
            {showList ? "Hide list" : "View list"}
          </Button>
        </div>

        <Button onClick={onOpenScanner} className="btn-vibrant w-full">
          <QrCode className="h-4 w-4 mr-2" />
          Scan Attendee QR
        </Button>

        {showList && (
          <AttendeeList itemType="event" itemId={event.id} title={event.title} />
        )}
      </CardContent>
    </Card>
  );
}

function ClassAttendanceCard({ cls, onOpenScanner }: { cls: any; onOpenScanner: () => void }) {
  const [showList, setShowList] = useState(false);
  const { data: count } = trpc.qrcode.getAttendanceCount.useQuery(
    { itemType: "class", itemId: cls.id },
    { refetchInterval: 10000 }
  );
  const classDate = new Date(cls.classDate);
  const isUpcoming = classDate > new Date();

  return (
    <Card className="hover:border-accent/30 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base truncate">{cls.title}</CardTitle>
            <CardDescription className="flex items-center gap-1.5 mt-1">
              <Calendar className="h-3.5 w-3.5" />
              {classDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} at {classDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </CardDescription>
          </div>
          <Badge variant={isUpcoming ? "default" : "secondary"} className="flex-shrink-0">
            {isUpcoming ? "Upcoming" : "Past"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-500">{count || 0}</p>
              <p className="text-xs text-foreground/50">check-ins</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {cls.danceStyle && <span className="text-xs text-foreground/50 capitalize">{cls.danceStyle}</span>}
            {cls.hasSocial && (
              <div className="flex items-center gap-1 text-xs text-accent">
                <Clock className="h-3 w-3" />
                Social {cls.socialTime}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={onOpenScanner} className="btn-vibrant flex-1">
            <QrCode className="h-4 w-4 mr-2" />
            Scan QR
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowList(!showList)}
          >
            <Users className="h-4 w-4 mr-1" />
            {showList ? "Hide" : "List"}
          </Button>
        </div>

        {showList && (
          <AttendeeList itemType="class" itemId={cls.id} title={cls.title} />
        )}
      </CardContent>
    </Card>
  );
}
