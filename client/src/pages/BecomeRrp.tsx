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
  { label: "Bronce",   sales: 0,   minCommission: 15 },
  { label: "Plata",    sales: 15,  minCommission: 20 },
  { label: "Oro",      sales: 40,  minCommission: 25 },
  { label: "Platino",  sales: 100, minCommission: 30 },
  { label: "Diamante", sales: 250, minCommission: 40 },
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
      toast.success("✅ Solicitud enviada — te avisaremos cuando sea revisada");
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
            <CardTitle>Inicia sesión</CardTitle>
            <CardDescription>Necesitas una cuenta para aplicar como RRP</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="btn-vibrant w-full" onClick={() => setLocation("/login?redirect=/become-rrp")}>
              Iniciar sesión
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
      toast.error("Cuéntanos un poco más (mínimo 10 caracteres)");
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
            <h1 className="text-3xl md:text-4xl font-bold gradient-text">Hazte RRP en UK Sabor</h1>
            <p className="text-foreground/70 max-w-2xl mx-auto">
              Gana dinero vendiendo entradas de eventos con tu código único. Cuantas más ventas, mayor comisión y mejor descuento para tus contactos.
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
                  <CardTitle className="text-green-500">Ya eres RRP 🎉</CardTitle>
                  <CardDescription>Tu código es <span className="font-mono font-bold text-accent">{profile.code}</span></CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setLocation("/rrp-dashboard")} className="btn-vibrant">
                Ir al dashboard RRP <ArrowRight className="h-4 w-4 ml-2" />
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
                  <CardTitle className="text-amber-500">Solicitud pendiente</CardTitle>
                  <CardDescription>Estamos revisando tu solicitud. Te avisaremos pronto.</CardDescription>
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
                  <CardTitle className="text-red-500">Solicitud rechazada</CardTitle>
                  <CardDescription>{app.adminNotes || "Puedes volver a aplicar si has mejorado tu situación."}</CardDescription>
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
              <CardTitle>Niveles y Comisiones</CardTitle>
            </div>
            <CardDescription>Sube de nivel automáticamente cuando alcances los hitos de ventas.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {TIERS.map((t) => (
                <div key={t.label} className="rounded-lg border border-border/50 bg-background/40 p-4 text-center space-y-2">
                  <div className="font-bold text-lg">{t.label}</div>
                  <div className="text-xs text-foreground/60">{t.sales}+ ventas</div>
                  <Badge className="bg-gradient-to-r from-[#FA3698] to-purple-600 text-white border-0">
                    {t.minCommission}% mín
                  </Badge>
                </div>
              ))}
            </div>
            <p className="text-xs text-foreground/50 mt-4 text-center">
              Tope máximo absoluto: 40% por venta. El organizador del evento decide la comisión exacta (entre el mínimo de tu rango y 40%) y el descuento para el cliente.
            </p>
          </CardContent>
        </Card>

        {/* Application form */}
        {!profile && (!app || app.status === "rejected") && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                <CardTitle>{app?.status === "rejected" ? "Reenviar solicitud" : "Aplicar como RRP"}</CardTitle>
              </div>
              <CardDescription>Cuéntanos un poco sobre ti. El admin revisa cada solicitud.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="motivation">¿Por qué quieres ser RRP? *</Label>
                  <Textarea
                    id="motivation"
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    placeholder="Cuéntanos sobre tu red, cuánta gente conoces en la escena latina, tu experiencia promocionando eventos, etc."
                    rows={5}
                    className="bg-background border-border/50"
                    minLength={10}
                    maxLength={2000}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="social">Instagram / TikTok (opcional)</Label>
                  <Input
                    id="social"
                    value={socialHandle}
                    onChange={(e) => setSocialHandle(e.target.value)}
                    placeholder="@tu_usuario"
                    className="bg-background border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp (opcional)</Label>
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
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando…</>
                  ) : (
                    <><Megaphone className="h-4 w-4 mr-2" /> Enviar solicitud</>
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
