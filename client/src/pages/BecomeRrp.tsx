import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Megaphone, CheckCircle2, Clock, XCircle, ArrowRight, Crown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const TIERS = [
  { label: "Bronze",   sales: 0,   minCommission: 15 },
  { label: "Silver",    sales: 15,  minCommission: 20 },
  { label: "Gold",      sales: 40,  minCommission: 25 },
  { label: "Platinum",  sales: 100, minCommission: 30 },
  { label: "Diamond", sales: 250, minCommission: 40 },
];

export default function BecomeRrp() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading } = useAuth();

  const [motivation, setMotivation] = useState("");
  const [socialHandle, setSocialHandle] = useState("");
  const [phone, setPhone] = useState("");

  const myAppQuery = trpc.rrp.getMyApplication.useQuery(undefined, { enabled: isAuthenticated });

  const applyMutation = trpc.rrp.submit.useMutation({
    onSuccess: () => {
      toast.success("✅ Application submitted — we will notify you when reviewed");
      myAppQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>You need an account to apply as RRP</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="btn-vibrant w-full" onClick={() => setLocation("/login?redirect=/become-rrp")}>
              Sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const profile = myAppQuery.data?.profile;
  const app = myAppQuery.data?.application;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (motivation.trim().length < 10) {
      toast.error("Tell us a bit more (min 10 characters)");
      return;
    }
    applyMutation.mutate({
      motivation: motivation.trim(),
      socialHandle: socialHandle.trim() || undefined,
      phone: phone.trim() || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container max-w-3xl space-y-8">
        {/* Hero */}
        <Card className="border-none bg-gradient-to-br from-[#FA3698]/10 to-purple-500/10 overflow-hidden">
          <CardContent className="p-8 md:p-10 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#FA3698] to-[#FD4D43] shadow-lg">
              <Megaphone className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold gradient-text">Become an RRP at UK Sabor</h1>
            <p className="text-foreground/70 max-w-2xl mx-auto">
              Earn money selling event tickets with your unique code. The more sales, the higher commission and the bigger the discount for your contacts.
            </p>
          </CardContent>
        </Card>

        {/* State cards */}
        {profile && (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <div>
                  <CardTitle className="text-green-500">You are already an RRP 🎉</CardTitle>
                  <CardDescription>Your code is <span className="font-mono font-bold text-accent">{profile.code}</span></CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setLocation("/rrp-dashboard")} className="btn-vibrant">
                Go to RRP dashboard <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {!profile && app?.status === "pending" && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-amber-500" />
                <div>
                  <CardTitle className="text-amber-500">Application pending</CardTitle>
                  <CardDescription>We are reviewing your application. We will notify you soon.</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {!profile && app?.status === "rejected" && (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <XCircle className="h-6 w-6 text-red-500" />
                <div>
                  <CardTitle className="text-red-500">Application rejected</CardTitle>
                  <CardDescription>{app.adminNotes || "You can reapply if your situation has changed."}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Tiers */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-accent" />
              <CardTitle>Tiers and Commissions</CardTitle>
            </div>
            <CardDescription>Tier up automatically when you hit sales milestones.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {TIERS.map((t) => (
                <div key={t.label} className="rounded-lg border border-border/50 bg-background/40 p-4 text-center space-y-2">
                  <div className="font-bold text-lg">{t.label}</div>
                  <div className="text-xs text-foreground/60">{t.sales}+ sales</div>
                  <Badge className="bg-gradient-to-r from-[#FA3698] to-purple-600 text-white border-0">
                    {t.minCommission}% min
                  </Badge>
                </div>
              ))}
            </div>
            <p className="text-xs text-foreground/50 mt-4 text-center">
              Absolute max: 40% per sale. The organiser decides the exact commission (between your tier minimum and 40%) and the customer discount.
            </p>
          </CardContent>
        </Card>

        {/* Application form */}
        {!profile && (!app || app.status === "rejected") && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                <CardTitle>{app?.status === "rejected" ? "Resubmit application" : "Apply as RRP"}</CardTitle>
              </div>
              <CardDescription>Tell us a bit about yourself. The admin reviews each application.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="motivation">Why do you want to be an RRP? *</Label>
                  <Textarea
                    id="motivation"
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    placeholder="Tell us about your network, how many people you know in the Latin scene, your experience promoting events, etc."
                    rows={5}
                    className="bg-background border-border/50"
                    minLength={10}
                    maxLength={2000}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="social">Instagram / TikTok (optional)</Label>
                  <Input
                    id="social"
                    value={socialHandle}
                    onChange={(e) => setSocialHandle(e.target.value)}
                    placeholder="@your_handle"
                    className="bg-background border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp (optional)</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+44 7..."
                    className="bg-background border-border/50"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={applyMutation.isPending || motivation.trim().length < 10}
                  className="btn-vibrant w-full h-11"
                >
                  {applyMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…</>
                  ) : (
                    <><Megaphone className="h-4 w-4 mr-2" /> Submit application</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
