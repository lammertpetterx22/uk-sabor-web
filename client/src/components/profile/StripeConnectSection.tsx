import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle2, AlertCircle, Loader2, ExternalLink, Banknote } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

/**
 * Stripe Connect onboarding + status card.
 *
 * Shows:
 * - Current status (none / pending / verified / restricted)
 * - Button to start onboarding (new accounts)
 * - Button to continue onboarding (pending accounts)
 * - Button to open Stripe dashboard (verified accounts)
 */
export default function StripeConnectSection() {
  const search = useSearch();
  const statusQuery = trpc.stripeConnect.getMyStatus.useQuery();
  const refreshMutation = trpc.stripeConnect.refreshStatus.useMutation();
  const createLinkMutation = trpc.stripeConnect.createOnboardingLink.useMutation();
  const dashboardMutation = trpc.stripeConnect.createDashboardLink.useMutation();

  const [isProcessing, setIsProcessing] = useState(false);

  // When the user returns from Stripe onboarding (?stripe=success) — refresh status
  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get("stripe") === "success" || params.get("stripe") === "refresh") {
      (async () => {
        try {
          await refreshMutation.mutateAsync();
          await statusQuery.refetch();
          if (params.get("stripe") === "success") {
            toast.success("✅ Stripe status updated");
          }
          // Clean URL
          const url = new URL(window.location.href);
          url.searchParams.delete("stripe");
          window.history.replaceState({}, "", url.toString());
        } catch {}
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleConnect = async () => {
    setIsProcessing(true);
    try {
      const { url } = await createLinkMutation.mutateAsync();
      window.location.href = url;
    } catch (err: any) {
      toast.error(err.message || "Could not start Stripe onboarding");
      setIsProcessing(false);
    }
  };

  const handleOpenDashboard = async () => {
    setIsProcessing(true);
    try {
      const { url } = await dashboardMutation.mutateAsync();
      window.open(url, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Could not open Stripe dashboard");
    } finally {
      setIsProcessing(false);
    }
  };

  const status = statusQuery.data?.status || "none";

  const statusBadge = {
    none: <Badge variant="outline" className="bg-foreground/5 text-foreground/60">No conectada</Badge>,
    pending: <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30">Pendiente de verificación</Badge>,
    verified: <Badge className="bg-green-500/15 text-green-500 border-green-500/30"><CheckCircle2 className="h-3 w-3 mr-1" /> Verificada</Badge>,
    restricted: <Badge className="bg-red-500/15 text-red-500 border-red-500/30"><AlertCircle className="h-3 w-3 mr-1" /> Requiere acción</Badge>,
  }[status];

  return (
    <Card className="border-border/40 shadow-lg">
      <CardHeader className="border-b border-border/40 pb-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/15">
              <CreditCard className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-xl">Cuenta Stripe</CardTitle>
              <CardDescription>Conecta tu cuenta para recibir pagos automáticos</CardDescription>
            </div>
          </div>
          {statusBadge}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {status === "none" && (
          <>
            <div className="rounded-lg border border-border/50 bg-background/40 p-4 text-sm text-foreground/80 space-y-2">
              <p>🔒 Stripe es gratis y seguro — se usa Stripe Express para que sea lo más simple posible.</p>
              <p>Te pedirán: <strong>DNI/pasaporte, foto, dirección y datos bancarios UK</strong>. Tarda 5-15 min.</p>
              <p>Una vez verificada, tus ventas se te pagarán automáticamente a tu banco cada semana — sin tener que pedir retiros manuales.</p>
            </div>
            <Button
              type="button"
              onClick={handleConnect}
              disabled={isProcessing || createLinkMutation.isPending}
              className="btn-vibrant w-full h-11"
            >
              {isProcessing || createLinkMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Abriendo Stripe…</>
              ) : (
                <><CreditCard className="h-4 w-4 mr-2" /> Conectar con Stripe</>
              )}
            </Button>
          </>
        )}

        {status === "pending" && (
          <>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300/90 space-y-2">
              <p>📋 Tu cuenta está casi lista. Completa el onboarding en Stripe para empezar a recibir pagos.</p>
            </div>
            <Button
              type="button"
              onClick={handleConnect}
              disabled={isProcessing || createLinkMutation.isPending}
              className="btn-vibrant w-full h-11"
            >
              {isProcessing || createLinkMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Abriendo Stripe…</>
              ) : (
                <>Completar verificación <ExternalLink className="h-4 w-4 ml-2" /></>
              )}
            </Button>
          </>
        )}

        {status === "restricted" && (
          <>
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300/90 space-y-2">
              <p>⚠️ Stripe necesita información adicional de tu cuenta. Por favor complétala.</p>
            </div>
            <Button
              type="button"
              onClick={handleConnect}
              disabled={isProcessing || createLinkMutation.isPending}
              variant="outline"
              className="w-full h-11"
            >
              Actualizar información <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </>
        )}

        {status === "verified" && (
          <>
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300/90 space-y-1.5">
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                <span><strong>Payouts habilitados</strong> — recibirás tu dinero automáticamente</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span><strong>Identidad verificada</strong> por Stripe</span>
              </div>
            </div>
            <Button
              type="button"
              onClick={handleOpenDashboard}
              disabled={isProcessing || dashboardMutation.isPending}
              variant="outline"
              className="w-full h-11"
            >
              {dashboardMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Abriendo…</>
              ) : (
                <>Abrir dashboard de Stripe <ExternalLink className="h-4 w-4 ml-2" /></>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
