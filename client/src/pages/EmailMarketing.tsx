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
            Create beautiful email templates with our simple editor
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium mb-2 block">Template Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Summer Event Promo" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
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
              <label className="text-sm font-medium mb-2 block">Subject Line</label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g., 🎉 Join us for our next event!" />
              <p className="text-xs text-foreground/50 mt-1">This is what people will see in their inbox</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Email Message</label>
              <div className="border border-border/50 rounded-lg overflow-hidden bg-white relative">
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => setHtmlContent(e.currentTarget.innerHTML)}
                  dangerouslySetInnerHTML={{ __html: htmlContent || '' }}
                  className="p-4 min-h-[240px] focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                  style={{ maxHeight: '400px', overflowY: 'auto' }}
                  data-placeholder="Start typing your message here... You can paste formatted text or just type naturally!"
                />
                {!htmlContent && (
                  <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
                    Start typing your message here... You can paste formatted text or just type naturally!
                  </div>
                )}
              </div>
              <p className="text-xs text-foreground/50 mt-1">Type or paste your message - it will look great! ✨</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">Preview</label>
              <Button variant="outline" size="sm" onClick={() => setPreview(!preview)}>
                <Eye className="h-3 w-3 mr-1" />
                {preview ? "Hide" : "Show"}
              </Button>
            </div>
            {preview && htmlContent ? (
              <div className="border border-border/50 rounded-lg overflow-hidden h-[420px] bg-white">
                <div className="p-6 overflow-y-auto h-full">
                  <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-border/30 rounded-lg h-[420px] flex items-center justify-center text-foreground/30 bg-gradient-to-br from-purple-50/50 to-blue-50/50">
                <div className="text-center">
                  <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Click "Show" to preview your email</p>
                  <p className="text-xs mt-1">See how it will look to your audience</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isPending} className="btn-vibrant">
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {template?.id ? "Save Changes" : "Create Template"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Auto-generate beautiful email HTML ───────────────────────────────────────
function generateEmailHTML(type: "event" | "course" | "class", item: any): string {
  const baseStyles = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">
          ${item.title || item.name}
        </h1>
      </div>
      <div style="padding: 40px 30px;">
        ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.title || item.name}" style="width: 100%; border-radius: 12px; margin-bottom: 24px;" />` : ''}
        <p style="font-size: 18px; color: #333333; line-height: 1.6; margin-bottom: 24px;">
          ${item.description || 'Join us for an amazing experience!'}
        </p>
        ${type === 'event' && item.startDate ? `
        <div style="background: #f7fafc; border-left: 4px solid #667eea; padding: 20px; margin: 24px 0; border-radius: 8px;">
          <p style="margin: 0; color: #4a5568; font-size: 16px;">
            <strong style="color: #667eea;">📅 Date:</strong> ${new Date(item.startDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          ${item.location ? `<p style="margin: 8px 0 0 0; color: #4a5568; font-size: 16px;"><strong style="color: #667eea;">📍 Location:</strong> ${item.location}</p>` : ''}
        </div>
        ` : ''}
        ${item.price ? `
        <div style="text-align: center; margin: 32px 0;">
          <p style="font-size: 16px; color: #718096; margin-bottom: 8px;">Price</p>
          <p style="font-size: 36px; font-weight: bold; color: #667eea; margin: 0;">£${item.price}</p>
        </div>
        ` : ''}
        <div style="text-align: center; margin-top: 32px;">
          <a href="${window.location.origin}/${type}s/${item.id}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 16px 48px; text-decoration: none; border-radius: 50px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
            ${type === 'event' ? 'Get Tickets' : type === 'course' ? 'Enroll Now' : 'Book Your Spot'}
          </a>
        </div>
      </div>
      <div style="background: #f7fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="color: #718096; font-size: 14px; margin: 0;">
          You're receiving this because you're part of our amazing community!
        </p>
      </div>
    </div>
  `;
  return baseStyles;
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
  const [step, setStep] = useState<"select" | "preview" | "send">("select");
  const [contentType, setContentType] = useState<"event" | "course" | "class" | "custom">("event");
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [name, setCampaignName] = useState("");
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [segment, setSegment] = useState("all");
  const [scheduledAt, setScheduledAt] = useState("");
  const [sendNow, setSendNow] = useState(true);

  // Fetch available content
  const { data: events } = trpc.events.list.useQuery(undefined, { enabled: contentType === "event" });
  const { data: courses } = trpc.courses.list.useQuery(undefined, { enabled: contentType === "course" });
  const { data: classes } = trpc.classes.list.useQuery(undefined, { enabled: contentType === "class" });

  const { data: templates } = trpc.emailMarketing.listTemplates.useQuery();

  const createMutation = trpc.emailMarketing.createCampaign.useMutation({
    onSuccess: (data) => {
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
      toast.success(`Sent to ${data.sent} people!`);
      onSent();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  // Handle item selection and auto-generate email
  const handleItemSelect = (item: any) => {
    setSelectedItemId(item.id);
    const itemName = item.title || item.name;
    setCampaignName(`${contentType.charAt(0).toUpperCase() + contentType.slice(1)}: ${itemName}`);
    setSubject(`🎉 ${itemName} - Don't miss out!`);
    setHtmlContent(generateEmailHTML(contentType as any, item));
    setStep("preview");
  };

  const handleSend = () => {
    if (!name || !subject || !htmlContent) {
      toast.error("Please complete all steps");
      return;
    }
    createMutation.mutate({
      name,
      subject,
      htmlContent,
      segment: segment as any,
      scheduledAt: !sendNow && scheduledAt ? scheduledAt : undefined,
    });
  };

  const isPending = createMutation.isPending || sendMutation.isPending;

  // Get min datetime (now + 5 minutes)
  const minDateTime = new Date(Date.now() + 5 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  // Get current items based on type
  const currentItems = contentType === "event" ? events : contentType === "course" ? courses : classes;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent" />
            Promote Your Content
          </DialogTitle>
          <DialogDescription>
            Pick what you want to promote and we'll create a beautiful email for you!
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Select Content */}
        {step === "select" && (
          <div className="space-y-6">
            <div>
              <label className="text-base font-semibold mb-3 block">What do you want to promote?</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setContentType("event")}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    contentType === "event"
                      ? "border-purple-500 bg-purple-50 shadow-lg"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                >
                  <div className="text-4xl mb-2">🎉</div>
                  <div className="font-semibold">Events</div>
                  <div className="text-xs text-gray-500 mt-1">Parties, workshops, socials</div>
                </button>
                <button
                  onClick={() => setContentType("course")}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    contentType === "course"
                      ? "border-purple-500 bg-purple-50 shadow-lg"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                >
                  <div className="text-4xl mb-2">🎓</div>
                  <div className="font-semibold">Courses</div>
                  <div className="text-xs text-gray-500 mt-1">Online video courses</div>
                </button>
                <button
                  onClick={() => setContentType("class")}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    contentType === "class"
                      ? "border-purple-500 bg-purple-50 shadow-lg"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                >
                  <div className="text-4xl mb-2">💃</div>
                  <div className="font-semibold">Classes</div>
                  <div className="text-xs text-gray-500 mt-1">In-person dance classes</div>
                </button>
              </div>
            </div>

            <div>
              <label className="text-base font-semibold mb-3 block">
                Choose a {contentType} to promote
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
                {currentItems && currentItems.length > 0 ? (
                  currentItems.map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() => handleItemSelect(item)}
                      className="text-left p-4 rounded-lg border-2 border-gray-200 hover:border-purple-400 hover:shadow-md transition-all group"
                    >
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.title || item.name}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                      )}
                      <h3 className="font-semibold text-base group-hover:text-purple-600 transition-colors">
                        {item.title || item.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {item.description || "Click to promote this!"}
                      </p>
                      {item.price && (
                        <p className="text-purple-600 font-bold mt-2">£{item.price}</p>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-12">
                    <p className="text-gray-400">No {contentType}s available yet</p>
                    <p className="text-sm text-gray-400 mt-1">Create one first to promote it!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Preview & Configure */}
        {step === "preview" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setStep("select")} className="gap-1">
                ← Back to selection
              </Button>
              <Badge className="bg-green-100 text-green-700 border-green-300">Ready to send!</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Subject Line</label>
                  <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
                  <p className="text-xs text-gray-500 mt-1">You can edit this if you want!</p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Who should receive this?</label>
                  <Select value={segment} onValueChange={setSegment}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Everyone</SelectItem>
                      <SelectItem value="customer">Customers only</SelectItem>
                      <SelectItem value="vip">VIP members</SelectItem>
                      <SelectItem value="lead">New leads</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">When to send?</label>
                  <Select value={sendNow ? "now" : "schedule"} onValueChange={(v) => setSendNow(v === "now")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="now">Send right now</SelectItem>
                      <SelectItem value="schedule">Schedule for later</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {!sendNow && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Pick a date and time</label>
                    <Input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      min={minDateTime}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Email Preview</label>
                <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 h-96 overflow-y-auto">
                  <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                </div>
                <p className="text-xs text-gray-500 mt-2">This is how your email will look!</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {step === "preview" && (
            <Button onClick={handleSend} disabled={isPending} className="btn-vibrant gap-2">
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isPending ? "Sending…" : sendNow ? "Send Now!" : "Schedule"}
            </Button>
          )}
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
