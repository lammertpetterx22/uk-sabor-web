import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, Loader2, Music, Calendar, GraduationCap, Star } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useNavigate } from "react-router-dom";

const applicationSchema = z.object({
  requestType: z.enum(["instructor", "promoter"]),
  fullName: z.string().min(1, "El nombre completo es requerido"),
  email: z.string().email("Email válido es requerido"),
  phone: z.string().optional(),
  bio: z.string().min(10, "Por favor cuéntanos sobre ti (mínimo 10 caracteres)"),
  experience: z.string().min(10, "Por favor describe tu experiencia (mínimo 10 caracteres)"),
  specialties: z.string().optional(), // Comma-separated dance styles
  instagramHandle: z.string().optional(),
  websiteUrl: z.string().optional(),
  interestedInEvents: z.boolean().default(false),
  interestedInClasses: z.boolean().default(false),
  interestedInCourses: z.boolean().default(false),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

export default function BecomeInstructor() {
  const { user, isLoading: userLoading } = useUser();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<"instructor" | "promoter">("instructor");

  // Get user's application status
  const { data: existingApplication, isLoading: appLoading } = trpc.admin.getMyApplication.useQuery(undefined, {
    enabled: !!user,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      requestType: "instructor",
      fullName: user?.name || "",
      email: user?.email || "",
      interestedInEvents: false,
      interestedInClasses: false,
      interestedInCourses: false,
    },
  });

  const interestedInEvents = watch("interestedInEvents");
  const interestedInClasses = watch("interestedInClasses");
  const interestedInCourses = watch("interestedInCourses");

  const submitApplication = trpc.admin.submitInstructorApplication.useMutation({
    onSuccess: () => {
      // Refetch application status
      window.location.reload();
    },
  });

  const onSubmit = (data: ApplicationFormData) => {
    const specialtiesArray = data.specialties
      ? data.specialties.split(",").map(s => s.trim()).filter(Boolean)
      : [];

    submitApplication.mutate({
      ...data,
      specialties: specialtiesArray,
    });
  };

  if (userLoading || appLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Autenticación Requerida</CardTitle>
            <CardDescription>Debes iniciar sesión para solicitar ser instructor o promotor</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/login")} className="w-full">
              Iniciar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user already has an application, show status
  if (existingApplication) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Estado de tu Solicitud</CardTitle>
              <CardDescription>
                Enviaste una solicitud el {new Date(existingApplication.requestedAt).toLocaleDateString("es-ES")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Estado:</span>
                {existingApplication.status === "pending" && (
                  <Badge variant="outline" className="flex items-center gap-2 text-amber-600 border-amber-300">
                    <Clock className="w-4 h-4" />
                    Pendiente de Revisión
                  </Badge>
                )}
                {existingApplication.status === "approved" && (
                  <Badge variant="outline" className="flex items-center gap-2 text-green-600 border-green-300">
                    <CheckCircle2 className="w-4 h-4" />
                    Aprobado
                  </Badge>
                )}
                {existingApplication.status === "rejected" && (
                  <Badge variant="outline" className="flex items-center gap-2 text-red-600 border-red-300">
                    <XCircle className="w-4 h-4" />
                    Rechazado
                  </Badge>
                )}
              </div>

              {/* Application Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Tipo de Solicitud:</p>
                  <p className="text-base capitalize">{existingApplication.requestType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Nombre Completo:</p>
                  <p className="text-base">{existingApplication.fullName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Email:</p>
                  <p className="text-base">{existingApplication.email}</p>
                </div>
                {existingApplication.phone && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Teléfono:</p>
                    <p className="text-base">{existingApplication.phone}</p>
                  </div>
                )}
              </div>

              {/* Interested In */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Interesado en publicar:</p>
                <div className="flex flex-wrap gap-2">
                  {existingApplication.interestedInEvents && (
                    <Badge variant="secondary">
                      <Calendar className="w-3 h-3 mr-1" />
                      Eventos
                    </Badge>
                  )}
                  {existingApplication.interestedInClasses && (
                    <Badge variant="secondary">
                      <Music className="w-3 h-3 mr-1" />
                      Clases
                    </Badge>
                  )}
                  {existingApplication.interestedInCourses && (
                    <Badge variant="secondary">
                      <GraduationCap className="w-3 h-3 mr-1" />
                      Cursos
                    </Badge>
                  )}
                </div>
              </div>

              {/* Admin Notes (if rejected) */}
              {existingApplication.status === "rejected" && existingApplication.adminNotes && (
                <Alert>
                  <AlertDescription>
                    <strong>Nota del Administrador:</strong>
                    <p className="mt-2">{existingApplication.adminNotes}</p>
                  </AlertDescription>
                </Alert>
              )}

              {/* Status Messages */}
              {existingApplication.status === "pending" && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Tu solicitud está siendo revisada. Te notificaremos cuando haya una actualización.
                  </AlertDescription>
                </Alert>
              )}

              {existingApplication.status === "approved" && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    ¡Felicitaciones! Tu solicitud ha sido aprobada. Ahora puedes empezar a publicar contenido en la
                    plataforma.
                  </AlertDescription>
                </Alert>
              )}

              {existingApplication.status === "rejected" && (
                <div className="space-y-4">
                  <Alert className="border-red-200 bg-red-50">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      Tu solicitud fue rechazada. Puedes enviar una nueva solicitud cuando estés listo.
                    </AlertDescription>
                  </Alert>
                  <Button onClick={() => window.location.reload()} className="w-full">
                    Enviar Nueva Solicitud
                  </Button>
                </div>
              )}

              <Button variant="outline" onClick={() => navigate("/dashboard")} className="w-full">
                Volver al Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Application Form
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Conviértete en Instructor o Promotor</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Comparte tu pasión por la danza con nuestra comunidad. Publica eventos, clases y cursos en nuestra
            plataforma.
          </p>
        </div>

        {/* Type Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card
            className={`cursor-pointer transition-all ${
              selectedType === "instructor"
                ? "ring-2 ring-purple-600 border-purple-600"
                : "hover:border-purple-300"
            }`}
            onClick={() => {
              setSelectedType("instructor");
              setValue("requestType", "instructor");
            }}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Instructor</CardTitle>
                  <CardDescription>Imparte clases y cursos de danza</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Publica clases presenciales y virtuales</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Crea cursos completos con lecciones grabadas</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Organiza eventos y talleres</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${
              selectedType === "promoter" ? "ring-2 ring-purple-600 border-purple-600" : "hover:border-purple-300"
            }`}
            onClick={() => {
              setSelectedType("promoter");
              setValue("requestType", "promoter");
            }}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Promotor</CardTitle>
                  <CardDescription>Organiza eventos de danza</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Publica eventos sociales y fiestas</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Gestiona venta de entradas online</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Promociona tus eventos a la comunidad</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Application Form */}
        <Card>
          <CardHeader>
            <CardTitle>Formulario de Solicitud</CardTitle>
            <CardDescription>Completa todos los campos para enviar tu solicitud</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Hidden field for requestType */}
              <input type="hidden" {...register("requestType")} />

              {/* Personal Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Información Personal</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nombre Completo *</Label>
                    <Input id="fullName" {...register("fullName")} placeholder="Tu nombre completo" />
                    {errors.fullName && <p className="text-sm text-red-600">{errors.fullName.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" {...register("email")} placeholder="tu@email.com" />
                    {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" {...register("phone")} placeholder="+44 123 456 7890" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagramHandle">Instagram</Label>
                    <Input id="instagramHandle" {...register("instagramHandle")} placeholder="@tuusuario" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Sitio Web</Label>
                  <Input id="websiteUrl" {...register("websiteUrl")} placeholder="https://tusitio.com" />
                </div>
              </div>

              {/* About You */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Cuéntanos sobre ti</h3>

                <div className="space-y-2">
                  <Label htmlFor="bio">Biografía *</Label>
                  <Textarea
                    id="bio"
                    {...register("bio")}
                    placeholder="Cuéntanos quién eres, tu pasión por la danza..."
                    rows={4}
                  />
                  {errors.bio && <p className="text-sm text-red-600">{errors.bio.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Experiencia *</Label>
                  <Textarea
                    id="experience"
                    {...register("experience")}
                    placeholder="Describe tu experiencia como instructor/promotor, años enseñando, logros..."
                    rows={4}
                  />
                  {errors.experience && <p className="text-sm text-red-600">{errors.experience.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialties">Especialidades (separa con comas)</Label>
                  <Input
                    id="specialties"
                    {...register("specialties")}
                    placeholder="Salsa, Bachata, Reggaeton, Kizomba..."
                  />
                  <p className="text-xs text-gray-500">Ejemplo: Salsa, Bachata, Kizomba</p>
                </div>
              </div>

              {/* Interests */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">¿Qué te gustaría publicar?</h3>
                <p className="text-sm text-gray-600">Selecciona al menos una opción</p>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="interestedInEvents"
                      checked={interestedInEvents}
                      onCheckedChange={(checked) => setValue("interestedInEvents", checked as boolean)}
                    />
                    <Label htmlFor="interestedInEvents" className="cursor-pointer flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      Eventos y talleres
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="interestedInClasses"
                      checked={interestedInClasses}
                      onCheckedChange={(checked) => setValue("interestedInClasses", checked as boolean)}
                    />
                    <Label htmlFor="interestedInClasses" className="cursor-pointer flex items-center gap-2">
                      <Music className="w-4 h-4 text-purple-600" />
                      Clases presenciales
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="interestedInCourses"
                      checked={interestedInCourses}
                      onCheckedChange={(checked) => setValue("interestedInCourses", checked as boolean)}
                    />
                    <Label htmlFor="interestedInCourses" className="cursor-pointer flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-purple-600" />
                      Cursos online grabados
                    </Label>
                  </div>
                </div>
              </div>

              {/* Error Messages */}
              {submitApplication.error && (
                <Alert variant="destructive">
                  <AlertDescription>{submitApplication.error.message}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => navigate("/")} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitApplication.isPending} className="flex-1">
                  {submitApplication.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Solicitud"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
