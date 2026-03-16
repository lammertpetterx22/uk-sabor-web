import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Loader2,
  ArrowLeft,
  Calendar,
  MapPin,
  BookOpen,
  Users,
  Star,
  Clock,
  Music,
  Award,
} from "lucide-react";

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  creator: "Creator",
  promoter_plan: "Promoter",
  academy: "Academy",
};

const PLAN_COLORS: Record<string, string> = {
  starter: "bg-foreground/10 text-foreground/70",
  creator: "bg-blue-500/20 text-blue-400",
  promoter_plan: "bg-accent/20 text-accent",
  academy: "bg-yellow-500/20 text-yellow-400",
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  "all-levels": "All Levels",
};

const LEVEL_COLORS: Record<string, string> = {
  beginner: "bg-green-500/20 text-green-400",
  intermediate: "bg-yellow-500/20 text-yellow-400",
  advanced: "bg-red-500/20 text-red-400",
  "all-levels": "bg-accent/20 text-accent",
};

export default function PromoterProfile() {
  const params = useParams<{ id: string }>();
  const userId = parseInt(params.id || "0");

  const { data: profile, isLoading, error } = trpc.promoters.getPublicProfile.useQuery(userId, {
    enabled: !!userId && !isNaN(userId),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">Profile not found</h2>
          <p className="text-foreground/70 mb-8">
            This promoter profile does not exist or is not publicly available.
          </p>
          <Button asChild className="btn-vibrant">
            <Link href="/instructors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              View Instructors
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const roleLabel =
    profile.role === "admin"
      ? "Platform Admin"
      : profile.role === "instructor"
      ? "Dance Instructor"
      : "Event Promoter";

  const planLabel = PLAN_LABELS[profile.activePlan] ?? profile.activePlan;
  const planColor = PLAN_COLORS[profile.activePlan] ?? PLAN_COLORS.starter;

  const memberSince = new Date(profile.memberSince).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">

      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#E91E8C]/20 via-background to-[#FF4500]/20 py-16">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#FF4500]/5 rounded-full blur-3xl" />
        </div>

        <div className="container relative z-10">
          <Link href="/instructors" className="inline-flex items-center gap-2 text-foreground/60 hover:text-accent transition-colors mb-8 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Instructors
          </Link>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-accent to-[#FF4500] flex items-center justify-center text-white text-4xl font-bold shrink-0 shadow-lg shadow-accent/30 overflow-hidden border-4 border-accent/30">
              {(profile as any).photoUrl ? (
                <img src={(profile as any).photoUrl} alt={profile.name || ""} className="w-full h-full object-cover" />
              ) : (
                (profile.name || "?")[0].toUpperCase()
              )}
            </div>

            {/* Info */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl md:text-4xl font-bold">{profile.name}</h1>
                <Badge className={`${planColor} border-0 text-xs`}>
                  <Award className="h-3 w-3 mr-1" />
                  {planLabel} Plan
                </Badge>
              </div>

              {(profile as any).bio && (
                <p className="text-foreground/70 text-sm max-w-xl leading-relaxed">{(profile as any).bio}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-foreground/70 text-sm">
                <span className="flex items-center gap-1.5">
                  <Music className="h-4 w-4 text-accent" />
                  {roleLabel}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-accent" />
                  Member since {memberSince}
                </span>
                {(profile as any).instagramHandle && (
                  <a
                    href={`https://instagram.com/${(profile as any).instagramHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-accent hover:text-accent/80 transition-colors"
                  >
                    <span className="text-xs">@{(profile as any).instagramHandle}</span>
                  </a>
                )}
                {(profile as any).websiteUrl && (
                  <a
                    href={(profile as any).websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-accent hover:text-accent/80 transition-colors text-xs"
                  >
                    Website ↗
                  </a>
                )}
              </div>

              {/* Specialties */}
              {(profile as any).specialties && (() => {
                try {
                  const specs = JSON.parse((profile as any).specialties);
                  if (Array.isArray(specs) && specs.length > 0) {
                    return (
                      <div className="flex flex-wrap gap-2">
                        {specs.map((s: string) => (
                          <Badge key={s} variant="outline" className="text-xs border-accent/30 text-accent">{s}</Badge>
                        ))}
                      </div>
                    );
                  }
                } catch {
                  const parts = (profile as any).specialties.split(",").map((s: string) => s.trim()).filter(Boolean);
                  if (parts.length > 0) {
                    return (
                      <div className="flex flex-wrap gap-2">
                        {parts.map((s: string) => (
                          <Badge key={s} variant="outline" className="text-xs border-accent/30 text-accent">{s}</Badge>
                        ))}
                      </div>
                    );
                  }
                }
                return null;
              })()}

              {/* Stats */}
              <div className="flex flex-wrap gap-6 pt-2">
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">{profile.stats.totalCourses}</div>
                  <div className="text-xs text-foreground/60">Courses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">{profile.stats.totalClasses}</div>
                  <div className="text-xs text-foreground/60">Upcoming Classes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">{profile.stats.totalEvents}</div>
                  <div className="text-xs text-foreground/60">Events</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-12 space-y-12">
        {/* Courses Section */}
        {profile.courses.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-accent" />
                Online Courses
              </h2>
              <Button asChild variant="outline" size="sm" className="border-accent/30 text-accent hover:bg-accent/10">
                <Link href="/courses">View All Courses</Link>
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {profile.courses.map((course) => (
                <Link key={course.id} href={`/courses/${course.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg hover:shadow-accent/20 transition-all duration-300 hover:scale-[1.02] cursor-pointer h-full flex flex-col">
                    {course.imageUrl && (
                      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-[#E91E8C]/20 to-[#FF4500]/20">
                        <img
                          src={course.imageUrl}
                          alt={course.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    {!course.imageUrl && (
                      <div className="h-44 bg-gradient-to-br from-[#E91E8C]/20 to-[#FF4500]/20 flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-accent/40" />
                      </div>
                    )}
                    <CardContent className="p-4 flex flex-col flex-grow">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-lg leading-tight line-clamp-2">{course.title}</h3>
                        {course.level && (
                          <Badge className={`${LEVEL_COLORS[course.level] ?? ""} border-0 text-xs shrink-0`}>
                            {LEVEL_LABELS[course.level] ?? course.level}
                          </Badge>
                        )}
                      </div>

                      {course.description && (
                        <p className="text-foreground/70 text-sm line-clamp-2 mb-3">{course.description}</p>
                      )}

                      <div className="mt-auto space-y-2">
                        {course.danceStyle && (
                          <div className="flex items-center gap-1.5 text-xs text-foreground/60">
                            <Music className="h-3.5 w-3.5 text-accent" />
                            {course.danceStyle}
                          </div>
                        )}
                        {course.duration && (
                          <div className="flex items-center gap-1.5 text-xs text-foreground/60">
                            <Clock className="h-3.5 w-3.5 text-accent" />
                            {course.duration}
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-accent font-bold text-lg">
                            £{typeof course.price === 'string' ? parseFloat(course.price).toFixed(2) : Number(course.price).toFixed(2)}
                          </span>
                          <Button size="sm" className="btn-vibrant text-xs">
                            Enroll Now
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Classes Section */}
        {profile.classes.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6 text-accent" />
                Upcoming Classes
              </h2>
              <Button asChild variant="outline" size="sm" className="border-accent/30 text-accent hover:bg-accent/10">
                <Link href="/classes">View All Classes</Link>
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {profile.classes.map((cls) => {
                const classDate = new Date(cls.classDate);
                const formattedDate = classDate.toLocaleDateString("en-GB", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                });
                const formattedTime = classDate.toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <Link key={cls.id} href={`/classes/${cls.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg hover:shadow-accent/20 transition-all duration-300 hover:scale-[1.02] cursor-pointer h-full flex flex-col">
                      {cls.imageUrl && (
                        <div className="relative h-44 overflow-hidden bg-gradient-to-br from-[#E91E8C]/20 to-[#FF4500]/20">
                          <img
                            src={cls.imageUrl}
                            alt={cls.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                      {!cls.imageUrl && (
                        <div className="h-44 bg-gradient-to-br from-[#E91E8C]/20 to-[#FF4500]/20 flex items-center justify-center">
                          <Users className="h-12 w-12 text-accent/40" />
                        </div>
                      )}
                      <CardContent className="p-4 flex flex-col flex-grow">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-lg leading-tight line-clamp-2">{cls.title}</h3>
                          {cls.level && (
                            <Badge className={`${LEVEL_COLORS[cls.level] ?? ""} border-0 text-xs shrink-0`}>
                              {LEVEL_LABELS[cls.level] ?? cls.level}
                            </Badge>
                          )}
                        </div>

                        {cls.description && (
                          <p className="text-foreground/70 text-sm line-clamp-2 mb-3">{cls.description}</p>
                        )}

                        <div className="mt-auto space-y-2">
                          <div className="flex items-center gap-1.5 text-sm text-foreground/80">
                            <Calendar className="h-4 w-4 text-accent" />
                            {formattedDate} at {formattedTime}
                          </div>
                          {cls.danceStyle && (
                            <div className="flex items-center gap-1.5 text-xs text-foreground/60">
                              <Music className="h-3.5 w-3.5 text-accent" />
                              {cls.danceStyle}
                            </div>
                          )}
                          {cls.maxParticipants && (
                            <div className="flex items-center gap-1.5 text-xs text-foreground/60">
                              <Users className="h-3.5 w-3.5 text-accent" />
                              {cls.currentParticipants ?? 0} / {cls.maxParticipants} spots filled
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-accent font-bold text-lg">
                              £{typeof cls.price === 'string' ? parseFloat(cls.price).toFixed(2) : Number(cls.price).toFixed(2)}
                            </span>
                            <Button size="sm" className="btn-vibrant text-xs">
                              Book Now
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Upcoming Events Section */}
        {profile.events.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Star className="h-6 w-6 text-accent" />
                Upcoming Events
              </h2>
              <Button asChild variant="outline" size="sm" className="border-accent/30 text-accent hover:bg-accent/10">
                <Link href="/events">View All Events</Link>
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {profile.events.map((event) => {
                const eventDate = new Date(event.eventDate);
                const formattedDate = eventDate.toLocaleDateString("en-GB", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                return (
                  <Link key={event.id} href={`/events/${event.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg hover:shadow-accent/20 transition-all duration-300 hover:scale-[1.02] cursor-pointer h-full flex flex-col">
                      {event.imageUrl && (
                        <div className="relative h-44 overflow-hidden bg-gradient-to-br from-[#E91E8C]/20 to-[#FF4500]/20">
                          <img
                            src={event.imageUrl}
                            alt={event.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                      {!event.imageUrl && (
                        <div className="h-44 bg-gradient-to-br from-[#E91E8C]/20 to-[#FF4500]/20 flex items-center justify-center">
                          <Star className="h-12 w-12 text-accent/40" />
                        </div>
                      )}
                      <CardContent className="p-4 flex flex-col flex-grow">
                        <h3 className="font-bold text-lg leading-tight line-clamp-2 mb-2">{event.title}</h3>

                        {event.description && (
                          <p className="text-foreground/70 text-sm line-clamp-2 mb-3">{event.description}</p>
                        )}

                        <div className="mt-auto space-y-2">
                          <div className="flex items-center gap-1.5 text-sm text-foreground/80">
                            <Calendar className="h-4 w-4 text-accent" />
                            {formattedDate}
                          </div>
                          {event.venue && (
                            <div className="flex items-center gap-1.5 text-xs text-foreground/60">
                              <MapPin className="h-3.5 w-3.5 text-accent" />
                              {event.venue}
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-accent font-bold text-lg">
                              £{typeof event.ticketPrice === 'string' ? parseFloat(event.ticketPrice).toFixed(2) : Number(event.ticketPrice).toFixed(2)}
                            </span>
                            <Button size="sm" className="btn-vibrant text-xs">
                              Get Tickets
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Empty State */}
        {profile.courses.length === 0 && profile.classes.length === 0 && profile.events.length === 0 && (
          <div className="text-center py-20">
            <Music className="h-16 w-16 text-accent/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No content yet</h3>
            <p className="text-foreground/60 mb-6">
              {profile.name} hasn't published any events, classes, or courses yet. Check back soon!
            </p>
            <Button asChild className="btn-vibrant">
              <Link href="/events">Browse All Events</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
