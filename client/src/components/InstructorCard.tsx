import { Link } from "wouter";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Instagram } from "lucide-react";
import type { Instructor } from "@shared/types";

interface InstructorCardProps {
  instructor: Instructor;
}

const InstructorCard = memo(function InstructorCard({ instructor }: InstructorCardProps) {
  const specialties = instructor.specialties
    ? typeof instructor.specialties === "string"
      ? (() => { try { return JSON.parse(instructor.specialties); } catch { return []; } })()
      : Array.isArray(instructor.specialties)
        ? instructor.specialties
        : []
    : [];

  return (
    <Card className="glass overflow-hidden hover:shadow-2xl hover:shadow-[#FFD700]/30 transition-all duration-300 transform hover:scale-105 h-full flex flex-col group bg-gradient-to-b from-card to-card/80 border border-white/10">
      {/* Instructor Photo - Enhanced Gallery Style */}
      <div className="relative h-96 overflow-hidden bg-gradient-to-br from-[#E91E8C]/20 via-[#FF4500]/10 to-[#FFD700]/20">
        {instructor.photoUrl ? (
          <>
            <img
              src={instructor.photoUrl}
              alt={instructor.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
              decoding="async"
              width="400"
              height="384"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-70" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/50 to-accent/20">
            <div className="text-7xl font-bold text-accent/50">{instructor.name.charAt(0)}</div>
          </div>
        )}
      </div>

      {/* Instructor Content */}
      <div className="p-6 flex flex-col flex-grow space-y-4">
        {/* Name */}
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-[#FF4500] to-[#FFD700] bg-clip-text text-transparent leading-tight">{instructor.name}</h3>
        </div>

        {/* Specialties - Improved Layout */}
        {specialties.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {specialties.map((specialty: string, idx: number) => (
              <span 
                key={idx} 
                className="text-xs font-semibold bg-gradient-to-r from-[#E91E8C] to-[#FF4500] text-white px-3 py-1.5 rounded-full border border-white/20 shadow-sm"
              >
                {specialty}
              </span>
            ))}
          </div>
        )}

        {/* Bio - Better Typography */}
        <p className="text-foreground/75 text-sm leading-relaxed line-clamp-4 flex-grow">{instructor.bio}</p>

        {/* Social Links - Improved Styling */}
        {instructor.instagramHandle && (
          <div className="pt-2 border-t border-accent/10">
            <a
              href={`https://instagram.com/${instructor.instagramHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-accent hover:text-accent/80 transition-colors text-sm font-semibold hover:underline"
            >
              <Instagram size={18} />
              <span>@{instructor.instagramHandle}</span>
            </a>
          </div>
        )}

        {/* CTA Button */}
        <Link href={`/instructors/${instructor.id}`} className="mt-auto pt-2">
          <Button className="btn-vibrant btn-modern w-full font-semibold py-3 text-base">View Profile</Button>
        </Link>
      </div>
    </Card>
  );
});

export default InstructorCard;
