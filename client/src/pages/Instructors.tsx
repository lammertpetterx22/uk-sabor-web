import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, Instagram, Star, Users, Award } from "lucide-react";
import type { Instructor } from "@shared/types";

function InstructorCard({ instructor }: { instructor: Instructor }) {
  const specialties = instructor.specialties
    ? typeof instructor.specialties === "string"
      ? (() => { try { return JSON.parse(instructor.specialties); } catch { return []; } })()
      : Array.isArray(instructor.specialties)
        ? instructor.specialties
        : []
    : [];

  return (
    <Link href={`/instructors/${instructor.id}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border/50 hover:border-accent/50 transition-all duration-300 hover:shadow-2xl hover:shadow-accent/20 hover:-translate-y-1">
        {/* Photo Container - fixed aspect ratio */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-[#E91E8C]/30 via-[#FF4500]/20 to-[#FFD700]/30">
          {instructor.photoUrl ? (
            <>
              <img
                src={instructor.photoUrl}
                alt={instructor.name}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              {/* Gradient overlay at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/40 to-accent/20">
              <div className="text-7xl font-bold text-accent/40">{instructor.name.charAt(0)}</div>
            </div>
          )}

          {/* Name and specialties overlaid on photo */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-xl font-bold text-white mb-2 drop-shadow-lg">{instructor.name}</h3>
            {specialties.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {specialties.slice(0, 3).map((specialty: string, idx: number) => (
                  <span
                    key={idx}
                    className="text-xs bg-accent/80 text-white px-2 py-0.5 rounded-full font-medium backdrop-blur-sm"
                  >
                    {specialty}
                  </span>
                ))}
                {specialties.length > 3 && (
                  <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium backdrop-blur-sm">
                    +{specialties.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Card content below photo */}
        <div className="p-4">
          {instructor.bio && (
            <p className="text-sm text-foreground/70 line-clamp-2 mb-3">{instructor.bio}</p>
          )}
          <div className="flex items-center justify-between">
            {instructor.instagramHandle ? (
              <a
                href={`https://instagram.com/${instructor.instagramHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-accent hover:text-accent/80 transition-colors text-xs font-medium"
              >
                <Instagram size={13} />
                <span>@{instructor.instagramHandle}</span>
              </a>
            ) : (
              <span />
            )}
            <span className="text-xs text-foreground/50 group-hover:text-accent transition-colors font-medium">
              View Profile →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Instructors() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);

  const instructorsQuery = trpc.instructors.list.useQuery();

  useEffect(() => {
    if (instructorsQuery.data) {
      setInstructors(instructorsQuery.data);
      setLoading(false);
    }
  }, [instructorsQuery.data]);

  return (
    <div className="min-h-screen bg-background">

      {/* Page Header */}
      <section className="relative bg-gradient-to-br from-[#E91E8C]/20 via-[#FF4500]/10 to-[#FFD700]/10 py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent" />
        <div className="container relative">
          <div className="max-w-3xl">
            <p className="text-accent font-semibold mb-3 uppercase tracking-widest text-sm">Meet The Team</p>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Our <span className="gradient-text">Instructors</span>
            </h1>
            <p className="text-lg md:text-xl text-foreground/70 max-w-2xl leading-relaxed">
              Passionate, experienced, and dedicated to helping you discover the joy of Latin dance. Each instructor brings their unique style and energy to every class.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border/50 bg-card/50 py-6">
        <div className="container">
          <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                <Users size={18} className="text-accent" />
              </div>
              <div>
                <div className="text-xl font-bold">{instructors.length}</div>
                <div className="text-xs text-foreground/60">Instructors</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                <Award size={18} className="text-accent" />
              </div>
              <div>
                <div className="text-xl font-bold">15+</div>
                <div className="text-xs text-foreground/60">Years Exp.</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                <Star size={18} className="text-accent" />
              </div>
              <div>
                <div className="text-xl font-bold">1000+</div>
                <div className="text-xs text-foreground/60">Students</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Instructors Grid */}
      <section className="py-12 md:py-20">
        <div className="container">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-accent" size={48} />
            </div>
          ) : instructors.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {instructors.map((instructor) => (
                <InstructorCard key={instructor.id} instructor={instructor} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                <Users size={32} className="text-accent/50" />
              </div>
              <p className="text-xl text-foreground/70 mb-6">No instructors available at the moment.</p>
              <p className="text-foreground/50">Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Why Learn With Us */}
      <section className="py-16 md:py-24 bg-card/50 border-y border-border/50">
        <div className="container">
          <h2 className="text-3xl md:text-5xl font-bold mb-12 text-center">Why Learn With Our Instructors?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-5xl font-bold text-accent mb-4">15+</div>
              <h3 className="text-xl font-bold mb-2">Years Experience</h3>
              <p className="text-foreground/70 text-sm">Our instructors have decades of combined experience in professional Latin dance.</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-accent mb-4">1000+</div>
              <h3 className="text-xl font-bold mb-2">Happy Students</h3>
              <p className="text-foreground/70 text-sm">Join thousands of dancers who have transformed their skills with our courses.</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-accent mb-4">100%</div>
              <h3 className="text-xl font-bold mb-2">Satisfaction</h3>
              <p className="text-foreground/70 text-sm">We're committed to your success with personalized attention and support.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Ready to Learn?</h2>
          <p className="text-lg text-foreground/80 mb-8 max-w-2xl mx-auto">
            Browse our courses and classes to find the perfect fit for your skill level and dance style.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="btn-vibrant text-lg px-8 py-6 h-auto">
              <Link href="/courses">Explore Courses</Link>
            </Button>
            <Button asChild variant="outline" className="text-lg px-8 py-6 h-auto border-2 border-accent text-accent hover:bg-accent/10">
              <Link href="/classes">View Classes</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border/50 py-8">
        <div className="container text-center text-foreground/70 text-sm">
          <p>&copy; 2026 UK Sabor. All rights reserved. Dance with passion, celebrate culture.</p>
        </div>
      </footer>
    </div>
  );
}
