import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import EventCard from "@/components/EventCard";
import CourseCard from "@/components/CourseCard";
import InstructorCard from "@/components/InstructorCard";
import { Loader2, Sparkles, Music, Users } from "lucide-react";
import type { Event, Course, Instructor } from "@shared/types";

const SABOR_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663400274503/DGihaPaJvnMFHruoq9jmVQ/sabor-logo_7c905b38.png";

export default function Home() {
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data
  const eventsQuery = trpc.events.list.useQuery({ limit: 3, offset: 0 });
  const coursesQuery = trpc.courses.list.useQuery({ limit: 3, offset: 0 });
  const instructorsQuery = trpc.instructors.list.useQuery();

  useEffect(() => {
    if (eventsQuery.data) setFeaturedEvents(eventsQuery.data);
    if (coursesQuery.data) setFeaturedCourses(coursesQuery.data);
    if (instructorsQuery.data) setInstructors(instructorsQuery.data);

    if (!eventsQuery.isLoading && !coursesQuery.isLoading && !instructorsQuery.isLoading) {
      setLoading(false);
    }
  }, [eventsQuery.data, coursesQuery.data, instructorsQuery.data, eventsQuery.isLoading, coursesQuery.isLoading, instructorsQuery.isLoading]);

  return (
    <div className="min-h-screen bg-background">

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#E91E8C]/10 via-background to-[#FF4500]/10 pointer-events-none animate-gradient-shift" />
        
        {/* Floating orbs */}
        <div className="absolute top-10 right-10 w-72 h-72 bg-[#E91E8C]/20 rounded-full blur-3xl animate-float pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#FF4500]/20 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '1s' }} />

        <div className="container relative z-10">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6 animate-slide-in-left">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                  <span className="gradient-text animate-gradient-shift">Experience</span>
                  <br />
                  <span className="text-foreground">Latin Dance</span>
                  <br />
                  <span className="gradient-text animate-gradient-shift">Like Never Before</span>
                </h1>

                <p className="text-lg md:text-xl text-foreground/80 max-w-lg">
                  Join UK Sabor for unforgettable dance events, professional courses, and live classes. Learn from world-class instructors and become part of our vibrant dance community.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="btn-vibrant btn-modern text-lg px-8 py-6 h-auto">
                  <Link href="/events">Explore Events</Link>
                </Button>
                <Button asChild variant="outline" className="btn-modern text-lg px-8 py-6 h-auto border-2 border-accent text-accent hover:bg-accent/10">
                  <Link href="/courses">Browse Courses</Link>
                </Button>
              </div>

              {/* Stats with animation */}
              <div className="grid grid-cols-3 gap-4 pt-8">
                <div className="animate-scale-in" style={{ animationDelay: '0.1s' }}>
                  <div className="text-3xl font-bold text-accent">24+</div>
                  <div className="text-sm text-foreground/70">Events Yearly</div>
                </div>
                <div className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
                  <div className="text-3xl font-bold text-accent">10+</div>
                  <div className="text-sm text-foreground/70">Courses</div>
                </div>
                <div className="animate-scale-in" style={{ animationDelay: '0.3s' }}>
                  <div className="text-3xl font-bold text-accent">200+</div>
                  <div className="text-sm text-foreground/70">Dancers</div>
                </div>
              </div>
            </div>

            {/* Right Content - Logo */}
            <div className="hidden md:flex items-center justify-center animate-slide-in-right">
              <div className="relative w-full max-w-md">
                <div className="absolute inset-0 bg-gradient-to-r from-[#E91E8C]/20 via-[#FF4500]/20 to-[#FFD700]/20 rounded-full blur-3xl animate-glow" />
                <img src={SABOR_LOGO} alt="UK Sabor" className="relative w-full h-auto animate-float" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="py-16 md:py-24 bg-card/50 border-y border-border/50 backdrop-blur-sm">
        <div className="container">
          <div className="flex items-center gap-3 mb-4 animate-slide-up">
            <Sparkles className="text-accent animate-bounce-soft" size={28} />
            <h2 className="text-4xl md:text-5xl font-bold">Featured Events</h2>
          </div>
          <p className="text-foreground/70 mb-12 max-w-2xl animate-slide-up" style={{ animationDelay: '0.1s' }}>Don't miss our upcoming dance events. From workshops to full-night parties, there's something for everyone.</p>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-accent" size={40} />
            </div>
          ) : featuredEvents.length > 0 ? (
            <>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {featuredEvents.map((event, idx) => (
                  <div key={event.id} className="animate-scale-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                    <EventCard event={event} />
                  </div>
                ))}
              </div>
              <div className="text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <Button asChild variant="outline" className="btn-modern border-2 border-accent text-accent hover:bg-accent/10">
                  <Link href="/events">View All Events</Link>
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 animate-fade-in">
              <p className="text-foreground/70">No events available at the moment. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="flex items-center gap-3 mb-4 animate-slide-up">
            <Music className="text-accent animate-bounce-soft" size={28} />
            <h2 className="text-4xl md:text-5xl font-bold">Featured Courses</h2>
          </div>
          <p className="text-foreground/70 mb-12 max-w-2xl animate-slide-up" style={{ animationDelay: '0.1s' }}>Learn from professional instructors with structured courses designed for all levels.</p>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-accent" size={40} />
            </div>
          ) : featuredCourses.length > 0 ? (
            <>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {featuredCourses.map((course, idx) => (
                  <div key={course.id} className="animate-scale-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                    <CourseCard course={course} />
                  </div>
                ))}
              </div>
              <div className="text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <Button asChild variant="outline" className="btn-modern border-2 border-accent text-accent hover:bg-accent/10">
                  <Link href="/courses">View All Courses</Link>
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 animate-fade-in">
              <p className="text-foreground/70">No courses available at the moment. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Instructors Section */}
      <section className="py-16 md:py-24 bg-card/50 border-y border-border/50 backdrop-blur-sm">
        <div className="container">
          <div className="flex items-center gap-3 mb-4 animate-slide-up">
            <Users className="text-accent animate-bounce-soft" size={28} />
            <h2 className="text-4xl md:text-5xl font-bold">Our Instructors</h2>
          </div>
          <p className="text-foreground/70 mb-12 max-w-2xl animate-slide-up" style={{ animationDelay: '0.1s' }}>Learn from the best dancers in the Latin dance community.</p>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-accent" size={40} />
            </div>
          ) : instructors.length > 0 ? (
            <>
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                {instructors.slice(0, 4).map((instructor, idx) => (
                  <div key={instructor.id} className="animate-scale-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                    <InstructorCard instructor={instructor} />
                  </div>
                ))}
              </div>
              {instructors.length > 4 && (
                <div className="text-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
                  <Button asChild variant="outline" className="btn-modern border-2 border-accent text-accent hover:bg-accent/10">
                    <Link href="/instructors">View All Instructors</Link>
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 animate-fade-in">
              <p className="text-foreground/70">No instructors available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-[#E91E8C]/20 via-[#FF4500]/20 to-[#FFD700]/20 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 animate-gradient-shift pointer-events-none" />
        
        <div className="container text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 animate-slide-up">Ready to Dance?</h2>
          <p className="text-lg text-foreground/80 mb-8 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>Join thousands of dancers and start your Latin dance journey today. Whether you're a beginner or advanced, we have something for you.</p>
          <div className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <Button asChild className="btn-vibrant btn-modern text-lg px-8 py-6 h-auto">
              <Link href="/events">Get Started Now</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border/50 py-12 backdrop-blur-sm" role="contentinfo">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1 animate-fade-in">
              <img src={SABOR_LOGO} alt="UK Sabor" className="h-10 w-auto mb-3" />
              <p className="text-foreground/60 text-sm leading-relaxed">Latin dance events, courses and classes in the UK.</p>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <h3 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wide">Explore</h3>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li><Link href="/events" className="hover:text-accent transition-smooth hover-lift">Events</Link></li>
                <li><Link href="/courses" className="hover:text-accent transition-smooth hover-lift">Courses</Link></li>
                <li><Link href="/classes" className="hover:text-accent transition-smooth hover-lift">Classes</Link></li>
              </ul>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <h3 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wide">Community</h3>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li><Link href="/instructors" className="hover:text-accent transition-smooth hover-lift">Instructors</Link></li>
                <li><Link href="/dashboard" className="hover:text-accent transition-smooth hover-lift">My Dashboard</Link></li>
              </ul>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <h3 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wide">Account</h3>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li><Link href="/login" className="hover:text-accent transition-smooth hover-lift">Sign In</Link></li>
                <li><Link href="/profile" className="hover:text-accent transition-smooth hover-lift">Profile</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 pt-6 text-center text-foreground/50 text-sm">
            <p>&copy; {new Date().getFullYear()} UK Sabor. All rights reserved. Dance with passion, celebrate culture.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
