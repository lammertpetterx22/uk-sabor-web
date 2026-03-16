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
import { CheckCircle2, Clock, XCircle, Loader2, Music, Calendar, GraduationCap, Star, Mail, Bell, Sparkles } from "lucide-react";
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
  // Email Marketing Preferences
  emailUpdates: z.boolean(),
  emailPromotions: z.boolean(),
  emailCommunity: z.boolean(),
}).refine((data) => data.interestedInEvents || data.interestedInClasses || data.interestedInCourses, {
  message: "You must select at least one option of what you'd like to publish",
  path: ["interestedInEvents"], // Will show error on first checkbox
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

export default function BecomeInstructor() {
  const { user, loading: userLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedType, setSelectedType] = useState<"instructor" | "promoter">("instructor");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [allowReapply, setAllowReapply] = useState(false);

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
      emailUpdates: true,
      emailPromotions: false,
      emailCommunity: true,
    },
  });

  const interestedInEvents = watch("interestedInEvents");
  const interestedInClasses = watch("interestedInClasses");
  const interestedInCourses = watch("interestedInCourses");
  const emailUpdates = watch("emailUpdates");
  const emailPromotions = watch("emailPromotions");
  const emailCommunity = watch("emailCommunity");

  const submitApplication = trpc.admin.submitInstructorApplication.useMutation({
    onSuccess: () => {
      // Show success message
      setShowSuccessMessage(true);
      // Redirect to dashboard after showing success message
      setTimeout(() => {
        setLocation("/dashboard");
      }, 3000);
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full glass-dark shadow-2xl">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>You must log in to apply as an instructor or promoter</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/login")} className="w-full btn-vibrant">
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user already has an application, show status (unless they want to reapply after rejection)
  if (existingApplication && !allowReapply) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <Card className="shadow-2xl glass-dark">
            <CardHeader className="border-b brand-gradient-bg brand-border-pink">
              <CardTitle className="text-2xl flex items-center gap-3">
                <div className="p-2 rounded-lg brand-gradient-header">
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
                  <Button
                    onClick={() => setAllowReapply(true)}
                    className="w-full btn-vibrant"
                  >
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
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-block p-4 rounded-full mb-6 shadow-2xl brand-gradient-header">
            <Star className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Become an Instructor or Promoter</span>
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto leading-relaxed">
            Share your passion for dance with our community. Publish events, classes, and courses on our
            platform and grow your business.
          </p>
        </div>

        {/* Type Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <Card
            className={`cursor-pointer card-modern hover-lift ${
              selectedType === "instructor" ? "shadow-2xl brand-card-selected-pink" : ""
            }`}
            onClick={() => {
              setSelectedType("instructor");
              setValue("requestType", "instructor");
            }}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg transition-colors ${
                  selectedType === "instructor" ? "brand-bg-pink-gradient" : "brand-bg-pink-light"
                }`}>
                  <Star className={`w-6 h-6 ${selectedType === "instructor" ? "text-white" : "brand-text-pink"}`} />
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
            className={`cursor-pointer card-modern hover-lift ${
              selectedType === "promoter" ? "shadow-2xl brand-card-selected-red" : ""
            }`}
            onClick={() => {
              setSelectedType("promoter");
              setValue("requestType", "promoter");
            }}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg transition-colors ${
                  selectedType === "promoter" ? "brand-bg-red-gradient" : "brand-bg-red-light"
                }`}>
                  <Calendar className={`w-6 h-6 ${selectedType === "promoter" ? "text-white" : "brand-text-red"}`} />
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
        <Card className="shadow-2xl glass-dark border-t-4 brand-border-top-pink">
          <CardHeader className="border-b brand-gradient-bg brand-border-pink">
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
                  <div className="h-8 w-1 rounded-full brand-gradient-bar" />
                  <h3 className="text-lg font-semibold">Personal Information</h3>
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
                  <div className="h-8 w-1 rounded-full brand-gradient-bar" />
                  <h3 className="text-lg font-semibold">Tell us about yourself</h3>
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
                  <div className="h-8 w-1 rounded-full brand-gradient-bar" />
                  <div>
                    <h3 className="text-lg font-semibold">What would you like to publish?</h3>
                    <p className="text-sm text-muted-foreground">Select at least one option</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`border-2 rounded-lg p-4 transition-all ${
                    interestedInEvents ? "brand-border-selected" : "border-border"
                  }`}>
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="interestedInEvents"
                        checked={interestedInEvents}
                        onCheckedChange={(checked) => setValue("interestedInEvents", checked === true)}
                      />
                      <Label htmlFor="interestedInEvents" className="cursor-pointer flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-5 h-5 brand-text-pink" />
                          <span className="font-semibold">Events and workshops</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Organize social events and parties</p>
                      </Label>
                    </div>
                  </div>

                  <div className={`border-2 rounded-lg p-4 transition-all ${
                    interestedInClasses ? "brand-border-selected" : "border-border"
                  }`}>
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="interestedInClasses"
                        checked={interestedInClasses}
                        onCheckedChange={(checked) => setValue("interestedInClasses", checked === true)}
                      />
                      <Label htmlFor="interestedInClasses" className="cursor-pointer flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Music className="w-5 h-5 brand-text-pink" />
                          <span className="font-semibold">In-person classes</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Teach live classes</p>
                      </Label>
                    </div>
                  </div>

                  <div className={`border-2 rounded-lg p-4 transition-all ${
                    interestedInCourses ? "brand-border-selected" : "border-border"
                  }`}>
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="interestedInCourses"
                        checked={interestedInCourses}
                        onCheckedChange={(checked) => setValue("interestedInCourses", checked === true)}
                      />
                      <Label htmlFor="interestedInCourses" className="cursor-pointer flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <GraduationCap className="w-5 h-5 brand-text-pink" />
                          <span className="font-semibold">Online courses</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Create recorded courses</p>
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

              {/* Email Marketing Preferences */}
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-1 rounded-full brand-gradient-bar" />
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Mail className="w-5 h-5 brand-text-pink" />
                      Stay in touch
                    </h3>
                    <p className="text-sm text-muted-foreground">Let us know what you'd like to hear about</p>
                  </div>
                </div>

                <div className="bg-card/50 rounded-xl p-6 space-y-4 border border-border/50">
                  <div className={`bg-card rounded-lg p-5 transition-all border-2 ${
                    emailUpdates ? "border-accent" : "border-border"
                  }`}>
                    <div className="flex items-start space-x-4">
                      <Checkbox
                        id="emailUpdates"
                        checked={emailUpdates}
                        onCheckedChange={(checked) => setValue("emailUpdates", checked === true)}
                        className="mt-1"
                      />
                      <Label htmlFor="emailUpdates" className="cursor-pointer flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 rounded-lg brand-bg-pink-light">
                            <Bell className="w-5 h-5 brand-text-pink" />
                          </div>
                          <span className="font-semibold">What's new</span>
                          <Badge variant="secondary" className="ml-auto">Recommended</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Get the latest news and updates about cool new features we're adding to help you succeed
                        </p>
                      </Label>
                    </div>
                  </div>

                  <div className={`bg-card rounded-lg p-5 transition-all border-2 ${
                    emailPromotions ? "border-accent" : "border-border"
                  }`}>
                    <div className="flex items-start space-x-4">
                      <Checkbox
                        id="emailPromotions"
                        checked={emailPromotions}
                        onCheckedChange={(checked) => setValue("emailPromotions", checked === true)}
                        className="mt-1"
                      />
                      <Label htmlFor="emailPromotions" className="cursor-pointer flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 rounded-lg brand-bg-yellow-light">
                            <Sparkles className="w-5 h-5 brand-text-yellow" />
                          </div>
                          <span className="font-semibold">Tips to grow</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Helpful ideas and special opportunities to reach more students and make the most of your classes
                        </p>
                      </Label>
                    </div>
                  </div>

                  <div className={`bg-card rounded-lg p-5 transition-all border-2 ${
                    emailCommunity ? "border-accent" : "border-border"
                  }`}>
                    <div className="flex items-start space-x-4">
                      <Checkbox
                        id="emailCommunity"
                        checked={emailCommunity}
                        onCheckedChange={(checked) => setValue("emailCommunity", checked === true)}
                        className="mt-1"
                      />
                      <Label htmlFor="emailCommunity" className="cursor-pointer flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 rounded-lg brand-bg-cyan-light">
                            <Star className="w-5 h-5 brand-text-cyan" />
                          </div>
                          <span className="font-semibold">Inspiring stories</span>
                          <Badge variant="secondary" className="ml-auto">Recommended</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Real stories from other instructors, what's happening in the community, and cool events you might enjoy
                        </p>
                      </Label>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-2 text-xs text-gray-500">
                    <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p className="leading-relaxed">
                      You can change these anytime in your settings. We'll keep your email safe and never share it with anyone.
                    </p>
                  </div>
                </div>
              </div>

              {/* Success Message */}
              {showSuccessMessage && (
                <Alert className="border-green-200 bg-green-50 animate-in fade-in slide-in-from-top-2 duration-500">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Application submitted successfully!</strong> We'll review your information and get back to you soon.
                  </AlertDescription>
                </Alert>
              )}

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
                  className="flex-1 h-12 text-base btn-vibrant"
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
