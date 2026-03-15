import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Edit2, Trash2, AlertCircle, Mail, Phone, MapPin, Users, RefreshCw, TrendingUp, Flame, Star, Snowflake, ChevronDown, ChevronUp, Download, Upload, FileText, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function CRMDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return;
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);
  }, [loading, isAuthenticated, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (user?.role !== "admin") {
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
            <p className="text-foreground/80">You do not have admin access to this panel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-text">CRM Dashboard</h1>
          <div className="text-sm text-foreground/60">
            Manage your contacts and customer relationships
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="users">Registered Users</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>

          {/* USERS TAB */}
          <TabsContent value="users">
            <UsersTab />
          </TabsContent>

          {/* CONTACTS TAB */}
          <TabsContent value="contacts">
            <ContactsTab />
          </TabsContent>

          {/* STATISTICS TAB */}
          <TabsContent value="statistics">
            <StatisticsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ===== CONTACTS TAB =====
function ContactsTab() {
  const { data: contacts, isLoading, refetch } = trpc.crm.listContacts.useQuery({
    limit: 100,
    offset: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [segmentFilter, setSegmentFilter] = useState<"lead" | "customer" | "vip" | "inactive" | "all">("all");
  const [tierFilter, setTierFilter] = useState<"cold" | "warm" | "hot" | "champion" | "all">("all");
  const [sortBy, setSortBy] = useState<"name" | "score">("score");
  const [expandedContact, setExpandedContact] = useState<number | null>(null);
  const [selectedContact, setSelectedContact] = useState<number | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const utils = trpc.useUtils();

  // ── Export ──────────────────────────────────────────────────────────────
  const { refetch: triggerExport, isFetching: isExporting } =
    trpc.crm.exportContactsCSV.useQuery(undefined, { enabled: false });

  const { refetch: triggerTemplate, isFetching: isTemplateLoading } =
    trpc.crm.getCSVTemplate.useQuery(undefined, { enabled: false });

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    const result = await triggerExport();
    if (result.data) {
      downloadCSV(result.data.csv, result.data.filename);
      toast.success(`Exported ${contacts?.length ?? 0} contacts to CSV`);
    }
  };

  const handleDownloadTemplate = async () => {
    const result = await triggerTemplate();
    if (result.data) {
      downloadCSV(result.data.csv, result.data.filename);
      toast.success("Template downloaded — fill it in and import!");
    }
  };

  // ── Import ──────────────────────────────────────────────────────────────
  const importMutation = trpc.crm.importContactsCSV.useMutation({
    onSuccess: (data) => {
      setImportResult(data);
      utils.crm.listContacts.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleFileImport = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a .csv file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvData = e.target?.result as string;
      setImportResult(null);
      importMutation.mutate({ csvData });
    };
    reader.readAsText(file);
  };

  const createMutation = trpc.crm.createContact.useMutation({
    onSuccess: () => {
      toast.success("Contact created successfully!");
      utils.crm.listContacts.invalidate();
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        phone: "",
        city: "",
        segment: "lead",
        source: "",
      });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = trpc.crm.deleteContact.useMutation({
    onSuccess: () => {
      toast.success("Contact deleted successfully!");
      utils.crm.listContacts.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    city: "",
    segment: "lead" as const,
    source: "",
  });

  const handleCreateContact = () => {
    if (!formData.email) {
      toast.error("Email is required");
      return;
    }

    createMutation.mutate({
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      city: formData.city,
      segment: formData.segment,
      source: formData.source,
    });
  };

  const refreshScoresMutation = trpc.crm.refreshAllScores.useMutation({
    onSuccess: (data) => {
      toast.success(`Refreshed scores for ${data.updated} contacts!`);
      utils.crm.listContacts.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const computeScoreMutation = trpc.crm.computeContactScore.useMutation({
    onSuccess: () => utils.crm.listContacts.invalidate(),
    onError: (err) => toast.error(err.message),
  });

  const filteredContacts = contacts
    ?.filter((contact) => {
      const matchesSearch =
        contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contact.firstName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contact.lastName?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesSegment = segmentFilter === "all" || contact.segment === segmentFilter;
      const matchesTier = tierFilter === "all" || contact.engagementTier === tierFilter;
      return matchesSearch && matchesSegment && matchesTier;
    })
    .sort((a, b) => {
      if (sortBy === "score") return (b.engagementScore ?? 0) - (a.engagementScore ?? 0);
      const nameA = `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim();
      const nameB = `${b.firstName ?? ""} ${b.lastName ?? ""}`.trim();
      return nameA.localeCompare(nameB);
    });

  return (
    <div className="space-y-6">
      {/* Create Contact Card */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Contact</CardTitle>
          <CardDescription>Create a new contact in your CRM</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Email *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              placeholder="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
            <Input
              placeholder="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
            <Input
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              placeholder="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <Input
              placeholder="Source (website, instagram, event)"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Select value={formData.segment} onValueChange={(value: any) => setFormData({ ...formData, segment: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleCreateContact}
              disabled={createMutation.isPending}
              className="btn-vibrant flex-1"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Contact
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contacts List */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle>Your Contacts</CardTitle>
              <CardDescription>Manage your customer relationships</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                disabled={isTemplateLoading}
                className="gap-1 border-border/50 text-foreground/70 hover:text-foreground"
              >
                {isTemplateLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                Template
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setImportResult(null); setImportDialogOpen(true); }}
                className="gap-1 border-accent/40 text-accent hover:bg-accent/10"
              >
                <Upload className="h-3 w-3" />
                Import CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isExporting}
                className="gap-1 border-border/50 text-foreground/70 hover:text-foreground"
              >
                {isExporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Import Dialog */}
        <Dialog open={importDialogOpen} onOpenChange={(open) => { setImportDialogOpen(open); if (!open) setImportResult(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-accent" />
                Import Contacts from CSV
              </DialogTitle>
              <DialogDescription>
                Upload a CSV file to bulk-import contacts. Duplicates (by email) are skipped automatically.
              </DialogDescription>
            </DialogHeader>

            {importResult ? (
              /* Results view */
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-3 text-center">
                    <CheckCircle className="h-6 w-6 text-green-400 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-green-400">{importResult.imported}</div>
                    <div className="text-xs text-foreground/60">Imported</div>
                  </div>
                  <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-3 text-center">
                    <XCircle className="h-6 w-6 text-yellow-400 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-yellow-400">{importResult.skipped}</div>
                    <div className="text-xs text-foreground/60">Skipped</div>
                  </div>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 max-h-40 overflow-y-auto">
                    <p className="text-xs font-semibold text-destructive mb-2">Issues ({importResult.errors.length}):</p>
                    {importResult.errors.map((err, i) => (
                      <p key={i} className="text-xs text-foreground/70 py-0.5 border-b border-border/20 last:border-0">{err}</p>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setImportResult(null)}
                  >
                    Import Another File
                  </Button>
                  <Button
                    className="flex-1 btn-vibrant"
                    onClick={() => setImportDialogOpen(false)}
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              /* Upload view */
              <div className="space-y-4">
                {/* Drag-and-drop zone */}
                <label
                  htmlFor="csv-file-input"
                  className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors ${isDragOver
                    ? "border-accent bg-accent/10"
                    : "border-border/50 hover:border-accent/50 hover:bg-card/50"
                    }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) handleFileImport(file);
                  }}
                >
                  {importMutation.isPending ? (
                    <>
                      <Loader2 className="h-10 w-10 text-accent animate-spin" />
                      <p className="text-sm text-foreground/60">Importing contacts...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-foreground/30" />
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">Drop your CSV file here</p>
                        <p className="text-xs text-foreground/50 mt-1">or click to browse</p>
                      </div>
                    </>
                  )}
                  <input
                    id="csv-file-input"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileImport(file);
                      e.target.value = "";
                    }}
                  />
                </label>

                <div className="rounded-lg bg-card/50 border border-border/30 p-3 text-xs text-foreground/60 space-y-1">
                  <p className="font-semibold text-foreground/80">Expected columns (in any order):</p>
                  <p>Email <span className="text-destructive">*required</span>, First Name, Last Name, Phone, Address, City, Country, Postal Code, Segment, Source, Notes</p>
                  <p className="mt-1">Segment values: <code className="bg-border/30 px-1 rounded">lead</code> <code className="bg-border/30 px-1 rounded">customer</code> <code className="bg-border/30 px-1 rounded">vip</code> <code className="bg-border/30 px-1 rounded">inactive</code></p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  disabled={isTemplateLoading}
                  className="w-full gap-1 text-foreground/60 hover:text-foreground"
                >
                  {isTemplateLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                  Download import template
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
        <CardContent className="space-y-4">
          {/* Filters + Refresh */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Input
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[180px]"
            />
            <Select value={segmentFilter} onValueChange={(value: any) => setSegmentFilter(value)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Segment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Segments</SelectItem>
                <SelectItem value="lead">Leads</SelectItem>
                <SelectItem value="customer">Customers</SelectItem>
                <SelectItem value="vip">VIPs</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tierFilter} onValueChange={(value: any) => setTierFilter(value)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="champion">🏆 Champion</SelectItem>
                <SelectItem value="hot">🔥 Hot</SelectItem>
                <SelectItem value="warm">⭐ Warm</SelectItem>
                <SelectItem value="cold">❄️ Cold</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Sort: Score</SelectItem>
                <SelectItem value="name">Sort: Name</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshScoresMutation.mutate()}
              disabled={refreshScoresMutation.isPending}
              className="gap-1 border-accent/40 text-accent hover:bg-accent/10"
            >
              {refreshScoresMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Refresh Scores
            </Button>
          </div>

          {/* Contacts Grid */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : filteredContacts && filteredContacts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="border border-border/50 rounded-lg p-4 hover:bg-card/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">
                          {contact.firstName} {contact.lastName}
                        </h3>
                        <EngagementBadge score={contact.engagementScore ?? 0} tier={(contact.engagementTier ?? "cold") as any} />
                      </div>
                      <p className="text-xs text-accent font-medium mt-0.5">
                        {(contact.segment || "lead").toUpperCase()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-foreground/40 hover:text-accent"
                        onClick={() => {
                          computeScoreMutation.mutate({ contactId: contact.id });
                        }}
                        title="Recompute score"
                      >
                        {computeScoreMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <TrendingUp className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-foreground/40 hover:text-foreground"
                        onClick={() => setExpandedContact(expandedContact === contact.id ? null : contact.id)}
                        title="Show score breakdown"
                      >
                        {expandedContact === contact.id ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => deleteMutation.mutate({ id: contact.id })}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Score bar */}
                  <ScoreBar score={contact.engagementScore ?? 0} tier={(contact.engagementTier ?? "cold") as any} />

                  {/* Expandable breakdown */}
                  {expandedContact === contact.id && (
                    <ContactScoreBreakdown contactId={contact.id} />
                  )}

                  <div className="space-y-1.5 text-sm text-foreground/70 mt-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate text-xs">{contact.email}</span>
                    </div>
                    {contact.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5" />
                        <span className="text-xs">{contact.phone}</span>
                      </div>
                    )}
                    {contact.city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="text-xs">{contact.city}</span>
                      </div>
                    )}
                  </div>

                  {contact.source && (
                    <p className="text-xs text-foreground/40 mt-2">Source: {contact.source}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-foreground/60 text-center py-8">No contacts found. Create one above!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ===== STATISTICS TAB =====
function StatisticsTab() {
  const { data: stats, isLoading } = trpc.crm.getStats.useQuery();
  const { data: contacts } = trpc.crm.listContacts.useQuery({ limit: 1000, offset: 0 });
  const utils = trpc.useUtils();

  const refreshScoresMutation = trpc.crm.refreshAllScores.useMutation({
    onSuccess: (data) => {
      toast.success(`Refreshed scores for ${data.updated} contacts!`);
      utils.crm.listContacts.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  // Compute tier distribution from contacts
  const tierCounts = {
    champion: contacts?.filter((c) => c.engagementTier === "champion").length ?? 0,
    hot: contacts?.filter((c) => c.engagementTier === "hot").length ?? 0,
    warm: contacts?.filter((c) => c.engagementTier === "warm").length ?? 0,
    cold: contacts?.filter((c) => c.engagementTier === "cold" || !c.engagementTier).length ?? 0,
  };
  const avgScore = contacts && contacts.length > 0
    ? Math.round(contacts.reduce((sum, c) => sum + (c.engagementScore ?? 0), 0) / contacts.length)
    : 0;

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : stats ? (
        <>
          {/* Segment stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground/60">Total Contacts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent">{stats.totalContacts}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground/60">Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-500">{stats.leads}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground/60">Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">{stats.customers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground/60">VIPs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-500">{stats.vips}</div>
              </CardContent>
            </Card>
          </div>

          {/* Engagement tier distribution */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-accent" />
                    Engagement Score Distribution
                  </CardTitle>
                  <CardDescription>
                    Average score: <span className="font-semibold text-foreground">{avgScore}/100</span>
                    {" · "}
                    Scores are computed from email opens, clicks, and purchases.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refreshScoresMutation.mutate()}
                  disabled={refreshScoresMutation.isPending}
                  className="gap-1 border-accent/40 text-accent hover:bg-accent/10"
                >
                  {refreshScoresMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  Refresh All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(["champion", "hot", "warm", "cold"] as const).map((tier) => {
                  const cfg = { champion: { icon: "🏆", label: "Champion", color: "text-purple-400", bg: "bg-purple-500/10" }, hot: { icon: "🔥", label: "Hot", color: "text-orange-400", bg: "bg-orange-500/10" }, warm: { icon: "⭐", label: "Warm", color: "text-yellow-400", bg: "bg-yellow-500/10" }, cold: { icon: "❄️", label: "Cold", color: "text-blue-400", bg: "bg-blue-500/10" } }[tier];
                  const pct = stats.totalContacts > 0 ? Math.round((tierCounts[tier] / stats.totalContacts) * 100) : 0;
                  return (
                    <div key={tier} className={`rounded-xl p-4 ${cfg.bg} border border-border/30`}>
                      <div className="text-2xl mb-1">{cfg.icon}</div>
                      <div className={`text-2xl font-bold ${cfg.color}`}>{tierCounts[tier]}</div>
                      <div className="text-xs text-foreground/60 mt-0.5">{cfg.label} · {pct}%</div>
                    </div>
                  );
                })}
              </div>

              {/* Scoring guide */}
              <div className="mt-6 p-4 rounded-lg bg-card/50 border border-border/30 text-xs text-foreground/60 space-y-1">
                <p className="font-semibold text-foreground/80 mb-2">How scores are calculated (max 100 pts)</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <span>📧 Email opens: +2 pts each (max 20)</span>
                  <span>🔗 Email clicks: +5 pts each (max 30)</span>
                  <span>🛒 Purchases: +15 pts each (max 45)</span>
                  <span>⚡ Recent activity (30d): +5 pts</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

// ===== USERS TAB =====
function UsersTab() {
  const { data: users, isLoading } = trpc.crm.listUsers.useQuery({
    limit: 100,
    offset: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      (user.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Search Users</CardTitle>
          <CardDescription>Find registered users by name or email</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Users</CardTitle>
          <CardDescription>All users who have registered on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : filteredUsers && filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Registered</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Tickets</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Courses</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Classes</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Total Purchases</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border/30 hover:bg-card/30 transition-colors">
                      <td className="py-3 px-4 text-foreground">{user.name || "—"}</td>
                      <td className="py-3 px-4 text-foreground/80 font-mono text-xs">{user.email || "—"}</td>
                      <td className="py-3 px-4 text-foreground/60 text-xs">
                        {new Date(user.createdAt).toLocaleDateString("en-GB")}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-medium">
                          {(user as any).ticketsPurchased || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-xs font-medium">
                          {(user as any).coursesPurchased || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-medium">
                          {(user as any).classesPurchased || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-1 rounded bg-accent/20 text-accent text-xs font-bold">
                          {(user as any).totalPurchases || 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-foreground/60 text-center py-8">
              {searchTerm ? "No users match your search" : "No registered users yet"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ===== ENGAGEMENT SCORE COMPONENTS =====

type Tier = "cold" | "warm" | "hot" | "champion";

const TIER_CONFIG: Record<Tier, { label: string; color: string; bg: string; icon: string }> = {
  cold: { label: "Cold", color: "text-blue-400", bg: "bg-blue-500/15 border-blue-500/30", icon: "❄️" },
  warm: { label: "Warm", color: "text-yellow-400", bg: "bg-yellow-500/15 border-yellow-500/30", icon: "⭐" },
  hot: { label: "Hot", color: "text-orange-400", bg: "bg-orange-500/15 border-orange-500/30", icon: "🔥" },
  champion: { label: "Champion", color: "text-purple-400", bg: "bg-purple-500/15 border-purple-500/30", icon: "🏆" },
};

function EngagementBadge({ score, tier }: { score: number; tier: Tier }) {
  const cfg = TIER_CONFIG[tier] ?? TIER_CONFIG.cold;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${cfg.bg} ${cfg.color}`}
      title={`Engagement score: ${score}/100`}
    >
      <span>{cfg.icon}</span>
      <span>{cfg.label}</span>
      <span className="opacity-70 font-normal">{score}</span>
    </span>
  );
}

function ScoreBar({ score, tier }: { score: number; tier: Tier }) {
  const cfg = TIER_CONFIG[tier] ?? TIER_CONFIG.cold;
  const barColors: Record<Tier, string> = {
    cold: "bg-blue-500",
    warm: "bg-yellow-500",
    hot: "bg-orange-500",
    champion: "bg-purple-500",
  };
  return (
    <div className="mt-2 mb-1">
      <div className="flex justify-between items-center mb-1">
        <span className={`text-xs font-medium ${cfg.color}`}>Engagement</span>
        <span className="text-xs text-foreground/50">{score}/100</span>
      </div>
      <div className="h-1.5 rounded-full bg-border/40 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColors[tier]}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  );
}

function ContactScoreBreakdown({ contactId }: { contactId: number }) {
  const { data, isLoading } = trpc.crm.getContactEngagement.useQuery({ contactId });

  if (isLoading) {
    return (
      <div className="mt-2 p-3 rounded-lg bg-card/50 border border-border/30 text-xs text-foreground/60 flex items-center gap-2">
        <Loader2 className="h-3 w-3 animate-spin" /> Computing score...
      </div>
    );
  }

  if (!data) return null;

  const { breakdown } = data;

  return (
    <div className="mt-2 p-3 rounded-lg bg-card/50 border border-border/30 text-xs space-y-2">
      <p className="font-semibold text-foreground/80 mb-1">Score Breakdown</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-foreground/60">
        <span>Email opens ({breakdown.opens})</span>
        <span className="text-right font-medium text-blue-400">+{breakdown.openScore} pts</span>
        <span>Email clicks ({breakdown.clicks})</span>
        <span className="text-right font-medium text-green-400">+{breakdown.clickScore} pts</span>
        <span>Purchases ({breakdown.purchases})</span>
        <span className="text-right font-medium text-purple-400">+{breakdown.purchaseScore} pts</span>
        <span>Recent activity</span>
        <span className="text-right font-medium text-yellow-400">+{breakdown.recencyBonus} pts</span>
      </div>
      <div className="border-t border-border/30 pt-1 flex justify-between font-semibold text-foreground/80">
        <span>Total</span>
        <span>{breakdown.total}/100</span>
      </div>
    </div>
  );
}
