import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { ClassesCalendar } from "@/components/ClassesCalendar";
import { Trans, useTr } from "@/components/Trans";
import { Loader2, Calendar, Clock, Users, Image as ImageIcon, Search } from "lucide-react";
import type { Class, Instructor } from "@shared/types";

export default function Classes() {
  const { tr } = useTr();
  const [classes, setClasses] = useState<Class[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [instructorMap, setInstructorMap] = useState<Record<number, Instructor>>({});
  const [loading, setLoading] = useState(true);

  const classesQuery = trpc.classes.list.useQuery({ limit: 100, offset: 0 });
  const instructorsQuery = trpc.instructors.list.useQuery();

  useEffect(() => {
    if (instructorsQuery.data) {
      const map: Record<number, Instructor> = {};
      instructorsQuery.data.forEach((instructor) => {
        map[instructor.id] = instructor;
      });
      setInstructorMap(map);
    }
  }, [instructorsQuery.data]);

  useEffect(() => {
    if (classesQuery.data) {
      setClasses(classesQuery.data);
      setLoading(false);
    }
  }, [classesQuery.data]);

  const upcomingClasses = classes
    .filter((c) => new Date(c.classDate) >= new Date())
    .filter((c) => 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.danceStyle?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(a.classDate).getTime() - new Date(b.classDate).getTime());

  const groupedByDate = upcomingClasses.reduce(
    (acc, cls) => {
      const date = new Date(cls.classDate).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      if (!acc[date]) acc[date] = [];
      acc[date].push(cls);
      return acc;
    },
    {} as Record<string, Class[]>
  );

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-background">

      {/* Page Header */}
      <section className="bg-gradient-to-r from-[#E91E8C]/20 via-[#FF4500]/20 to-[#FFD700]/20 py-12">
        <div className="container">
          <h1 className="text-5xl md:text-6xl font-bold mb-4"><Trans>Live Dance Classes</Trans></h1>
          <p className="text-lg text-foreground/80 max-w-2xl">
            <Trans>Join our live dance classes and learn in real time with our expert instructors. Suitable for all levels.</Trans>
          </p>
        </div>
      </section>

      {/* Weekly Classes Calendar */}
      <section className="py-16 bg-card/30 border-y border-border/50">
        <div className="container">
          <div className="mb-8">
            <h2 className="text-4xl font-bold mb-4 flex items-center gap-3">
              <Calendar className="text-accent" size={32} />
              <Trans>Class Calendar</Trans>
            </h2>
            <p className="text-lg text-foreground/70"><Trans>Our live dance classes every week</Trans></p>
          </div>
          
          <div className="mb-8 relative max-w-md">
            <Search className="absolute left-3 top-3 text-accent" size={20} />
            <Input
              type="text"
              placeholder={tr("Search classes by name, style, or description...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 bg-card/60 border-white/10"
            />
          </div>
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-accent" size={48} />
            </div>
          ) : upcomingClasses.length > 0 ? (
            <ClassesCalendar classes={upcomingClasses} onClassClick={(id) => window.location.href = `/classes/${id}`} />
          ) : (
            <div className="text-center py-20">
              <p className="text-xl text-foreground/70 mb-6"><Trans>No upcoming classes scheduled at this time.</Trans></p>
              <p className="text-foreground/60"><Trans>Check back soon for new classes!</Trans></p>
            </div>
          )}
        </div>
      </section>

      {/* Upcoming Classes List */}
      <section className="py-16">
        <div className="container">
          <h2 className="text-3xl font-bold mb-8"><Trans>Upcoming Classes</Trans></h2>
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-accent" size={48} />
            </div>
          ) : upcomingClasses.length > 0 ? (
            <div className="space-y-8">
              {Object.entries(groupedByDate).map(([date, dateClasses]) => (
                <div key={date}>
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 capitalize">
                    <Calendar className="text-accent" size={28} />
                    {date}
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    {dateClasses.map((cls) => (
                      <div key={cls.id} className="glass card-modern bg-card/60 border border-white/10 rounded-xl overflow-hidden hover:shadow-2xl hover:shadow-[#FF4500]/30 transition-all duration-300 hover:border-[#FF4500]/50 hover:-translate-y-1">
                        {/* Cover image */}
                        {(cls as any).imageUrl ? (
                          <div className="h-44 overflow-hidden">
                            <img
                              src={(cls as any).imageUrl}
                              alt={cls.title}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className="h-24 bg-gradient-to-r from-[#E91E8C]/10 via-[#FF4500]/10 to-[#FFD700]/10 flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-foreground/20" />
                          </div>
                        )}
                        <div className="p-6 space-y-3">
                          <div>
                            <h4 className="text-xl font-bold mb-1">{cls.title}</h4>
                            <p className="text-foreground/70 text-sm">{cls.description}</p>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-foreground/80">
                              <Clock size={16} className="text-accent" />
                              <span>{formatTime(new Date(cls.classDate))}</span>
                              {cls.duration && <span className="text-foreground/60">• {cls.duration} min</span>}
                            </div>

                            {cls.danceStyle && (
                              <div className="flex items-center gap-2 text-foreground/80">
                                <span className="font-medium">{cls.danceStyle}</span>
                                {cls.level && <span className="text-foreground/50">· {cls.level}</span>}
                              </div>
                            )}

                            <div className="flex items-center gap-2 text-foreground/80">
                              <Users size={16} className="text-accent" />
                              <span>
                                {cls.currentParticipants}/{cls.maxParticipants || "∞"} participants
                              </span>
                            </div>

                            <div className="text-accent font-bold text-lg">£{typeof cls.price === 'string' ? parseFloat(cls.price).toFixed(2) : Number(cls.price).toFixed(2)}</div>
                          </div>

                          <Link href={`/classes/${cls.id}`}>
                            <Button className="btn-vibrant btn-modern w-full">View & Book</Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-xl text-foreground/70 mb-6">No upcoming classes scheduled at this time.</p>
              <p className="text-foreground/60 mb-8">Check back soon for new classes!</p>
              <Button asChild className="btn-vibrant btn-modern">
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-card/50 border-y border-border/50">
        <div className="container text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Join Our Community</h2>
          <p className="text-lg text-foreground/80 mb-8 max-w-2xl mx-auto">
            Access all online courses and learn at your own pace with recorded sessions available 24/7.
          </p>
          <Button asChild className="btn-vibrant btn-modern text-lg px-8 py-6 h-auto">
            <Link href="/courses">Explore Courses</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border/50 py-8">
        <div className="container text-center text-foreground/70 text-sm">
          <p>&copy; 2026 UK Sabor. All rights reserved. Dance with passion, celebrate the culture.</p>
        </div>
      </footer>
    </div>
  );
}
