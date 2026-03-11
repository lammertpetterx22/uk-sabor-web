import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "../_core/hooks/useAuth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Mail,
  MousePointerClick,
  Users,
  TrendingUp,
  Eye,
  Link2,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-zinc-700 text-zinc-200",
    scheduled: "bg-blue-900 text-blue-200",
    sending: "bg-yellow-900 text-yellow-200",
    sent: "bg-green-900 text-green-200",
    failed: "bg-red-900 text-red-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[status] ?? "bg-zinc-700 text-zinc-200"}`}
    >
      {status}
    </span>
  );
}

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const campaignId = parseInt(id ?? "0", 10);
  const { user } = useAuth();

  const { data, isLoading, error } = trpc.emailMarketing.getCampaignDetail.useQuery(
    { id: campaignId },
    { enabled: !!campaignId && user?.role === "admin" }
  );

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-red-400">Campaign not found.</p>
      </div>
    );
  }

  const { campaign, contactEngagement, topLinks, uniqueOpeners, uniqueClickers, openRate, clickRate } = data;

  const statCards = [
    {
      label: "Sent",
      value: campaign.totalSent ?? 0,
      icon: Mail,
      color: "text-blue-400",
    },
    {
      label: "Unique Openers",
      value: uniqueOpeners,
      icon: Eye,
      color: "text-green-400",
      sub: `${openRate}% open rate`,
    },
    {
      label: "Unique Clickers",
      value: uniqueClickers,
      icon: MousePointerClick,
      color: "text-purple-400",
      sub: `${clickRate}% click rate`,
    },
    {
      label: "Engaged Contacts",
      value: contactEngagement.length,
      icon: Users,
      color: "text-pink-400",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/email-marketing">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Campaigns
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{campaign.name}</h1>
            <p className="text-sm text-muted-foreground truncate">{campaign.subject}</p>
          </div>
          <StatusBadge status={campaign.status ?? "draft"} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Campaign meta */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <Card key={s.label} className="bg-card border-border">
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-background ${s.color}`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    {s.sub && <p className="text-xs text-accent">{s.sub}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sent / Scheduled info */}
        <Card className="bg-card border-border">
          <CardContent className="pt-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Created</p>
                <p>{formatDate(campaign.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Sent At</p>
                <p>{formatDate(campaign.sentAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Audience</p>
                <p className="capitalize">{campaign.segment ?? "all"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Total Recipients</p>
                <p>{campaign.totalRecipients ?? campaign.totalSent ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="contacts">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="contacts">
              <Users className="w-4 h-4 mr-1" />
              Contact Engagement ({contactEngagement.length})
            </TabsTrigger>
            <TabsTrigger value="links">
              <Link2 className="w-4 h-4 mr-1" />
              Top Links ({topLinks.length})
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="w-4 h-4 mr-1" />
              Email Preview
            </TabsTrigger>
          </TabsList>

          {/* Per-contact engagement table */}
          <TabsContent value="contacts">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Per-Contact Engagement</CardTitle>
                <CardDescription>
                  Every contact who opened or clicked this campaign, sorted by total engagement.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {contactEngagement.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No engagement data yet</p>
                    <p className="text-sm mt-1">
                      Data appears here once contacts open or click the email.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Contact</TableHead>
                          <TableHead className="text-center">Opened</TableHead>
                          <TableHead>First Opened</TableHead>
                          <TableHead className="text-center">Clicked</TableHead>
                          <TableHead>First Clicked</TableHead>
                          <TableHead>Clicked URLs</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contactEngagement.map((c) => (
                          <TableRow key={c.contactId}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{c.name}</p>
                                <p className="text-xs text-muted-foreground">{c.email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {c.openCount > 0 ? (
                                <span className="inline-flex items-center gap-1 text-green-400 font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {c.openCount}
                                </span>
                              ) : (
                                <XCircle className="w-4 h-4 text-muted-foreground mx-auto" />
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(c.firstOpenedAt)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              {c.clickCount > 0 ? (
                                <span className="inline-flex items-center gap-1 text-purple-400 font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {c.clickCount}
                                </span>
                              ) : (
                                <XCircle className="w-4 h-4 text-muted-foreground mx-auto" />
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(c.firstClickedAt)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {c.clickedUrls.slice(0, 3).map((url) => (
                                  <a
                                    key={url}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-accent hover:underline truncate max-w-[120px] block"
                                    title={url ?? ""}
                                  >
                                    {url.replace(/^https?:\/\/[^/]+/, "") || url}
                                  </a>
                                ))}
                                {c.clickedUrls.length > 3 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{c.clickedUrls.length - 3} more
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top links */}
          <TabsContent value="links">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Top Clicked Links</CardTitle>
                <CardDescription>
                  Links in this campaign ordered by total click count.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topLinks.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Link2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No clicks recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topLinks.map((link, i) => {
                      const maxCount = topLinks[0]?.count ?? 1;
                      const pct = Math.round((link.count / maxCount) * 100);
                      return (
                        <div key={link.url} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-muted-foreground w-5 text-right shrink-0">
                                #{i + 1}
                              </span>
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent hover:underline truncate"
                                title={link.url}
                              >
                                {link.url}
                              </a>
                            </div>
                            <span className="font-bold shrink-0 ml-4">
                              {link.count} click{link.count !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email preview */}
          <TabsContent value="preview">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Email Preview</CardTitle>
                <CardDescription>
                  Rendered HTML as contacts received it (tracking pixel stripped for preview).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg overflow-hidden border border-border">
                  <iframe
                    srcDoc={campaign.htmlContent.replace(
                      /<img[^>]*track\/open[^>]*>/gi,
                      "<!-- tracking pixel removed -->"
                    )}
                    className="w-full"
                    style={{ height: "600px", border: "none", background: "#fff" }}
                    sandbox="allow-same-origin"
                    title="Email preview"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
