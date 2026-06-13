import { Link } from "wouter";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Video, RefreshCw } from "lucide-react";
import type { Course } from "@shared/types";
import { Trans } from "@/components/Trans";

interface CourseCardProps {
  course: Course;
  instructorName?: string;
}

const CourseCard = memo(function CourseCard({ course, instructorName }: CourseCardProps) {
  const levelColors: Record<string, string> = {
    beginner: "bg-emerald-500/20 text-emerald-400",
    intermediate: "bg-amber-500/20 text-amber-400",
    advanced: "bg-rose-500/20 text-rose-400",
    "all-levels": "bg-[#E91E8C]/20 text-[#E91E8C]",
  };

  const getLevelColor = (level: string | null): string => {
    if (!level) return levelColors["all-levels"];
    return levelColors[level] || levelColors["all-levels"];
  };

  return (
    <Card className="glass overflow-hidden hover:shadow-2xl hover:shadow-[#00D4FF]/30 transition-all duration-300 transform hover:scale-105 h-full flex flex-col border-white/10 hover:border-[#00D4FF]/50">
      {/* Course Image */}
      <div className="relative h-48 overflow-hidden flex items-center justify-center">
        {course.imageUrl ? (
          <>
            {/* Blurred backdrop so no borders show */}
            <img
              src={course.imageUrl}
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover scale-110 blur-lg opacity-60"
            />
            {/* Main image — full visible, no crop */}
            <img
              src={course.imageUrl}
              alt={course.title}
              className="relative w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              decoding="async"
              width="400"
              height="192"
            />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#00D4FF]/20 to-[#9D4EDD]/20 flex flex-col items-center justify-center gap-2 opacity-40">
            <BookOpen size={40} className="text-accent" />
            <span className="text-xs text-foreground/60 font-medium">{course.danceStyle || "Course"}</span>
          </div>
        )}
      </div>

      {/* Course Content */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-lg font-bold line-clamp-2 flex-grow">{course.title}</h3>
          <Badge className={`${getLevelColor(course.level)} shrink-0`}>
            {course.level}
          </Badge>
        </div>

        {instructorName && <p className="text-sm text-accent font-semibold mb-2">by {instructorName}</p>}

        <p className="text-foreground/70 text-sm mb-4 line-clamp-2">{course.description}</p>

        {/* Course Details */}
        <div className="space-y-2 mb-4 text-sm">
          {course.danceStyle && (
            <div className="flex items-center gap-2 text-foreground/80">
              <span className="font-medium">{course.danceStyle}</span>
            </div>
          )}

          {course.duration && (
            <div className="flex items-center gap-2 text-foreground/80">
              <Clock size={16} className="text-accent" />
              <span>{course.duration}</span>
            </div>
          )}

          {course.lessonsCount && (
            <div className="flex items-center gap-2 text-foreground/80">
              <Video size={16} className="text-accent" />
              <span className="font-medium">{course.lessonsCount} lessons</span>
            </div>
          )}

          <div className="pt-2 border-t border-border/50">
            {(course as any).paymentType === "monthly" ? (
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-accent">
                    £{typeof course.price === 'string' ? parseFloat(course.price).toFixed(2) : Number(course.price).toFixed(2)}
                  </span>
                  <span className="text-xs text-foreground/50 font-medium">/month</span>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide bg-accent/15 text-accent border border-accent/30 px-2 py-0.5 rounded-full">
                  <RefreshCw size={9} />
                  Monthly
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-foreground/50">GBP</span>
                <span className="text-xl font-bold text-accent">
                  £{typeof course.price === 'string' ? parseFloat(course.price).toFixed(2) : Number(course.price).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* CTA Button */}
        <Link href={`/courses/${course.id}`} className="mt-auto">
          <Button className="bg-gradient-to-r from-[#00D4FF] to-[#9D4EDD] text-white hover:scale-105 active:scale-95 transition-all w-full btn-modern"><Trans>View Course</Trans></Button>
        </Link>
      </div>
    </Card>
  );
});

export default CourseCard;
