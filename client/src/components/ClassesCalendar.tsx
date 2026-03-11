import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, DollarSign } from "lucide-react";

interface ClassData {
  id: number;
  title: string;
  danceStyle?: string | null;
  level?: string | null;
  classDate: Date | string;
  duration: number | null;
  price: string | number;
  maxParticipants: number | null;
  currentParticipants: number | null;
  instructorId: number;
  imageUrl?: string | null;
  hasSocial?: boolean | null;
  socialDescription?: string | null;
}

interface ClassesCalendarProps {
  classes: ClassData[];
  onClassClick?: (classId: number) => void;
}

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAYS_ES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function ClassesCalendar({ classes, onClassClick }: ClassesCalendarProps) {
  // Group classes by day of week
  const groupedByDay = React.useMemo(() => {
    const grouped: Record<number, ClassData[]> = {};

    for (let i = 0; i < 7; i++) {
      grouped[i] = [];
    }

    classes.forEach((cls) => {
      const date = new Date(cls.classDate);
      const dayOfWeek = date.getDay();
      grouped[dayOfWeek].push(cls);
    });

    // Sort classes within each day by time
    Object.keys(grouped).forEach((day) => {
      grouped[parseInt(day)].sort((a, b) => {
        const timeA = new Date(a.classDate).getTime();
        const timeB = new Date(b.classDate).getTime();
        return timeA - timeB;
      });
    });

    return grouped;
  }, [classes]);

  const renderClass = (cls: ClassData) => {
    const classDate = new Date(cls.classDate);
    const timeStr = classDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const durationHours = cls.duration ? Math.floor(cls.duration / 60) : 0;
    const durationMins = cls.duration ? cls.duration % 60 : 0;

    return (
      <div
        key={cls.id}
        className="border border-border/50 rounded-lg p-4 hover:border-accent/50 hover:bg-accent/5 transition-all cursor-pointer"
        onClick={() => onClassClick?.(cls.id)}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1">
            <h4 className="font-semibold text-foreground text-sm">{cls.title}</h4>
            <p className="text-xs text-foreground/60">{cls.danceStyle}</p>
          </div>
          <Badge variant="outline" className="text-xs shrink-0">
            {cls.level === "all-levels" ? "All Levels" : cls.level}
          </Badge>
        </div>

        <div className="space-y-2 text-xs text-foreground/70">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-accent" />
            <span>{timeStr} · {durationHours}h {durationMins}min</span>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5 text-accent" />
            <span>£{cls.price}</span>
          </div>

          {cls.maxParticipants && (
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-accent" />
              <span>{cls.currentParticipants || 0}/{cls.maxParticipants} participants</span>
            </div>
          )}

          {cls.hasSocial && (
            <div className="mt-2 pt-2 border-t border-border/30">
              <p className="font-semibold text-accent text-xs">Includes Social</p>
              {cls.socialDescription && <p className="text-xs text-foreground/60 mt-1">{cls.socialDescription}</p>}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {DAYS_ES.map((dayName, dayIndex) => {
          const dayClasses = groupedByDay[dayIndex] || [];
          const hasClasses = dayClasses.length > 0;

          return (
            <Card
              key={dayIndex}
              className={`overflow-hidden transition-all ${hasClasses ? "border-accent/50 bg-accent/5" : "border-border/30 opacity-50"
                }`}
            >
              <div className="bg-gradient-to-r from-accent/20 to-accent/10 p-3 border-b border-border/50">
                <h3 className="font-semibold text-foreground">{dayName}</h3>
                <p className="text-xs text-foreground/60">
                  {hasClasses ? `${dayClasses.length} class${dayClasses.length !== 1 ? "es" : ""}` : "No classes"}
                </p>
              </div>

              <div className="p-4 space-y-3">
                {hasClasses ? (
                  dayClasses.map(renderClass)
                ) : (
                  <p className="text-xs text-foreground/40 text-center py-4">No classes scheduled</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
