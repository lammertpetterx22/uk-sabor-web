import { CheckCircle2, Lock, Play, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Lesson {
    id: number;
    courseId: number;
    title: string;
    description?: string | null;
    position: number;
    durationSeconds?: number | null;
    isPreview: boolean;
    locked: boolean;
    videoUrl?: string | null;
}

interface LessonProgress {
    watchPercent: number;
    completed: boolean;
}

interface LessonListProps {
    lessons: Lesson[];
    /** Map of lessonId → progress */
    progress: Record<number, LessonProgress>;
    activeLessonId: number | null;
    hasPurchased: boolean;
    onSelectLesson: (lesson: Lesson) => void;
}

function formatDuration(seconds: number | null | undefined): string {
    if (!seconds) return "";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

/**
 * Determines if a lesson is unlocked based on sequential logic:
 * - Lesson 1 is always unlocked (if not locked by purchase)
 * - Lesson N is unlocked when lesson N-1 is completed
 */
export function isLessonUnlocked(
    lesson: Lesson,
    allLessons: Lesson[],
    progress: Record<number, LessonProgress>,
    hasPurchased: boolean
): boolean {
    if (lesson.isPreview) return true;
    if (!hasPurchased) return false;

    // First lesson is always unlocked
    if (lesson.position === 1) return true;

    // Find the previous lesson (by position)
    const prev = allLessons.find(l => l.position === lesson.position - 1);
    if (!prev) return true; // No previous lesson → unlock

    return progress[prev.id]?.completed === true;
}

export default function LessonList({
    lessons,
    progress,
    activeLessonId,
    hasPurchased,
    onSelectLesson,
}: LessonListProps) {
    const sorted = [...lessons].sort((a, b) => a.position - b.position);

    return (
        <div className="space-y-1">
            {sorted.map(lesson => {
                const unlocked = isLessonUnlocked(lesson, lessons, progress, hasPurchased);
                const lessonProgress = progress[lesson.id];
                const isCompleted = lessonProgress?.completed ?? false;
                const watchPct = lessonProgress?.watchPercent ?? 0;
                const isActive = activeLessonId === lesson.id;

                return (
                    <button
                        key={lesson.id}
                        disabled={!unlocked}
                        onClick={() => unlocked && onSelectLesson(lesson)}
                        className={cn(
                            "w-full text-left rounded-lg p-3 transition-all group",
                            "border",
                            isActive
                                ? "border-[#FA3698]/60 bg-[#FA3698]/10"
                                : unlocked
                                    ? "border-white/5 hover:border-[#FA3698]/30 hover:bg-white/5 cursor-pointer"
                                    : "border-white/5 cursor-not-allowed opacity-50"
                        )}
                    >
                        <div className="flex items-start gap-3">
                            {/* Status icon */}
                            <div
                                className={cn(
                                    "mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold",
                                    isCompleted
                                        ? "bg-green-500/20 text-green-400"
                                        : isActive
                                            ? "bg-[#FA3698]/20 text-[#FA3698]"
                                            : unlocked
                                                ? "bg-white/10 text-white/60"
                                                : "bg-white/5 text-white/30"
                                )}
                            >
                                {isCompleted ? (
                                    <CheckCircle2 size={15} />
                                ) : !unlocked ? (
                                    <Lock size={13} />
                                ) : isActive ? (
                                    <Play size={13} className="ml-0.5" />
                                ) : (
                                    <span className="text-xs">{lesson.position}</span>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p
                                        className={cn(
                                            "font-medium text-sm truncate",
                                            isActive ? "text-[#FA3698]" : isCompleted ? "text-green-400" : "text-white"
                                        )}
                                    >
                                        {lesson.title}
                                    </p>
                                    {!hasPurchased && lesson.isPreview && (
                                        <span className="text-xs text-[#FCC500] font-semibold shrink-0">GRATIS</span>
                                    )}
                                </div>

                                {/* Duration + progress */}
                                <div className="flex items-center gap-3 mt-1">
                                    {lesson.durationSeconds && (
                                        <span className="flex items-center gap-1 text-xs text-white/40">
                                            <Clock size={10} />
                                            {formatDuration(lesson.durationSeconds)}
                                        </span>
                                    )}
                                    {watchPct > 0 && !isCompleted && (
                                        <span className="text-xs text-white/40">{watchPct}% visto</span>
                                    )}
                                </div>

                                {/* Mini progress bar with animation */}
                                {watchPct > 0 && (
                                    <div className="mt-1.5 h-0.5 w-full rounded-full bg-white/10 overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all duration-500",
                                                isCompleted && "animate-pulse"
                                            )}
                                            style={{
                                                width: `${watchPct}%`,
                                                background: isCompleted
                                                    ? "linear-gradient(90deg, #10b981, #059669)"
                                                    : "linear-gradient(90deg, #FA3698, #FD4D43)",
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Completed badge with animation */}
                                {isCompleted && (
                                    <div className="mt-1.5 flex items-center gap-1 text-xs text-green-400 font-medium animate-in fade-in slide-in-from-left-2 duration-500">
                                        <CheckCircle2 size={11} />
                                        <span>Completada</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
