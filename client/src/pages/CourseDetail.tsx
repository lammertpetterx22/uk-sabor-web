import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Loader2, ArrowLeft, BookOpen, CheckCircle2, Clock,
  Star, AlertCircle, Play,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useCallback } from "react";
import { EnhancedVideoPlayer } from "@/../components/video/EnhancedVideoPlayer";
import LessonList, { isLessonUnlocked } from "@/components/LessonList";
import AddToCartButton from "@/components/cart/AddToCartButton";

// ─── Types (mirrors tRPC lesson shape) ─────────────────────────────────────
interface LessonItem {
  id: number;
  courseId: number;
  title: string;
  description?: string | null;
  videoUrl?: string | null;
  bunnyVideoId?: string | null;
  bunnyLibraryId?: string | null;
  position: number;
  durationSeconds?: number | null;
  isPreview: boolean;
  locked: boolean;
}

export default function CourseDetail() {
  const [, params] = useRoute("/courses/:id");
  const courseId = parseInt(params?.id || "0");
  const { user, isAuthenticated } = useAuth();

  // Active lesson being played
  const [activeLessonId, setActiveLessonId] = useState<number | null>(null);

  // ── Data queries ──────────────────────────────────────────────────────────
  const { data: course, isLoading } = trpc.courses.getById.useQuery(courseId, {
    enabled: !!courseId,
  });
  const { data: instructor } = trpc.instructors.getById.useQuery(
    course?.instructorId || 0,
    { enabled: !!course?.instructorId }
  );
  const hasAccessQuery = trpc.courses.hasAccess.useQuery(courseId, {
    enabled: !!courseId && isAuthenticated,
  });
  const hasPurchased = hasAccessQuery.data === true;

  // Lessons list
  const { data: lessonsData } = trpc.lessons.getByCourseId.useQuery(courseId, {
    enabled: !!courseId,
  });
  const lessons: LessonItem[] = (lessonsData ?? []) as LessonItem[];

  // Progress map
  const { data: progressData, refetch: refetchProgress } = trpc.lessons.getProgress.useQuery(
    courseId,
    { enabled: !!courseId && isAuthenticated }
  );
  const progress: Record<number, { watchPercent: number; completed: boolean }> =
    (progressData ?? {}) as Record<number, { watchPercent: number; completed: boolean }>;

  // ── Mutations ─────────────────────────────────────────────────────────────
  const checkoutMutation = trpc.payments.createCourseCheckout.useMutation({
    onSuccess: data => {
      if (data.checkoutUrl) {
        toast.success("Redirecting to checkout...");
        window.open(data.checkoutUrl, "_blank");
      }
    },
    onError: err => toast.error(err.message),
  });

  const updateProgressMutation = trpc.lessons.updateProgress.useMutation({
    onSuccess: () => refetchProgress(),
  });

  // ── Active lesson helpers ─────────────────────────────────────────────────
  const activeLesson = lessons.find(l => l.id === activeLessonId) ?? null;

  const handleSelectLesson = (lesson: LessonItem) => {
    const unlocked = isLessonUnlocked(lesson, lessons, progress, hasPurchased);
    if (!unlocked) {
      toast.error("Complete the previous lesson to unlock this one.");
      return;
    }
    setActiveLessonId(lesson.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleProgress = useCallback(
    (percent: number) => {
      if (!activeLessonId) return;
      updateProgressMutation.mutate({ lessonId: activeLessonId, watchPercent: percent });
    },
    [activeLessonId, updateProgressMutation]
  );

  const handleComplete = useCallback(() => {
    if (!activeLessonId) return;
    const activeIdx = lessons.findIndex(l => l.id === activeLessonId);
    const nextLesson = lessons[activeIdx + 1];

    updateProgressMutation.mutate({ lessonId: activeLessonId, watchPercent: 100 });

    if (nextLesson) {
      toast.success("🎉 Lesson completed! The next one has been unlocked.", {
        duration: 4000,
        description: `Next: ${nextLesson.title}`,
      });
    } else {
      toast.success("🎊 Congratulations! You've completed all lessons in this course.", {
        duration: 5000,
        description: "Course finished successfully!",
      });
    }
  }, [activeLessonId, updateProgressMutation, lessons]);

  // Manual toggle complete/incomplete
  const toggleComplete = useCallback(() => {
    if (!activeLessonId) return;
    const isCurrentlyCompleted = progress[activeLessonId]?.completed;

    if (isCurrentlyCompleted) {
      // Mark as incomplete
      updateProgressMutation.mutate({ lessonId: activeLessonId, watchPercent: 0 });
      toast.info("🔄 Lesson marked as incomplete", {
        duration: 2500,
      });
    } else {
      // Mark as complete
      updateProgressMutation.mutate({ lessonId: activeLessonId, watchPercent: 100 });
      toast.success("✅ Lesson marked as complete!", {
        duration: 2500,
      });
    }
  }, [activeLessonId, progress, updateProgressMutation]);

  // ── Compute overall progress ──────────────────────────────────────────────
  const totalLessons = lessons.length;
  const completedCount = lessons.filter(l => progress[l.id]?.completed).length;
  const overallPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  // ── Loading / not found ───────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center py-32">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-16 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Course not found</h1>
          <Link href="/courses"><Button variant="outline">Back to Courses</Button></Link>
        </div>
      </div>
    );
  }

  // Whether the active lesson should show as locked
  const activeLocked =
    activeLesson !== null &&
    !isLessonUnlocked(activeLesson, lessons, progress, hasPurchased);

  const price = parseFloat(String(course.price));

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 pt-24">
        {/* Breadcrumb */}
        <Link href="/courses" className="inline-flex items-center gap-2 text-foreground/60 hover:text-accent mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Courses
        </Link>

        {/* Course-level Video Fallback (if no lessons) */}
        {lessons.length === 0 && ((course as any).videoUrl || (course as any).bunnyVideoId) && (
          <Card className="overflow-hidden border-border/50 mb-8 max-w-4xl mx-auto shadow-2xl">
            <div className="relative">
              <EnhancedVideoPlayer
                bunnyVideoId={(course as any).bunnyVideoId}
                bunnyLibraryId={(course as any).bunnyLibraryId}
                videoUrl={course.videoUrl || undefined}
                poster={course.imageUrl || undefined}
                title={course.title}
                isLocked={!hasPurchased}
              />
              {/* Course title bar */}
              <div className="px-4 py-3 bg-card/80 border-t border-border/30 flex items-center gap-3">
                <Play size={14} className="text-[#FA3698]" />
                <p className="text-sm font-medium text-foreground/80 truncate">
                  {course.title} - Course Video
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Main: video player + course info ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Video area */}
            {activeLesson && (activeLesson.videoUrl || activeLesson.bunnyVideoId) ? (
              <Card className="overflow-hidden border-border/50">
                <div className="relative">
                  <EnhancedVideoPlayer
                    bunnyVideoId={activeLesson.bunnyVideoId || undefined}
                    bunnyLibraryId={activeLesson.bunnyLibraryId || undefined}
                    videoUrl={activeLesson.videoUrl || undefined}
                    poster={course.imageUrl || undefined}
                    title={activeLesson.title}
                    isLocked={activeLocked}
                    onProgress={handleProgress}
                    onComplete={handleComplete}
                  />
                  {/* Lesson title bar with progress and complete button */}
                  <div className="px-4 py-3 bg-card/80 border-t border-border/30">
                    {/* Title row */}
                    <div className="flex items-center gap-3 mb-2">
                      <Play size={14} className="text-[#FA3698]" />
                      <p className="text-sm font-medium text-foreground/80 truncate flex-1">
                        Lesson {activeLesson.position}: {activeLesson.title}
                      </p>
                      {progress[activeLesson.id]?.completed && (
                        <Badge variant="outline" className="text-green-400 border-green-400/50 bg-green-400/10 gap-1 flex-shrink-0">
                          <CheckCircle2 size={12} />
                          Completed
                        </Badge>
                      )}
                    </div>

                    {/* Progress bar and complete button */}
                    <div className="flex items-center gap-3">
                      {/* Progress bar */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs text-foreground/60 mb-1">
                          <span>Progress</span>
                          <span className="font-semibold">
                            {Math.round(progress[activeLesson.id]?.watchPercent || 0)}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${progress[activeLesson.id]?.watchPercent || 0}%`,
                              background: progress[activeLesson.id]?.completed
                                ? "linear-gradient(90deg, #10b981, #059669)"
                                : "linear-gradient(90deg, #FA3698, #FD4D43)",
                            }}
                          />
                        </div>
                      </div>

                      {/* Toggle complete button - responsive */}
                      <Button
                        size="sm"
                        variant={progress[activeLesson.id]?.completed ? "outline" : "default"}
                        onClick={toggleComplete}
                        disabled={updateProgressMutation.isPending}
                        className={
                          progress[activeLesson.id]?.completed
                            ? "border-green-400/50 text-green-400 hover:bg-green-400/10 gap-1.5 flex-shrink-0"
                            : "btn-vibrant gap-1.5 flex-shrink-0"
                        }
                      >
                        {updateProgressMutation.isPending ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : progress[activeLesson.id]?.completed ? (
                          <>
                            <CheckCircle2 size={14} />
                            <span className="hidden sm:inline">Completed</span>
                            <span className="sm:hidden">Done</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={14} />
                            <span className="hidden sm:inline">Mark as complete</span>
                            <span className="sm:hidden">Complete</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ) : hasPurchased && lessons.length > 0 ? (
              /* No active lesson → show first unlocked lesson prompt */
              <Card className="border-[#FA3698]/20 bg-[#FA3698]/5">
                <CardContent className="py-12 flex flex-col items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-[#FA3698]/20 flex items-center justify-center">
                    <Play size={28} className="text-[#FA3698] ml-1" />
                  </div>
                  <p className="text-foreground/70 text-center">
                    Select a lesson from the list to begin
                  </p>
                  <Button
                    onClick={() => handleSelectLesson(lessons.find(l => l.position === 1)!)}
                    className="btn-vibrant"
                  >
                    Start Lesson 1
                  </Button>
                </CardContent>
              </Card>
            ) : lessons.length === 0 ? (
              /* No lessons at all - fallback info card if video played above */
              <Card className="border-border/30 bg-card/50">
                <CardContent className="py-8">
                  <h3 className="text-lg font-semibold mb-2">About this course</h3>
                  <p className="text-foreground/70 mb-4">{course.description}</p>
                  <div className="flex items-center gap-2 text-sm text-foreground/50">
                    <BookOpen size={16} />
                    <span>Detailed lessons coming soon</span>
                  </div>
                </CardContent>
              </Card>
            ) : !hasPurchased ? (
              /* Not purchased */
              <Card className="border-accent/30 bg-accent/5">
                <div className="aspect-video flex flex-col items-center justify-center gap-4 p-8 relative">
                  {course.imageUrl && (
                    <img
                      src={course.imageUrl}
                      alt={course.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-20"
                    />
                  )}
                  <div className="relative flex flex-col items-center gap-4 z-10">
                    <div className="h-16 w-16 rounded-full bg-black/40 backdrop-blur flex items-center justify-center border border-white/20">
                      <BookOpen size={28} className="text-accent" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-1">Content locked</h3>
                      <p className="text-foreground/60 text-sm">Purchase this course to access the lessons</p>
                    </div>
                  </div>
                </div>
              </Card>
            ) : null}

            {/* ── Lessons list (for purchased users) ── */}
            {hasPurchased && lessons.length > 0 && (
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Course lessons</CardTitle>
                    <span className="text-sm text-foreground/50">
                      {completedCount}/{totalLessons} completed
                    </span>
                  </div>

                  {/* Overall progress bar */}
                  <div className="h-1.5 bg-white/10 rounded-full mt-2">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${overallPct}%`,
                        background: "linear-gradient(90deg, #FA3698, #FD4D43)",
                      }}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <LessonList
                    lessons={lessons}
                    progress={progress}
                    activeLessonId={activeLessonId}
                    hasPurchased={hasPurchased}
                    onSelectLesson={handleSelectLesson}
                  />
                </CardContent>
              </Card>
            )}

            {/* ── Course Info ── */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-3xl mb-2">{course.title}</CardTitle>
                    <CardDescription className="text-base">
                      Taught by{" "}
                      <span className="text-accent font-semibold">{instructor?.name || "Instructor"}</span>
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-accent border-accent/50 shrink-0">
                    {course.level
                      ? { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" }[
                      course.level as "beginner" | "intermediate" | "advanced"
                      ] ?? course.level
                      : "All levels"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-card/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-foreground/60 mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs uppercase tracking-wide">Duration</span>
                    </div>
                    <p className="font-semibold">{course.duration || "At your own pace"}</p>
                  </div>
                  <div className="bg-card/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-foreground/60 mb-1">
                      <BookOpen className="h-4 w-4" />
                      <span className="text-xs uppercase tracking-wide">Lessons</span>
                    </div>
                    <p className="font-semibold">{totalLessons || course.lessonsCount || "Multiple"}</p>
                  </div>
                  <div className="bg-card/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-foreground/60 mb-1">
                      <Star className="h-4 w-4" />
                      <span className="text-xs uppercase tracking-wide">Style</span>
                    </div>
                    <p className="font-semibold">{course.danceStyle || "Mixed"}</p>
                  </div>
                </div>

                {/* Description */}
                {course.description && (
                  <div>
                    <h3 className="font-semibold mb-2">About this course</h3>
                    <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{course.description}</p>
                  </div>
                )}

                {/* Instructor */}
                {instructor && (
                  <div className="border-t border-border/50 pt-6">
                    <h3 className="font-semibold mb-3">Your instructor</h3>
                    <div className="flex items-center gap-4">
                      {instructor.photoUrl ? (
                        <img
                          src={instructor.photoUrl}
                          alt={instructor.name}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FA3698] to-[#FD4D43] flex items-center justify-center text-white font-bold text-xl">
                          {instructor.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold">{instructor.name}</p>
                        <p className="text-sm text-foreground/60">{instructor.bio || "Professional dance instructor"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Sidebar: purchase / progress card ── */}
          <div>
            <Card className="sticky top-24 border-accent/20">
              <CardContent className="pt-6 space-y-6">
                <div className="text-center">
                  <p className="text-sm text-foreground/60 mb-1">Course price</p>
                  <p className="text-4xl font-bold text-accent">£{price.toFixed(2)}</p>
                </div>

                {hasPurchased ? (
                  <div className="space-y-4">
                    {/* Overall progress */}
                    <div className="bg-card/50 rounded-lg p-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-foreground/60">Your progress</span>
                        <span className="font-semibold text-accent">{overallPct}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${overallPct}%`,
                            background: "linear-gradient(90deg, #FA3698, #FD4D43)",
                          }}
                        />
                      </div>
                      <p className="text-xs text-foreground/50 mt-2">
                        {completedCount} of {totalLessons} lessons completed
                      </p>
                    </div>

                    {overallPct === 100 && (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                        <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="font-semibold text-green-400">Course completed!</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ul className="space-y-2.5">
                      {[
                        "Unlimited access",
                        "All lessons included",
                        "Learn at your own pace",
                        "Professional instructor",
                      ].map(item => (
                        <li key={item} className="flex items-center gap-3">
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-foreground/80">{item}</span>
                        </li>
                      ))}
                    </ul>

                    <AddToCartButton
                      item={{
                        type: "course",
                        id: course.id,
                        title: course.title,
                        price: price,
                        imageUrl: course.imageUrl || undefined,
                        instructorName: instructor?.name,
                      }}
                      className="w-full py-5 text-base"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="h-20" />
    </div>
  );
}
