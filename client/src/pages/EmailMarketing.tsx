import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2, Mail, BarChart2, FileText, Plus, Send, Trash2,
  Edit2, Eye, Calendar, Users, MousePointer, TrendingUp,
  Clock, CheckCircle, AlertCircle, ChevronRight, Sparkles,
  Copy, LayoutTemplate
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";

// ─── Category badge colors ────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  event: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  course: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  class: "bg-green-500/20 text-green-400 border-green-500/30",
  promotion: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  newsletter: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  custom: "bg-foreground/10 text-foreground/60 border-border/50",
};

const CATEGORY_ICONS: Record<string, string> = {
  event: "🎉",
  course: "🎓",
  class: "💃",
  promotion: "⚡",
  newsletter: "📰",
  custom: "✏️",
};

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-foreground/10 text-foreground/60" },
    scheduled: { label: "Scheduled", className: "bg-blue-500/20 text-blue-400" },
    sending: { label: "Sending…", className: "bg-yellow-500/20 text-yellow-400" },
    sent: { label: "Sent", className: "bg-green-500/20 text-green-400" },
    failed: { label: "Failed", className: "bg-red-500/20 text-red-400" },
  };
  const s = map[status] || map.draft;
  return <Badge className={s.className}>{s.label}</Badge>;
}

// ─── Metric card ──────────────────────────────────────────────────────────────
function MetricCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <Card className="border-border/50">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-foreground/60">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-foreground/40 mt-1">{sub}</p>}
          </div>
          <div className="p-2 bg-accent/10 rounded-lg text-accent">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Template Editor Dialog ───────────────────────────────────────────────────
