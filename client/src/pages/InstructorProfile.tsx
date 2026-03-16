import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Loader2,
  ArrowLeft,
  Instagram,
  BookOpen,
  Calendar,
  Clock,
  Users,
  Star,
} from "lucide-react";

export default function InstructorProfile() {
  const params = useParams<{ id: string }>();
  const instructorId = parseInt(params.id || "0");

  const { data: instructor, isLoading, error } = trpc.instructors.getById.useQuery(instructorId, {
    enabled: !!instructorId && !isNaN(instructorId),
  });

  const levelLabel: Record<string, string> = {
    beginner: "Principiante",
    intermediate: "Intermedio",
    advanced: "Avanzado",
    "all-levels": "Todos los niveles",
  };

  const levelColor: Record<string, string> = {
    beginner: "bg-green-500/20 text-green-400",
    intermediate: "bg-yellow-500/20 text-yellow-400",
    advanced: "bg-red-500/20 text-red-400",
    "all-levels": "bg-accent/20 text-accent",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  if (error || !instructor) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">Instructor not found</h2>
          <p className="text-foreground/70 mb-8">El perfil que buscas no existe o ha sido eliminado.</p>
          <Button asChild className="btn-vibrant">
            <Link href="/instructors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back a Instructors
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const specialties: string[] = instructor.specialties
    ? (() => { try { return JSON.parse(instructor.specialties); } catch { return []; } })()
    : [];

  const publishedCourses = instructor.courses?.filter((c) => c.status === "published") ?? [];
  const upcomingClasses = instructor.classes?.filter(
    (cl) => cl.status !== "cancelled" && cl.status !== "completed"
  ) ?? [];

  return (
    <div className="min-h-screen bg-background">

      {/* Back button */}
      <div className="container pt-8">
        <Button asChild variant="ghost" className="text-foreground/70 hover:text-foreground mb-6">
          <Link href="/instructors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Todos los instructores
          </Link>
        </Button>
      </div>

      {/* Hero Section */}
      <section className="container pb-12">
        <div className="grid md:grid-cols-3 gap-8 items-start">
          {/* Photo */}
          <div className="md:col-span-1">
            <div className="relative rounded-2xl overflow-hidden aspect-square bg-gradient-to-br from-[#E91E8C]/30 to-[#FF4500]/30 shadow-2xl shadow-accent/20">
              {instructor.photoUrl ? (
                <img
                  src={instructor.photoUrl}
                  alt={instructor.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-8xl font-bold text-accent/40">
                    {instructor.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
            </div>

            {/* Social Links */}
            {instructor.instagramHandle && (
              <a
                href={`https://instagram.com/${instructor.instagramHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 mt-4 text-accent hover:text-accent/80 transition-colors font-medium"
              >
                <Instagram className="h-5 w-5" />
                @{instructor.instagramHandle}
              </a>
            )}

            {/* Stats */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="bg-card rounded-xl p-4 text-center border border-border/50">
                <div className="text-2xl font-bold text-accent">{publishedCourses.length}</div>
                <div className="text-xs text-foreground/60 mt-1">Courses</div>
              </div>
              <div className="bg-card rounded-xl p-4 text-center border border-border/50">
                <div className="text-2xl font-bold text-accent">{upcomingClasses.length}</div>
                <div className="text-xs text-foreground/60 mt-1">Classes</div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3">{instructor.name}</h1>

              {specialties.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {specialties.map((specialty, idx) => (
                    <Badge
                      key={idx}
                      className="bg-accent/20 text-accent border-accent/30 text-sm px-3 py-1"
                    >
                      <Star className="h-3 w-3 mr-1" />
                      {specialty}
                    </Badge>
                  ))}
                </div>
              )}

              {instructor.bio && (
                <div className="text-foreground/80 text-lg leading-relaxed space-y-3">
                  {instructor.bio
                    .split(/\n\n+/)
                    .map((paragraph, i) => (
                      <p key={i} style={{ whiteSpace: "pre-line" }}>
                        {paragraph}
                      </p>
                    ))}
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3">
              {publishedCourses.length > 0 && (
                <Button asChild className="btn-vibrant">
                  <Link href="/courses">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Ver cursos
                  </Link>
                </Button>
              )}
              {upcomingClasses.length > 0 && (
                <Button asChild variant="outline" className="border-accent text-accent hover:bg-accent/10">
                  <Link href="/classes">
                    <Calendar className="mr-2 h-4 w-4" />
                    Ver clases
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      {publishedCourses.length > 0 && (
        <section className="py-12 bg-card/30 border-y border-border/50">
          <div className="container">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <BookOpen className="h-7 w-7 text-accent" />
              Courses de {instructor.name}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {publishedCourses.map((course) => (
                <Link key={course.id} href={`/courses/${course.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg hover:shadow-accent/20 transition-all duration-300 hover:scale-[1.02] cursor-pointer h-full">
                    {course.imageUrl && (
                      <div className="h-40 overflow-hidden bg-gradient-to-br from-[#E91E8C]/20 to-[#FF4500]/20">
                        <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                      </div>
                    )}
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-lg leading-tight">{course.title}</h3>
                        <span className="text-accent font-bold whitespace-nowrap">£{course.price}</span>
                      </div>
                      {course.danceStyle && (
                        <Badge variant="outline" className="text-xs">{course.danceStyle}</Badge>
                      )}
                      <div className="flex items-center gap-3 text-sm text-foreground/60">
                        {course.level && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${levelColor[course.level] || "bg-accent/20 text-accent"}`}>
                            {levelLabel[course.level] || course.level}
                          </span>
                        )}
                        {course.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {course.duration}
                          </span>
                        )}
                      </div>
                      {course.description && (
                        <p className="text-foreground/60 text-sm line-clamp-2">{course.description}</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Classes Section */}
      {upcomingClasses.length > 0 && (
        <section className="py-12">
          <div className="container">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <Calendar className="h-7 w-7 text-accent" />
              Upcoming Classes by {instructor.name}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {upcomingClasses.map((cls) => {
                const classDate = new Date(cls.classDate);
                const isPast = classDate < new Date();
                return (
                  <Link key={cls.id} href={`/classes/${cls.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg hover:shadow-accent/20 transition-all duration-300 hover:scale-[1.02] cursor-pointer h-full">
                      {cls.imageUrl && (
                        <div className="h-36 overflow-hidden bg-gradient-to-br from-[#E91E8C]/20 to-[#FF4500]/20">
                          <img src={cls.imageUrl} alt={cls.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <CardContent className="p-4 space-y-2">
                        <h3 className="font-bold text-lg leading-tight">{cls.title}</h3>
                        <div className="flex items-center gap-1 text-sm text-foreground/60">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {classDate.toLocaleDateString("en-GB", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}{" "}
                            {classDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-accent font-bold">£{cls.price}</span>
                          {cls.maxParticipants && (
                            <span className="flex items-center gap-1 text-xs text-foreground/50">
                              <Users className="h-3 w-3" />
                              Max. {cls.maxParticipants}
                            </span>
                          )}
                        </div>
                        {isPast && (
                          <Badge variant="outline" className="text-xs text-foreground/50">Past class</Badge>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Empty state if no courses or classes */}
      {publishedCourses.length === 0 && upcomingClasses.length === 0 && (
        <section className="py-16">
          <div className="container text-center">
            <p className="text-foreground/60 text-lg mb-6">
              This instructor doesn't have any courses or classes available yet.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="btn-vibrant">
                <Link href="/courses">Explore All Courses</Link>
              </Button>
              <Button asChild variant="outline" className="border-accent text-accent hover:bg-accent/10">
                <Link href="/classes">View All Classes</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-card border-t border-border/50 py-8 mt-12">
        <div className="container text-center text-foreground/70 text-sm">
          <p>&copy; 2026 UK Sabor. All rights reserved. Dance with passion, celebrate culture.</p>
        </div>
      </footer>
    </div>
  );
}
