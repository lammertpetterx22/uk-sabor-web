import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, User, Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function UserProfile() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
  });

  // Sync form data when user loads
  useState(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
      }));
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // TODO: Add tRPC mutation to update profile on server
      toast.success("Profile actualizado correctamente!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Error al actualizar el perfil");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-8 pt-24">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                <User size={32} className="text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">{user?.name || "Mi Profile"}</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Profile Edit Form */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Information del Profile</CardTitle>
              <CardDescription>
                {isEditing ? "Edita tus datos" : "Tus datos de perfil"}
              </CardDescription>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                Edit
              </Button>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User size={16} />
                Name Completo
              </label>
              {isEditing ? (
                <Input
                  value={formData.name || user?.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Tu nombre"
                  className="bg-card/50 border-border/50"
                />
              ) : (
                <p className="text-foreground/80">{user?.name || "No proporcionado"}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail size={16} />
                Email
              </label>
              {isEditing ? (
                <Input
                  type="email"
                  value={formData.email || user?.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="tu@email.com"
                  className="bg-card/50 border-border/50"
                />
              ) : (
                <p className="text-foreground/80">{user?.email || "Not provided"}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Phone size={16} />
                Phone
              </label>
              {isEditing ? (
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+44 123 456 7890"
                  className="bg-card/50 border-border/50"
                />
              ) : (
                <p className="text-foreground/80">{formData.phone || "Not provided"}</p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MapPin size={16} />
                Location
              </label>
              {isEditing ? (
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="City, Country"
                  className="bg-card/50 border-border/50"
                />
              ) : (
                <p className="text-foreground/80">{formData.location || "Not provided"}</p>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Bio</label>
              {isEditing ? (
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="bg-card/50 border-border/50"
                />
              ) : (
                <p className="text-foreground/80">{formData.bio || "Not provided"}</p>
              )}
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="btn-vibrant flex-1"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Save Cambios"
                  )}
                </Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  disabled={isSaving}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
