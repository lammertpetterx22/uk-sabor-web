import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const changeMutation = trpc.adminAuth.changePassword.useMutation({
    onSuccess: () => {
      toast.success("✅ Contraseña actualizada");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas nuevas no coinciden");
      return;
    }
    changeMutation.mutate({
      currentPassword: currentPassword || undefined,
      newPassword,
    });
  };

  return (
    <Card className="border-border/40 shadow-lg">
      <CardHeader className="border-b border-border/40 pb-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/15">
            <Lock className="h-5 w-5 text-accent" />
          </div>
          <div>
            <CardTitle className="text-xl">Cambiar Contraseña</CardTitle>
            <CardDescription>Actualiza la contraseña de tu cuenta</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="current-password">Contraseña actual</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-background border-border/50 h-11 pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowCurrent(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-foreground/50">
              Déjalo vacío si todavía no tienes contraseña (cuenta creada por invitación).
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">Nueva contraseña</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="bg-background border-border/50 h-11 pr-10"
                autoComplete="new-password"
                minLength={6}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar nueva contraseña</Label>
            <Input
              id="confirm-password"
              type={showNew ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la nueva contraseña"
              className="bg-background border-border/50 h-11"
              autoComplete="new-password"
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            disabled={changeMutation.isPending || !newPassword || !confirmPassword}
            className="btn-vibrant w-full h-11 mt-2"
          >
            {changeMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando…</>
            ) : (
              <><Lock className="h-4 w-4 mr-2" /> Actualizar contraseña</>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
