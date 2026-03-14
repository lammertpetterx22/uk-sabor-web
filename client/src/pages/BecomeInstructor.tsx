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
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

const applicationSchema = z.object({
  requestType: z.enum(["instructor", "promoter"]),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  bio: z.string().min(10, "Please tell us about yourself (minimum 10 characters)"),
  experience: z.string().min(10, "Please describe your experience (minimum 10 characters)"),
  specialties: z.string().optional(), // Comma-separated dance styles
  instagramHandle: z.string().optional(),
  websiteUrl: z.string().optional(),
  interestedInEvents: z.boolean(),
  interestedInClasses: z.boolean(),
  interestedInCourses: z.boolean(),
}).refine((data) => data.interestedInEvents || data.interestedInClasses || data.interestedInCourses, {
  message: "You must select at least one option of what you'd like to publish",
  path: ["interestedInEvents"], // Will show error on first checkbox
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

export default function BecomeInstructor() {
  const { user, loading: userLoading } = useAuth();
  const [, setLocation] = useLocation();
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
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>You must log in to apply as an instructor or promoter</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/login")} className="w-full">
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user already has an application, show status
  if (existingApplication) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
              <CardTitle className="text-2xl flex items-center gap-3">
                <div className="p-2 bg-purple-600 rounded-lg">
                  <Star className="w-6 h-6 text-white" />
                </div>
                Your Application Status
              </CardTitle>
              <CardDescription className="text-base">
                You submitted an application on {new Date(existingApplication.requestedAt).toLocaleDateString("en-GB", {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                {existingApplication.status === "pending" && (
                  <Badge variant="outline" className="flex items-center gap-2 text-amber-600 border-amber-300">
                    <Clock className="w-4 h-4" />
                    Pending Review
                  </Badge>
                )}
                {existingApplication.status === "approved" && (
                  <Badge variant="outline" className="flex items-center gap-2 text-green-600 border-green-300">
                    <CheckCircle2 className="w-4 h-4" />
                    Approved
                  </Badge>
                )}
                {existingApplication.status === "rejected" && (
                  <Badge variant="outline" className="flex items-center gap-2 text-red-600 border-red-300">
                    <XCircle className="w-4 h-4" />
                    Rejected
                  </Badge>
                )}
              </div>

              {/* Application Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Application Type:</p>
                  <p className="text-base capitalize">{existingApplication.requestType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Full Name:</p>
                  <p className="text-base">{existingApplication.fullName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Email:</p>
                  <p className="text-base">{existingApplication.email}</p>
                </div>
                {existingApplication.phone && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Phone:</p>
                    <p className="text-base">{existingApplication.phone}</p>
                  </div>
                )}
              </div>

              {/* Interested In */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Interested in publishing:</p>
                <div className="flex flex-wrap gap-2">
                  {existingApplication.interestedInEvents && (
                    <Badge variant="secondary">
                      <Calendar className="w-3 h-3 mr-1" />
                      Events
                    </Badge>
                  )}
                  {existingApplication.interestedInClasses && (
                    <Badge variant="secondary">
                      <Music className="w-3 h-3 mr-1" />
                      Classes
                    </Badge>
                  )}
                  {existingApplication.interestedInCourses && (
                    <Badge variant="secondary">
                      <GraduationCap className="w-3 h-3 mr-1" />
                      Courses
                    </Badge>
                  )}
                </div>
              </div>

              {/* Admin Notes (if rejected) */}
              {existingApplication.status === "rejected" && existingApplication.adminNotes && (
                <Alert>
                  <AlertDescription>
                    <strong>Administrator Note:</strong>
                    <p className="mt-2">{existingApplication.adminNotes}</p>
                  </AlertDescription>
                </Alert>
              )}

              {/* Status Messages */}
              {existingApplication.status === "pending" && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Your application is being reviewed. We'll notify you when there's an update.
                  </AlertDescription>
                </Alert>
              )}

              {existingApplication.status === "approved" && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Congratulations! Your application has been approved. You can now start publishing content on the
                    platform.
                  </AlertDescription>
                </Alert>
              )}

              {existingApplication.status === "rejected" && (
                <div className="space-y-4">
                  <Alert className="border-red-200 bg-red-50">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      Your application was rejected. You can submit a new application when you're ready.
                    </AlertDescription>
                  </Alert>
                  <Button onClick={() => window.location.reload()} className="w-full">
                    Submit New Application
                  </Button>
                </div>
              )}

              <Button variant="outline" onClick={() => setLocation("/dashboard")} className="w-full">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Application Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 animate-in fade-in duration-700">
          <div className="inline-block p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-6">
            <Star className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
            Become an Instructor or Promoter
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Share your passion for dance with our community. Publish events, classes and courses on our
            platform and grow your business.
          </p>
        </div>

        {/* Type Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <Card
            className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
              selectedType === "instructor"
                ? "ring-2 ring-purple-600 border-purple-600 shadow-lg scale-[1.02]"
                : "hover:border-purple-300 hover:scale-[1.01]"
            }`}
            onClick={() => {
              setSelectedType("instructor");
              setValue("requestType", "instructor");
            }}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg transition-colors ${
                  selectedType === "instructor"
                    ? "bg-gradient-to-br from-purple-500 to-purple-600"
                    : "bg-purple-100"
                }`}>
                  <Star className={`w-6 h-6 ${
                    selectedType === "instructor" ? "text-white" : "text-purple-600"
                  }`} />
                </div>
                <div>
                  <CardTitle className="text-xl">Instructor</CardTitle>
                  <CardDescription>Teach dance classes and courses</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Publish in-person and virtual classes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Create complete courses with recorded lessons</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Organize events and workshops</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
              selectedType === "promoter"
                ? "ring-2 ring-blue-600 border-blue-600 shadow-lg scale-[1.02]"
                : "hover:border-blue-300 hover:scale-[1.01]"
            }`}
            onClick={() => {
              setSelectedType("promoter");
              setValue("requestType", "promoter");
            }}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg transition-colors ${
                  selectedType === "promoter"
                    ? "bg-gradient-to-br from-blue-500 to-blue-600"
                    : "bg-blue-100"
                }`}>
                  <Calendar className={`w-6 h-6 ${
                    selectedType === "promoter" ? "text-white" : "text-blue-600"
                  }`} />
                </div>
                <div>
                  <CardTitle className="text-xl">Promoter</CardTitle>
                  <CardDescription>Organize dance events</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Publish social events and parties</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Manage online ticket sales</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Promote your events to the community</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Application Form */}
        <Card className="shadow-xl border-t-4 border-t-purple-600">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
            <CardTitle className="text-2xl">Application Form</CardTitle>
            <CardDescription className="text-base">
              Complete all fields to submit your application. We'll review your information and contact you soon.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Hidden field for requestType */}
              <input type="hidden" {...register("requestType")} />

              {/* Personal Info */}
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-1 bg-gradient-to-b from-purple-600 to-blue-600 rounded-full" />
                  <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                      Full Name *
                    </Label>
                    <Input
                      id="fullName"
                      {...register("fullName")}
                      placeholder="Your full name"
                      className="transition-all focus:ring-2 focus:ring-purple-500"
                    />
                    {errors.fullName && <p className="text-sm text-red-600 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> {errors.fullName.message}
                    </p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="your@email.com"
                      className="transition-all focus:ring-2 focus:ring-purple-500"
                    />
                    {errors.email && <p className="text-sm text-red-600 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> {errors.email.message}
                    </p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      {...register("phone")}
                      placeholder="+44 123 456 7890"
                      className="transition-all focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagramHandle" className="text-sm font-medium text-gray-700">
                      Instagram
                    </Label>
                    <Input
                      id="instagramHandle"
                      {...register("instagramHandle")}
                      placeholder="@yourusername"
                      className="transition-all focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="websiteUrl" className="text-sm font-medium text-gray-700">
                    Website
                  </Label>
                  <Input
                    id="websiteUrl"
                    {...register("websiteUrl")}
                    placeholder="https://yourwebsite.com"
                    className="transition-all focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* About You */}
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-1 bg-gradient-to-b from-purple-600 to-blue-600 rounded-full" />
                  <h3 className="text-lg font-semibold text-gray-900">Tell us about yourself</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-sm font-medium text-gray-700">
                    Biography *
                  </Label>
                  <Textarea
                    id="bio"
                    {...register("bio")}
                    placeholder="Tell us who you are, your passion for dance, what inspires you..."
                    rows={4}
                    className="transition-all focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                  {errors.bio && <p className="text-sm text-red-600 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> {errors.bio.message}
                  </p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience" className="text-sm font-medium text-gray-700">
                    Experience *
                  </Label>
                  <Textarea
                    id="experience"
                    {...register("experience")}
                    placeholder="Describe your experience as an instructor/promoter, years teaching, notable achievements, certifications..."
                    rows={4}
                    className="transition-all focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                  {errors.experience && <p className="text-sm text-red-600 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> {errors.experience.message}
                  </p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialties" className="text-sm font-medium text-gray-700">
                    Specialties (comma-separated)
                  </Label>
                  <Input
                    id="specialties"
                    {...register("specialties")}
                    placeholder="Salsa, Bachata, Reggaeton, Kizomba..."
                    className="transition-all focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Music className="w-3 h-3" />
                    Example: Salsa, Bachata, Kizomba
                  </p>
                </div>
              </div>

              {/* Interests */}
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-1 bg-gradient-to-b from-purple-600 to-blue-600 rounded-full" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">What would you like to publish?</h3>
                    <p className="text-sm text-gray-600">Select at least one option</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                    interestedInEvents
                      ? "border-purple-600 bg-purple-50 shadow-md"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                    onClick={() => setValue("interestedInEvents", !interestedInEvents)}
                  >
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="interestedInEvents"
                        checked={interestedInEvents}
                        onCheckedChange={(checked) => setValue("interestedInEvents", checked as boolean)}
                      />
                      <Label htmlFor="interestedInEvents" className="cursor-pointer flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-5 h-5 text-purple-600" />
                          <span className="font-semibold">Events and workshops</span>
                        </div>
                        <p className="text-xs text-gray-600">Organize social events and parties</p>
                      </Label>
                    </div>
                  </div>

                  <div className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                    interestedInClasses
                      ? "border-purple-600 bg-purple-50 shadow-md"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                    onClick={() => setValue("interestedInClasses", !interestedInClasses)}
                  >
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="interestedInClasses"
                        checked={interestedInClasses}
                        onCheckedChange={(checked) => setValue("interestedInClasses", checked as boolean)}
                      />
                      <Label htmlFor="interestedInClasses" className="cursor-pointer flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Music className="w-5 h-5 text-purple-600" />
                          <span className="font-semibold">In-person classes</span>
                        </div>
                        <p className="text-xs text-gray-600">Teach live classes</p>
                      </Label>
                    </div>
                  </div>

                  <div className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                    interestedInCourses
                      ? "border-purple-600 bg-purple-50 shadow-md"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                    onClick={() => setValue("interestedInCourses", !interestedInCourses)}
                  >
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="interestedInCourses"
                        checked={interestedInCourses}
                        onCheckedChange={(checked) => setValue("interestedInCourses", checked as boolean)}
                      />
                      <Label htmlFor="interestedInCourses" className="cursor-pointer flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <GraduationCap className="w-5 h-5 text-purple-600" />
                          <span className="font-semibold">Online courses</span>
                        </div>
                        <p className="text-xs text-gray-600">Create recorded courses</p>
                      </Label>
                    </div>
                  </div>
                </div>
                {errors.interestedInEvents && (
                  <p className="text-sm text-red-600 flex items-center gap-1 mt-2">
                    <XCircle className="w-4 h-4" /> {errors.interestedInEvents.message}
                  </p>
                )}
              </div>

              {/* Error Messages */}
              {submitApplication.error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{submitApplication.error.message}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/")}
                  className="flex-1 h-12 text-base"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitApplication.isPending}
                  className="flex-1 h-12 text-base bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all"
                >
                  {submitApplication.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Submit Application
                    </>
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