function TemplateEditorDialog({
  open,
  onClose,
  template,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  template?: any;
  onSaved: () => void;
}) {
  const [name, setName] = useState(template?.name || "");
  const [category, setCategory] = useState<string>(template?.category || "custom");
  const [subject, setSubject] = useState(template?.subject || "");
  const [htmlContent, setHtmlContent] = useState(template?.htmlContent || "");
  const [preview, setPreview] = useState(false);

  const createMutation = trpc.emailMarketing.createTemplate.useMutation({
    onSuccess: () => { toast.success("Template created!"); onSaved(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.emailMarketing.updateTemplate.useMutation({
    onSuccess: () => { toast.success("Template updated!"); onSaved(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    if (!name || !subject || !htmlContent) {
      toast.error("Please fill in all fields");
      return;
    }
    if (template?.id) {
      updateMutation.mutate({ id: template.id, name, category: category as any, subject, htmlContent });
    } else {
      createMutation.mutate({ name, category: category as any, subject, htmlContent });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template?.id ? "Edit Template" : "Create Template"}</DialogTitle>
          <DialogDescription>
            Use <code className="text-accent bg-accent/10 px-1 rounded text-xs">{"{{variableName}}"}</code> placeholders for dynamic content.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Template Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Summer Event Promo" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="event">🎉 Event</SelectItem>
                  <SelectItem value="course">🎓 Course</SelectItem>
                  <SelectItem value="class">💃 Class</SelectItem>
                  <SelectItem value="promotion">⚡ Promotion</SelectItem>
                  <SelectItem value="newsletter">📰 Newsletter</SelectItem>
                  <SelectItem value="custom">✏️ Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Subject Line</label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g., 🎉 New Event: {{eventTitle}}" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">HTML Content</label>
              <Textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                rows={14}
                className="font-mono text-xs"
                placeholder="<div>Your email HTML here...</div>"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Preview</label>
              <Button variant="outline" size="sm" onClick={() => setPreview(!preview)}>
                <Eye className="h-3 w-3 mr-1" />
                {preview ? "Hide" : "Show"} Preview
              </Button>
            </div>
            {preview && htmlContent ? (
              <div className="border border-border/50 rounded-lg overflow-hidden h-[400px]">
                <iframe
                  srcDoc={htmlContent}
                  className="w-full h-full"
                  sandbox="allow-same-origin"
                  title="Email Preview"
                />
              </div>
            ) : (
              <div className="border border-dashed border-border/30 rounded-lg h-[400px] flex items-center justify-center text-foreground/30">
                <div className="text-center">
                  <Eye className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Click "Show Preview" to render</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isPending} className="btn-vibrant">
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {template?.id ? "Update Template" : "Create Template"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Campaign Composer Dialog ─────────────────────────────────────────────────
function CampaignComposerDialog({
  open,
  onClose,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  onSent: () => void;
}) {
  const [step, setStep] = useState<"compose" | "schedule" | "confirm">("compose");
  const [name, setCampaignName] = useState("");
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [segment, setSegment] = useState("all");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [sendNow, setSendNow] = useState(true);
  const [preview, setPreview] = useState(false);
  const [createdCampaignId, setCreatedCampaignId] = useState<number | null>(null);

  const { data: templates } = trpc.emailMarketing.listTemplates.useQuery();

  const createMutation = trpc.emailMarketing.createCampaign.useMutation({
    onSuccess: (data) => {
      setCreatedCampaignId(data.id);
      if (sendNow) {
        sendMutation.mutate({ campaignId: data.id, origin: window.location.origin });
      } else {
        toast.success("Campaign scheduled!");
        onSent();
        onClose();
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const sendMutation = trpc.emailMarketing.sendCampaign.useMutation({
    onSuccess: (data) => {
      toast.success(`Campaign sent to ${data.sent} contacts!`);
      onSent();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleTemplateSelect = (tpl: any) => {
    setSelectedTemplateId(tpl.id);
    setSubject(tpl.subject);
    setHtmlContent(tpl.htmlContent);
  };

  const handleSend = () => {
    if (!name || !subject || !htmlContent) {
      toast.error("Please fill in all fields");
      return;
    }
    createMutation.mutate({
      name,
      subject,
      htmlContent,
      templateId: selectedTemplateId || undefined,
      segment: segment as any,
      scheduledAt: !sendNow && scheduledAt ? scheduledAt : undefined,
    });
  };

  const isPending = createMutation.isPending || sendMutation.isPending;

  // Get min datetime (now + 5 minutes)
  const minDateTime = new Date(Date.now() + 5 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-accent" />
            New Email Campaign
          </DialogTitle>
          <DialogDescription>
            Compose and send or schedule a bulk email to your contacts.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Template picker */}
          <div className="md:col-span-1">
            <h3 className="text-sm font-semibold text-foreground/70 mb-3 flex items-center gap-1">
              <LayoutTemplate className="h-4 w-4" /> Templates
            </h3>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {templates?.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleTemplateSelect(tpl)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedTemplateId === tpl.id
                    ? "border-accent bg-accent/10"
                    : "border-border/30 hover:border-accent/50 hover:bg-accent/5"
                    }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{CATEGORY_ICONS[tpl.category || "custom"]}</span>
                    <span className="text-xs font-semibold truncate">{tpl.name}</span>
                  </div>
                  <p className="text-xs text-foreground/50 truncate">{tpl.subject}</p>
                </button>
              ))}
              {(!templates || templates.length === 0) && (
                <p className="text-xs text-foreground/40 text-center py-4">No templates yet</p>
              )}
            </div>
          </div>

          {/* Right: Compose */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Campaign Name</label>
              <Input value={name} onChange={(e) => setCampaignName(e.target.value)} placeholder="e.g., March Event Blast" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Audience</label>
                <Select value={segment} onValueChange={setSegment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Active Contacts</SelectItem>
                    <SelectItem value="customer">Customers</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="lead">Leads</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Send</label>
                <Select value={sendNow ? "now" : "schedule"} onValueChange={(v) => setSendNow(v === "now")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="now">Send Immediately</SelectItem>
                    <SelectItem value="schedule">Schedule for Later</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!sendNow && (
              <div>
                <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Schedule Date & Time
                </label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  min={minDateTime}
                  className="w-full"
                />
                {scheduledAt && (
                  <p className="text-xs text-foreground/50 mt-1">
                    Will send on {new Date(scheduledAt).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" })}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1 block">Subject Line</label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g., 🎉 Don't miss this weekend's event!" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium">Email Content (HTML)</label>
                <Button variant="ghost" size="sm" onClick={() => setPreview(!preview)} className="text-xs h-6">
                  <Eye className="h-3 w-3 mr-1" />
                  {preview ? "Edit" : "Preview"}
                </Button>
              </div>
              {preview ? (
                <div className="border border-border/50 rounded-lg overflow-hidden h-48">
                  <iframe
                    srcDoc={htmlContent}
                    className="w-full h-full"
                    sandbox="allow-same-origin"
                    title="Email Preview"
                  />
                </div>
              ) : (
                <Textarea
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  rows={8}
                  className="font-mono text-xs"
                  placeholder="<div>Your email HTML here...</div>"
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-border/30">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSend} disabled={isPending} className="btn-vibrant gap-2">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : sendNow ? (
              <Send className="h-4 w-4" />
            ) : (
              <Calendar className="h-4 w-4" />
            )}
            {isPending ? "Sending…" : sendNow ? "Send Now" : "Schedule Campaign"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Templates Tab ────────────────────────────────────────────────────────────
function TemplatesTab() {
  const utils = trpc.useUtils();
  const { data: templates, isLoading } = trpc.emailMarketing.listTemplates.useQuery();
  const seedMutation = trpc.emailMarketing.seedDefaultTemplates.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.emailMarketing.listTemplates.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.emailMarketing.deleteTemplate.useMutation({
    onSuccess: () => { toast.success("Template deleted"); utils.emailMarketing.listTemplates.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Email Templates</h2>
          <p className="text-sm text-foreground/60">Reusable templates for your campaigns</p>
        </div>
        <div className="flex gap-2">
          {(!templates || templates.length === 0) && (
            <Button variant="outline" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending} className="gap-2">
              {seedMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Load Default Templates
            </Button>
          )}
          <Button onClick={() => { setEditingTemplate(null); setShowEditor(true); }} className="btn-vibrant gap-2">
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        </div>
      </div>

      {templates && templates.length === 0 && (
        <Card className="border-dashed border-border/30">
          <CardContent className="py-16 text-center">
            <LayoutTemplate className="h-12 w-12 text-foreground/20 mx-auto mb-4" />
            <h3 className="font-semibold text-foreground/60 mb-2">No templates yet</h3>
            <p className="text-sm text-foreground/40 mb-4">Load the 5 default templates or create your own</p>
            <Button onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending} className="btn-vibrant gap-2">
              {seedMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Load Default Templates
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates?.map((tpl) => (
          <Card key={tpl.id} className="border-border/50 hover:border-accent/30 transition-colors group">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{CATEGORY_ICONS[tpl.category || "custom"]}</span>
                  <div>
                    <h3 className="font-semibold text-sm">{tpl.name}</h3>
                    <Badge variant="outline" className={`text-xs mt-0.5 ${CATEGORY_COLORS[tpl.category || "custom"]}`}>
                      {tpl.category}
                    </Badge>
                  </div>
                </div>
                {tpl.isDefault && (
                  <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/30">Default</Badge>
                )}
              </div>
              <p className="text-xs text-foreground/50 truncate mb-4">{tpl.subject}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPreviewTemplate(tpl)} className="flex-1 gap-1 text-xs">
                  <Eye className="h-3 w-3" /> Preview
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setEditingTemplate(tpl); setShowEditor(true); }} className="gap-1 text-xs">
                  <Edit2 className="h-3 w-3" />
                </Button>
                {!tpl.isDefault && (
                  confirmDeleteId === tpl.id ? (
                    <div className="flex gap-1">
                      <Button variant="destructive" size="sm" onClick={() => { deleteMutation.mutate({ id: tpl.id }); setConfirmDeleteId(null); }} className="text-xs">Yes</Button>
                      <Button variant="outline" size="sm" onClick={() => setConfirmDeleteId(null)} className="text-xs">No</Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setConfirmDeleteId(tpl.id)} className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1 text-xs">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Template Editor */}
      {showEditor && (
        <TemplateEditorDialog
          open={showEditor}
          onClose={() => { setShowEditor(false); setEditingTemplate(null); }}
          template={editingTemplate}
          onSaved={() => utils.emailMarketing.listTemplates.invalidate()}
        />
      )}

      {/* Preview Dialog */}
      {previewTemplate && (
        <Dialog open={!!previewTemplate} onOpenChange={(o) => !o && setPreviewTemplate(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{previewTemplate.name}</DialogTitle>
              <DialogDescription>Subject: {previewTemplate.subject}</DialogDescription>
            </DialogHeader>
            <div className="border border-border/50 rounded-lg overflow-hidden h-96">
              <iframe
                srcDoc={previewTemplate.htmlContent}
                className="w-full h-full"
                sandbox="allow-same-origin"
                title="Template Preview"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Campaigns Tab ────────────────────────────────────────────────────────────
function CampaignsTab() {
  const utils = trpc.useUtils();
  const { data: campaigns, isLoading } = trpc.emailMarketing.listCampaigns.useQuery();
  const deleteMutation = trpc.emailMarketing.deleteCampaign.useMutation({
    onSuccess: () => { toast.success("Campaign deleted"); utils.emailMarketing.listCampaigns.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const sendMutation = trpc.emailMarketing.sendCampaign.useMutation({
    onSuccess: (data) => { toast.success(`Sent to ${data.sent} contacts!`); utils.emailMarketing.listCampaigns.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const [showComposer, setShowComposer] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [detailCampaignId, setDetailCampaignId] = useState<number | null>(null);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Campaigns</h2>
          <p className="text-sm text-foreground/60">Manage and send bulk email campaigns</p>
        </div>
        <Button onClick={() => setShowComposer(true)} className="btn-vibrant gap-2">
          <Plus className="h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {(!campaigns || campaigns.length === 0) && (
        <Card className="border-dashed border-border/30">
          <CardContent className="py-16 text-center">
            <Send className="h-12 w-12 text-foreground/20 mx-auto mb-4" />
            <h3 className="font-semibold text-foreground/60 mb-2">No campaigns yet</h3>
            <p className="text-sm text-foreground/40 mb-4">Create your first email campaign to reach your contacts</p>
            <Button onClick={() => setShowComposer(true)} className="btn-vibrant gap-2">
              <Plus className="h-4 w-4" /> New Campaign
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {campaigns?.map((campaign) => (
          <Card key={campaign.id} className="border-border/50 hover:border-accent/30 transition-colors">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold truncate">{campaign.name}</h3>
                    <StatusBadge status={campaign.status || "draft"} />
                    {campaign.segment !== "all" && (
                      <Badge variant="outline" className="text-xs capitalize">{campaign.segment}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-foreground/60 truncate mb-2">{campaign.subject}</p>
                  <div className="flex items-center gap-4 text-xs text-foreground/50">
                    {campaign.status === "sent" && (
                      <>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{campaign.totalSent} sent</span>
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{campaign.totalOpened} opened</span>
                        <span className="flex items-center gap-1"><MousePointer className="h-3 w-3" />{campaign.totalClicked} clicked</span>
                      </>
                    )}
                    {campaign.status === "scheduled" && campaign.scheduledAt && (
                      <span className="flex items-center gap-1 text-blue-400">
                        <Clock className="h-3 w-3" />
                        Scheduled: {new Date(campaign.scheduledAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    )}
                    {campaign.sentAt && (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-400" />
                        {new Date(campaign.sentAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {campaign.status === "sent" && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setDetailCampaignId(campaign.id)} className="gap-1 text-xs">
                        <BarChart2 className="h-3 w-3" /> Stats
                      </Button>
                      <Button asChild variant="outline" size="sm" className="gap-1 text-xs border-accent/30 text-accent hover:bg-accent/10">
                        <Link href={`/email-marketing/campaigns/${campaign.id}`}>
                          <Eye className="h-3 w-3" /> Details
                        </Link>
                      </Button>
                    </>
                  )}
                  {(campaign.status === "draft" || campaign.status === "scheduled") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendMutation.mutate({ campaignId: campaign.id, origin: window.location.origin })}
                      disabled={sendMutation.isPending}
                      className="gap-1 text-xs border-green-500/50 text-green-400 hover:bg-green-500/10"
                    >
                      {sendMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                      Send Now
                    </Button>
                  )}
                  {confirmDeleteId === campaign.id ? (
                    <div className="flex gap-1">
                      <Button variant="destructive" size="sm" onClick={() => { deleteMutation.mutate({ id: campaign.id }); setConfirmDeleteId(null); }} className="text-xs">Yes</Button>
                      <Button variant="outline" size="sm" onClick={() => setConfirmDeleteId(null)} className="text-xs">No</Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setConfirmDeleteId(campaign.id)} className="text-destructive border-destructive/30 hover:bg-destructive/10">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showComposer && (
        <CampaignComposerDialog
          open={showComposer}
          onClose={() => setShowComposer(false)}
          onSent={() => { utils.emailMarketing.listCampaigns.invalidate(); utils.emailMarketing.getAnalytics.invalidate(); }}
        />
      )}

      {detailCampaignId && (
        <CampaignDetailDialog
          campaignId={detailCampaignId}
          onClose={() => setDetailCampaignId(null)}
        />
      )}
    </div>
  );
}

// ─── Campaign Detail Dialog ───────────────────────────────────────────────────
function CampaignDetailDialog({ campaignId, onClose }: { campaignId: number; onClose: () => void }) {
  const { data: campaign, isLoading } = trpc.emailMarketing.getCampaign.useQuery({ id: campaignId });

  return (
    <Dialog open={!!campaignId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-accent" />
            Campaign Stats
          </DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
        ) : campaign ? (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold">{campaign.name}</h3>
              <p className="text-sm text-foreground/60">{campaign.subject}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-foreground/5 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{campaign.totalSent}</p>
                <p className="text-xs text-foreground/50 mt-1">Sent</p>
              </div>
              <div className="bg-blue-500/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-400">{campaign.uniqueOpeners}</p>
                <p className="text-xs text-foreground/50 mt-1">Unique Opens</p>
                <p className="text-xs text-blue-400 font-medium">
                  {campaign.totalSent ? Math.round((campaign.uniqueOpeners / campaign.totalSent) * 100) : 0}%
                </p>
              </div>
              <div className="bg-green-500/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-400">{campaign.uniqueClickers}</p>
                <p className="text-xs text-foreground/50 mt-1">Unique Clicks</p>
                <p className="text-xs text-green-400 font-medium">
                  {campaign.totalSent ? Math.round((campaign.uniqueClickers / campaign.totalSent) * 100) : 0}%
                </p>
              </div>
              <div className="bg-accent/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-accent">
                  {campaign.totalOpened ? Math.round(((campaign.totalClicked || 0) / campaign.totalOpened) * 100) : 0}%
                </p>
                <p className="text-xs text-foreground/50 mt-1">Click-to-Open</p>
              </div>
            </div>

            {campaign.topLinks && campaign.topLinks.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Top Clicked Links</h4>
                <div className="space-y-2">
                  {campaign.topLinks.map((link: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <span className="text-foreground/40 w-4">{i + 1}.</span>
                      <span className="flex-1 truncate text-foreground/70">{link.url}</span>
                      <Badge variant="outline" className="text-xs">{link.count} clicks</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {campaign.sentAt && (
              <p className="text-xs text-foreground/40">
                Sent on {new Date(campaign.sentAt).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" })}
              </p>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────
function AnalyticsTab() {
  const { data: analytics, isLoading } = trpc.emailMarketing.getAnalytics.useQuery();

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;

  if (!analytics || analytics.totalCampaigns === 0) {
    return (
      <Card className="border-dashed border-border/30">
        <CardContent className="py-16 text-center">
          <BarChart2 className="h-12 w-12 text-foreground/20 mx-auto mb-4" />
          <h3 className="font-semibold text-foreground/60 mb-2">No analytics yet</h3>
          <p className="text-sm text-foreground/40">Send your first campaign to see engagement metrics here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Email Analytics</h2>
        <p className="text-sm text-foreground/60">Engagement metrics across all campaigns</p>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard icon={<Send className="h-5 w-5" />} label="Campaigns" value={analytics.totalCampaigns} />
        <MetricCard icon={<Users className="h-5 w-5" />} label="Total Sent" value={analytics.totalSent.toLocaleString()} />
        <MetricCard icon={<Eye className="h-5 w-5" />} label="Total Opened" value={analytics.totalOpened.toLocaleString()} />
        <MetricCard icon={<MousePointer className="h-5 w-5" />} label="Total Clicked" value={analytics.totalClicked.toLocaleString()} />
        <MetricCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Avg Open Rate"
          value={`${analytics.avgOpenRate}%`}
          sub={`${analytics.avgClickRate}% click rate`}
        />
      </div>

      {/* Per-campaign table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Campaign Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-2 pr-4 text-foreground/60 font-medium">Campaign</th>
                  <th className="text-right py-2 px-3 text-foreground/60 font-medium">Sent</th>
                  <th className="text-right py-2 px-3 text-foreground/60 font-medium">Opens</th>
                  <th className="text-right py-2 px-3 text-foreground/60 font-medium">Open %</th>
                  <th className="text-right py-2 px-3 text-foreground/60 font-medium">Clicks</th>
                  <th className="text-right py-2 px-3 text-foreground/60 font-medium">Click %</th>
                  <th className="text-right py-2 pl-3 text-foreground/60 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {analytics.campaigns.map((c: any) => (
                  <tr key={c.id} className="border-b border-border/10 hover:bg-foreground/5 transition-colors">
                    <td className="py-3 pr-4">
                      <p className="font-medium truncate max-w-[180px]">{c.name}</p>
                      <p className="text-xs text-foreground/40 truncate max-w-[180px]">{c.subject}</p>
                    </td>
                    <td className="text-right py-3 px-3 tabular-nums">{c.totalSent}</td>
                    <td className="text-right py-3 px-3 tabular-nums text-blue-400">{c.totalOpened}</td>
                    <td className="text-right py-3 px-3">
                      <span className={`font-semibold ${c.openRate >= 20 ? "text-green-400" : c.openRate >= 10 ? "text-yellow-400" : "text-foreground/60"}`}>
                        {c.openRate}%
                      </span>
                    </td>
                    <td className="text-right py-3 px-3 tabular-nums text-green-400">{c.totalClicked}</td>
                    <td className="text-right py-3 px-3">
                      <span className={`font-semibold ${c.clickRate >= 5 ? "text-green-400" : c.clickRate >= 2 ? "text-yellow-400" : "text-foreground/60"}`}>
                        {c.clickRate}%
                      </span>
                    </td>
                    <td className="text-right py-3 pl-3 text-foreground/50 whitespace-nowrap">
                      {c.sentAt ? new Date(c.sentAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}
                    </td>
                    <td className="text-right py-3 pl-3">
                      <Link href={`/email-marketing/campaigns/${c.id}`} className="text-xs text-accent hover:underline">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Benchmark reference */}
      <Card className="border-border/30 bg-foreground/5">
        <CardContent className="pt-4 pb-4">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-accent" /> Industry Benchmarks
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div><p className="text-foreground/50">Good Open Rate</p><p className="font-semibold text-green-400">≥ 20%</p></div>
            <div><p className="text-foreground/50">Average Open Rate</p><p className="font-semibold text-yellow-400">10–20%</p></div>
            <div><p className="text-foreground/50">Good Click Rate</p><p className="font-semibold text-green-400">≥ 5%</p></div>
            <div><p className="text-foreground/50">Average Click Rate</p><p className="font-semibold text-yellow-400">2–5%</p></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EmailMarketing() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) setLocation("/login");
  }, [loading, isAuthenticated, setLocation]);

  // Show spinner while auth is resolving
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
      <div className="min-h-screen bg-background">
        <div className="container py-16 pt-28 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-foreground/60">You need admin access to view this page.</p>
          <Link href="/"><Button className="mt-4">Go Home</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 pt-24">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
              <Mail className="h-8 w-8 text-accent" />
              Email Marketing
            </h1>
            <p className="text-foreground/60 mt-1">Templates, campaigns, and engagement analytics</p>
          </div>
          <Link href="/admin">
            <Button variant="outline" size="sm">← Admin Dashboard</Button>
          </Link>
        </div>

        <Tabs defaultValue="templates" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <LayoutTemplate className="h-4 w-4" />
              <span>Templates</span>
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              <span>Campaigns</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates">
            <TemplatesTab />
          </TabsContent>
          <TabsContent value="campaigns">
            <CampaignsTab />
          </TabsContent>
          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
