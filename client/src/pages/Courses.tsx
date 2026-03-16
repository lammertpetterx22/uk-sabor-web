import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import CourseCard from "@/components/CourseCard";
import { Search, Filter, BookOpen } from "lucide-react";
import { ListSkeleton } from "@/components/Skeleton";
import type { Course, Instructor } from "@shared/types";

export default function Courses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [instructorMap, setInstructorMap] = useState<Record<number, Instructor>>({});
  const [loading, setLoading] = useState(true);

  const coursesQuery = trpc.courses.list.useQuery({ limit: 100, offset: 0 });
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
    if (coursesQuery.data) {
      const filtered = coursesQuery.data.filter((course) => {
        const matchesSearch =
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.danceStyle?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesLevel = !selectedLevel || course.level === selectedLevel;

        return matchesSearch && matchesLevel;
      });
      setFilteredCourses(filtered);
      setLoading(false);
    }
  }, [coursesQuery.data, searchTerm, selectedLevel]);

  const levels = ["beginner", "intermediate", "advanced", "all-levels"];

  return (
    <div className="min-h-screen bg-background">

      {/* Page Header */}
      <section className="bg-gradient-to-r from-[#E91E8C]/20 via-[#FF4500]/20 to-[#FFD700]/20 py-12">
        <div className="container">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Dance Courses</h1>
          <p className="text-lg text-foreground/80 max-w-2xl">
            Learn from world-class instructors with comprehensive courses designed for all levels. Master Salsa, Bachata, Merengue, and more.
          </p>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="py-8 border-b border-border/50">
        <div className="container space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow relative">
              <Search className="absolute left-3 top-3 text-accent" size={20} />
              <Input
                type="text"
                placeholder="Search courses by name, style, or instructor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 bg-card border-border/50"
              />
            </div>
          </div>

          {/* Level Filter */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-foreground/70 self-center">Level:</span>
            <Button
              variant={selectedLevel === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedLevel(null)}
              className={selectedLevel === null ? "btn-vibrant" : "border-border/50"}
            >
              All Levels
            </Button>
            {levels.map((level) => (
              <Button
                key={level}
                variant={selectedLevel === level ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedLevel(level)}
                className={selectedLevel === level ? "btn-vibrant" : "border-border/50 capitalize"}
              >
                {level}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-16">
        <div className="container">
          {loading ? (
            <ListSkeleton count={6} />
          ) : filteredCourses.length > 0 ? (
            <>
              <div className="mb-6 text-foreground/70">
                Showing {filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""}
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCourses.map((course) => (
                  <CourseCard key={course.id} course={course} instructorName={instructorMap[course.instructorId]?.name} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20 px-4">
              <div className="flex justify-center mb-4">
                <BookOpen size={48} className="text-accent/40" />
              </div>
              <h3 className="text-2xl font-bold mb-2">No courses found</h3>
              <p className="text-lg text-foreground/60 mb-6">We couldn't find any courses matching your filters.</p>
              <Button asChild className="btn-vibrant btn-modern">
                <Link href="/courses">Clear Filters</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-card/50 border-y border-border/50">
        <div className="container text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-lg text-foreground/80 mb-8 max-w-2xl mx-auto">
            Choose a course and begin your Latin dance journey today. All courses include lifetime access to video lessons.
          </p>
          <Button asChild className="btn-vibrant btn-modern text-lg px-8 py-6 h-auto">
            <Link href="/courses">Browse All Courses</Link>
          </Button>
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
