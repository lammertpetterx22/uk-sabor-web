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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{template?.id ? "Edit Template" : "Create New Template"}</DialogTitle>
          <DialogDescription className="text-base">
            Write your message naturally and it will look beautiful in emails ✨
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Top row: Name, Category, Subject */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Template Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Summer Event Promo" className="h-11" />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-11">
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
              <label className="text-sm font-semibold mb-2 block">Subject Line</label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="🎉 Join us for our next event!" className="h-11" />
            </div>
          </div>

          {/* Editor and Preview side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Editor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-base font-bold text-gray-900">Your Message</label>
                  <Badge variant="outline" className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border-purple-300">
                    ✨ Live Editor
                  </Badge>
                </div>
              </div>

              <div className="border-2 border-purple-300 rounded-2xl overflow-hidden bg-white shadow-lg hover:border-purple-500 hover:shadow-xl transition-all relative">
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => setHtmlContent(e.currentTarget.innerHTML)}
                  dangerouslySetInnerHTML={{ __html: htmlContent || '' }}
                  className="p-8 min-h-[500px] focus:outline-none text-gray-900 text-lg leading-relaxed"
                  style={{ maxHeight: '600px', overflowY: 'auto' }}
                />
                {!htmlContent && (
                  <div className="absolute top-8 left-8 text-gray-400 pointer-events-none text-lg">
                    <div className="space-y-2">
                      <p className="font-medium">Start typing your message here...</p>
                      <p className="text-base text-gray-400">
                        💡 Tip: You can paste formatted text from anywhere!
                      </p>
                      <p className="text-sm text-gray-400">
                        Your formatting will be preserved automatically
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg border border-purple-100">
                <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <p>Write naturally - bold, italics, links, and all formatting is automatically preserved!</p>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-base font-bold text-gray-900">Live Preview</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreview(!preview)}
                  className="h-9 gap-2 border-purple-300 hover:bg-purple-50 hover:text-purple-700"
                >
                  <Eye className="w-4 h-4" />
                  {preview ? "Hide Preview" : "Show Preview"}
                </Button>
              </div>

              {preview && htmlContent ? (
                <div className="border-2 border-gray-300 rounded-2xl overflow-hidden shadow-lg">
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-4 py-2.5 border-b border-gray-300 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">How it looks in emails</span>
                  </div>
                  <div className="bg-white p-8 overflow-y-auto min-h-[500px] max-h-[600px]">
                    <div dangerouslySetInnerHTML={{ __html: htmlContent }} className="text-lg leading-relaxed" />
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-purple-300 rounded-2xl min-h-[500px] flex items-center justify-center bg-gradient-to-br from-purple-50/50 via-blue-50/50 to-purple-50/50">
                  <div className="text-center px-6 py-8">
                    <div className="inline-block p-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full mb-4">
                      <Eye className="w-12 h-12 text-purple-600" />
                    </div>
                    <p className="text-lg font-semibold text-gray-700 mb-2">Preview Your Message</p>
                    <p className="text-base text-gray-500 mb-4">See exactly how your email will look</p>
                    <Button
                      onClick={() => setPreview(true)}
                      variant="outline"
                      className="gap-2 border-purple-300 hover:bg-purple-50"
                    >
                      <Eye className="w-4 h-4" />
                      Show Preview
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-between items-center mt-8 pt-6 border-t-2 border-gray-200">
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-purple-600" />
            Changes are saved automatically as you type
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="px-8 h-11 text-base">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending} className="btn-vibrant px-10 h-11 text-base shadow-lg">
              {isPending ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  {template?.id ? (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Create Template
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
            Email Templates
          </h2>
          <p className="text-base text-foreground/70 mt-1">Ready-to-use designs for your email campaigns</p>
        </div>
        <div className="flex gap-3">
          {(!templates || templates.length === 0) && (
            <Button variant="outline" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending} className="gap-2 border-purple-200 hover:bg-purple-50">
              {seedMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-purple-600" />}
              Get Started Templates
            </Button>
          )}
          <Button onClick={() => { setEditingTemplate(null); setShowEditor(true); }} className="btn-vibrant gap-2 shadow-lg">
            <Plus className="h-5 w-5" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {templates && templates.length === 0 && (
        <Card className="border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50/50 to-blue-50/50">
          <CardContent className="py-20 text-center">
            <div className="inline-block p-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl mb-6">
              <LayoutTemplate className="h-16 w-16 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Start with Professional Templates</h3>
            <p className="text-base text-gray-600 mb-6 max-w-md mx-auto">
              Load our 5 beautifully designed templates or create your own from scratch
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending} className="btn-vibrant gap-2 px-6">
                {seedMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                Load Starter Templates
              </Button>
              <Button variant="outline" onClick={() => { setEditingTemplate(null); setShowEditor(true); }} className="gap-2 px-6">
                <Plus className="h-5 w-5" />
                Create Your Own
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {templates?.map((tpl) => (
          <Card key={tpl.id} className="border-2 border-gray-200 hover:border-purple-400 hover:shadow-xl transition-all duration-200 group overflow-hidden">
            <CardContent className="p-0">
              {/* Preview thumbnail */}
              <div className="relative h-40 bg-gradient-to-br from-purple-50 to-blue-50 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="text-6xl opacity-50">{CATEGORY_ICONS[tpl.category || "custom"]}</div>
                </div>
                {tpl.isDefault && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-white/90 text-purple-600 border-purple-200 shadow-sm">
                      ✨ Starter
                    </Badge>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5 space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-base text-gray-900 group-hover:text-purple-600 transition-colors">
                      {tpl.name}
                    </h3>
                  </div>
                  <Badge variant="outline" className={`text-xs ${CATEGORY_COLORS[tpl.category || "custom"]}`}>
                    {tpl.category}
                  </Badge>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 min-h-[40px]">
                  Subject: {tpl.subject}
                </p>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewTemplate(tpl)}
                    className="flex-1 gap-1.5 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300"
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setEditingTemplate(tpl); setShowEditor(true); }}
                    className="flex-1 gap-1.5 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                  {!tpl.isDefault && (
                    confirmDeleteId === tpl.id ? (
                      <div className="flex gap-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => { deleteMutation.mutate({ id: tpl.id }); setConfirmDeleteId(null); }}
                          className="text-xs px-2"
                        >
                          Yes
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs px-2"
                        >
                          No
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmDeleteId(tpl.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )
                  )}
                </div>
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
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Eye className="h-6 w-6 text-purple-600" />
                {previewTemplate.name}
              </DialogTitle>
              <DialogDescription className="text-base">
                Subject: <span className="font-semibold text-gray-700">{previewTemplate.subject}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white shadow-inner">
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Email Preview</span>
              </div>
              <div className="p-6 overflow-y-auto" style={{ maxHeight: '60vh' }}>
                <div dangerouslySetInnerHTML={{ __html: previewTemplate.htmlContent }} />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setEditingTemplate(previewTemplate);
                  setPreviewTemplate(null);
                  setShowEditor(true);
                }}
                className="btn-vibrant gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Edit This Template
              </Button>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
            Email Campaigns
          </h2>
          <p className="text-base text-foreground/70 mt-1">Create and manage your promotional email campaigns</p>
        </div>
        <Button onClick={() => setShowComposer(true)} className="btn-vibrant gap-2 shadow-lg h-11 px-6">
          <Sparkles className="h-5 w-5" />
          Create Campaign
        </Button>
      </div>

      {/* Empty State */}
      {(!campaigns || campaigns.length === 0) && (
        <Card className="border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50/50 to-blue-50/50">
          <CardContent className="py-20 text-center">
            <div className="inline-block p-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl mb-6">
              <Send className="h-16 w-16 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Start Reaching Your Audience</h3>
            <p className="text-base text-gray-600 mb-6 max-w-md mx-auto">
              Create beautiful email campaigns to promote your events, courses, and classes
            </p>
            <Button onClick={() => setShowComposer(true)} className="btn-vibrant gap-2 px-8 h-11">
              <Sparkles className="h-5 w-5" />
              Create Your First Campaign
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {campaigns?.map((campaign) => (
          <Card key={campaign.id} className="border-2 border-gray-200 hover:border-purple-400 hover:shadow-lg transition-all group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                      {campaign.name}
                    </h3>
                    <StatusBadge status={campaign.status || "draft"} />
                    {campaign.segment !== "all" && (
                      <Badge variant="outline" className="text-xs capitalize bg-purple-50 text-purple-600 border-purple-200">
                        {campaign.segment}
                      </Badge>
                    )}
                  </div>
                  <p className="text-base text-gray-600 mb-3 line-clamp-1">{campaign.subject}</p>
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    {campaign.status === "sent" && (
                      <>
                        <span className="flex items-center gap-1.5 font-medium">
                          <Users className="h-4 w-4 text-purple-600" />
                          <span className="text-gray-900">{campaign.totalSent}</span> sent
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <Eye className="h-4 w-4 text-blue-600" />
                          <span className="text-gray-900">{campaign.totalOpened}</span> opened
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <MousePointer className="h-4 w-4 text-green-600" />
                          <span className="text-gray-900">{campaign.totalClicked}</span> clicked
                        </span>
                      </>
                    )}
                    {campaign.status === "scheduled" && campaign.scheduledAt && (
                      <span className="flex items-center gap-1.5 text-blue-600 font-medium">
                        <Clock className="h-4 w-4" />
                        Scheduled: {new Date(campaign.scheduledAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    )}
                    {campaign.sentAt && (
                      <span className="flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        {new Date(campaign.sentAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {campaign.status === "sent" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDetailCampaignId(campaign.id)}
                        className="gap-1.5 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300"
                      >
                        <BarChart2 className="h-4 w-4" /> Stats
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="gap-1.5 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                      >
                        <Link href={`/email-marketing/campaigns/${campaign.id}`}>
                          <Eye className="h-4 w-4" /> View
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
                      className="gap-1.5 border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600"
                    >
                      {sendMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Send Now
                    </Button>
                  )}
                  {confirmDeleteId === campaign.id ? (
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => { deleteMutation.mutate({ id: campaign.id }); setConfirmDeleteId(null); }}
                        className="px-4"
                      >
                        Confirm
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-4"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmDeleteId(campaign.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 hover:border-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30">
      <div className="container py-8 pt-24">
        {/* Page Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-lg">
                <Mail className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600">
                  Email Marketing
                </h1>
                <p className="text-base text-gray-600 mt-1">Create beautiful campaigns and reach your community</p>
              </div>
            </div>
            <Link href="/admin">
              <Button variant="outline" className="gap-2 border-purple-200 hover:bg-purple-50">
                <ChevronRight className="h-4 w-4 rotate-180" />
                Back to Admin
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="templates" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl h-14 bg-white border-2 border-gray-200 shadow-sm p-1">
            <TabsTrigger
              value="templates"
              className="flex items-center gap-2 text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
            >
              <LayoutTemplate className="h-5 w-5" />
              <span>Templates</span>
            </TabsTrigger>
            <TabsTrigger
              value="campaigns"
              className="flex items-center gap-2 text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
            >
              <Send className="h-5 w-5" />
              <span>Campaigns</span>
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="flex items-center gap-2 text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
            >
              <BarChart2 className="h-5 w-5" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="mt-8">
            <TemplatesTab />
          </TabsContent>
          <TabsContent value="campaigns" className="mt-8">
            <CampaignsTab />
          </TabsContent>
          <TabsContent value="analytics" className="mt-8">
            <AnalyticsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
