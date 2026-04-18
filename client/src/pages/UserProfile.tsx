import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, User, Mail, Upload, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BillingSection from "@/components/profile/BillingSection";
import ChangePasswordSection from "@/components/profile/ChangePasswordSection";
import { UserCoursesTab } from "@/components/dashboard/CoursesTab";
import { logger } from "@/lib/logger";

export default function UserProfile() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading, refresh } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    avatarUrl: "",
  });

  const updateProfileMutation = trpc.auth.updateProfile.useMutation();
  const uploadFileMutation = trpc.uploads.uploadFile.useMutation();

  // Sync form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        bio: user.bio || "",
        avatarUrl: user.avatarUrl || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (!loading && (!isAuthenticated || !user)) {
      setLocation("/login");
    }
  }, [loading, isAuthenticated, user, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleImageUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe pesar menos de 5MB');
      return;
    }

    setIsUploading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const result = await uploadFileMutation.mutateAsync({
        fileBase64: base64Data,
        fileName: file.name,
      });

      setFormData(prev => ({ ...prev, avatarUrl: result.url }));
      toast.success('Foto de perfil subida correctamente');
    } catch (err: any) {
      logger.error('Image upload failed', err);
      toast.error('Error al subir: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfileMutation.mutateAsync({
        name: formData.name,
        bio: formData.bio,
        avatarUrl: formData.avatarUrl,
      });
      await refresh();
      toast.success("¡Perfil actualizado correctamente!");
      setIsEditing(false);
    } catch (error: any) {
      toast.error("Error al actualizar el perfil: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container max-w-2xl">
        {/* Tabs for Profile and Billing */}
        <Tabs defaultValue="perfil" className="w-full">
          <TabsList className={`w-full ${(user?.role === "admin" || user?.role === "instructor" || user?.role === "promoter") ? 'grid-cols-3' : 'grid-cols-2'} grid bg-card/60 backdrop-blur-xl border border-border/40 mb-8 p-1 h-12 rounded-xl`}>
            <TabsTrigger value="perfil" className="rounded-lg data-[state=active]:bg-accent data-[state=active]:text-white">
              Perfil
            </TabsTrigger>
            <TabsTrigger value="cursos" className="rounded-lg data-[state=active]:bg-accent data-[state=active]:text-white">
              Cursos
            </TabsTrigger>
            {/* Only show Billing tab for instructors, promoters, and admins */}
            {(user?.role === "admin" || user?.role === "instructor" || user?.role === "promoter") && (
              <TabsTrigger value="billing" className="rounded-lg data-[state=active]:bg-accent data-[state=active]:text-white">
                Facturación
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="perfil" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none">
            {/* Profile Header */}
            <Card className="border-none bg-card/60 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative group">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gradient-to-br from-accent to-primary flex items-center justify-center border-4 border-background shadow-lg">
                      {formData.avatarUrl ? (
                        <img src={formData.avatarUrl} alt={user.name || "Avatar"} className="w-full h-full object-cover" />
                      ) : (
                        <User size={48} className="text-white opacity-80" />
                      )}
                    </div>

                    {isEditing && (
                      <label
                        className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity"
                        onClick={() => imageInputRef.current?.click()}
                      >
                        {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                      </label>
                    )}

                    <input
                      type="file"
                      ref={imageInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleImageUpload(e.target.files[0]);
                      }}
                    />
                  </div>

                  <div className="text-center sm:text-left">
                    <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                      {user.name || "Mi Perfil"}
                    </CardTitle>
                    <CardDescription className="text-lg mt-1 flex items-center justify-center sm:justify-start gap-2">
                      <Mail className="w-4 h-4" /> {user.email}
                    </CardDescription>
                    <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-accent/20 text-accent text-sm font-medium border border-accent/20">
                      Plan: {user.subscriptionPlan.charAt(0).toUpperCase() + user.subscriptionPlan.slice(1)}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Profile Edit Form */}
            <Card className="border-border/40 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-6 mb-6">
                <div>
                  <CardTitle className="text-xl">Información del Perfil</CardTitle>
                  <CardDescription>
                    {isEditing ? "Actualiza tus datos públicos" : "Tus datos actuales"}
                  </CardDescription>
                </div>
                {!isEditing && (
                  <Button onClick={() => setIsEditing(true)} variant="outline" className="h-9 px-4">
                    Editar Perfil
                  </Button>
                )}
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Name */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
                    <User size={16} className="text-accent" />
                    Nombre Completo
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Tu nombre y apellido"
                      className="bg-background border-border/50 h-11"
                    />
                  ) : (
                    <div className="p-3 bg-card/30 rounded-lg border border-border/20">
                      <p className="text-foreground">{formData.name || "No proporcionado"}</p>
                    </div>
                  )}
                </div>

                {/* Email (Read Only) */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
                    <Mail size={16} className="text-muted-foreground" />
                    Correo Electrónico (Solo Lectura)
                  </label>
                  <div className="p-3 bg-background/50 rounded-lg border border-border/20">
                    <p className="text-foreground/70">{user.email}</p>
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
                    <CheckCircle size={16} className="text-accent" />
                    Biografía
                  </label>
                  {isEditing ? (
                    <Textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Cuéntanos un poco sobre ti y tu experiencia con el baile..."
                      rows={5}
                      className="bg-background border-border/50 resize-none"
                    />
                  ) : (
                    <div className="p-4 bg-card/30 rounded-lg border border-border/20 min-h-[100px]">
                      <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                        {formData.bio || "Aún no has escrito una biografía."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex gap-4 pt-6 border-t border-border/40 mt-8">
                    <Button
                      onClick={() => {
                        setIsEditing(false);
                        // Reset to initial
                        setFormData({
                          name: user.name || "",
                          bio: user.bio || "",
                          avatarUrl: user.avatarUrl || "",
                        });
                      }}
                      variant="ghost"
                      disabled={isSaving || isUploading}
                      className="w-1/3 h-11"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving || isUploading}
                      className="btn-vibrant flex-1 h-11"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        "Guardar Cambios"
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Change Password */}
            <ChangePasswordSection />
          </TabsContent>


          <TabsContent value="cursos" className="animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none">
            <UserCoursesTab />
          </TabsContent>

          {/* Only show Billing content for instructors, promoters, and admins */}
          {(user?.role === "admin" || user?.role === "instructor" || user?.role === "promoter") && (
            <TabsContent value="billing" className="animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none">
              <BillingSection />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
