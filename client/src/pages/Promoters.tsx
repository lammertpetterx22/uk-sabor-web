import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Loader2, Instagram, Users, Calendar, BookOpen, Ticket,
  Search, Star, Megaphone, GraduationCap, Music
} from "lucide-react";

// ─── Plan badge helpers ───────────────────────────────────────────────────────
const PLAN_LABELS: Record<string, string> = {
  academy: "Academy",
  promoter: "Promoter",
  creator: "Creator",
  starter: "Starter",
};

const PLAN_COLORS: Record<string, string> = {
  academy: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  promoter: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  creator: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  starter: "bg-foreground/10 text-foreground/50 border-border/50",
};

const ROLE_LABELS: Record<string, string> = {
  promoter: "Promoter",
  instructor: "Instructor",
  admin: "Team",
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  promoter: <Megaphone className="h-3 w-3" />,
  instructor: <GraduationCap className="h-3 w-3" />,
  admin: <Star className="h-3 w-3" />,
};

// ─── Promoter Card ────────────────────────────────────────────────────────────
type PromoterItem = {
  id: number;
  name: string | null;
  role: string;
  subscriptionPlan: string | null;
  photoUrl: string | null;
  bio: string | null;
  specialties: string | null;
  instagramHandle: string | null;
  courseCount: number;
  classCount: number;
  eventCount: number;
};

function PromoterCard({ promoter }: { promoter: PromoterItem }) {
  const specialties: string[] = (() => {
    if (!promoter.specialties) return [];
    try {
      const parsed = typeof promoter.specialties === "string"
        ? JSON.parse(promoter.specialties)
        : promoter.specialties;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const plan = promoter.subscriptionPlan ?? "starter";
  const planLabel = PLAN_LABELS[plan] ?? plan;
  const planColor = PLAN_COLORS[plan] ?? PLAN_COLORS.starter;
  const roleLabel = ROLE_LABELS[promoter.role] ?? promoter.role;
  const roleIcon = ROLE_ICONS[promoter.role];

  const totalContent = promoter.courseCount + promoter.classCount + promoter.eventCount;

  return (
    <Link href={`/promoters/${promoter.id}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border/50 hover:border-accent/50 transition-all duration-300 hover:shadow-2xl hover:shadow-accent/20 hover:-translate-y-1">
        {/* Photo */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-[#E91E8C]/30 via-[#FF4500]/20 to-[#FFD700]/30">
          {promoter.photoUrl ? (
            <>
              <img
                src={promoter.photoUrl}
                alt={promoter.name ?? "Promoter"}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/40 to-accent/20">
              <div className="text-7xl font-bold text-accent/40">
                {(promoter.name ?? "?").charAt(0).toUpperCase()}
              </div>
            </div>
          )}

          {/* Plan badge top-right */}
          {plan !== "starter" && (
            <div className="absolute top-3 right-3">
              <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold backdrop-blur-sm ${planColor}`}>
                {planLabel}
              </span>
            </div>
          )}

          {/* Name + specialties overlaid */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-white/70 text-xs flex items-center gap-1">
                {roleIcon} {roleLabel}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2 drop-shadow-lg">{promoter.name ?? "Unnamed"}</h3>
            {specialties.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {specialties.slice(0, 3).map((s, i) => (
                  <span key={i} className="text-xs bg-accent/80 text-white px-2 py-0.5 rounded-full font-medium backdrop-blur-sm">
                    {s}
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

        {/* Card body */}
        <div className="p-4">
          {promoter.bio && (
            <p className="text-sm text-foreground/70 line-clamp-2 mb-3">{promoter.bio}</p>
          )}

          {/* Content stats */}
          {totalContent > 0 && (
            <div className="flex gap-3 mb-3 text-xs text-foreground/60">
              {promoter.eventCount > 0 && (
                <span className="flex items-center gap-1">
                  <Ticket className="h-3 w-3 text-accent" />
                  {promoter.eventCount} event{promoter.eventCount !== 1 ? "s" : ""}
                </span>
              )}
              {promoter.classCount > 0 && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-accent" />
                  {promoter.classCount} class{promoter.classCount !== 1 ? "es" : ""}
                </span>
              )}
              {promoter.courseCount > 0 && (
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3 text-accent" />
                  {promoter.courseCount} course{promoter.courseCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            {promoter.instagramHandle ? (
              <a
                href={`https://instagram.com/${promoter.instagramHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-accent hover:text-accent/80 transition-colors text-xs font-medium"
              >
                <Instagram size={13} />
                <span>@{promoter.instagramHandle}</span>
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Promoters() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "promoter" | "instructor">("all");

  const { data: promoters, isLoading } = trpc.promoters.list.useQuery();

  const filtered = (promoters ?? []).filter((p) => {
    const matchesSearch =
      !search ||
      (p.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.bio ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (() => {
        try {
          const specs: string[] = typeof p.specialties === "string" ? JSON.parse(p.specialties) : (p.specialties ?? []);
          return specs.some((s) => s.toLowerCase().includes(search.toLowerCase()));
        } catch { return false; }
      })();
    const matchesRole = roleFilter === "all" || p.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const promoterCount = (promoters ?? []).filter((p) => p.role === "promoter").length;
  const instructorCount = (promoters ?? []).filter((p) => p.role === "instructor").length;
  const totalEvents = (promoters ?? []).reduce((sum, p) => sum + p.eventCount, 0);

  return (
    <div className="min-h-screen bg-background">

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#E91E8C]/20 via-[#FF4500]/10 to-[#FFD700]/10 py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent" />
        <div className="container relative">
          <div className="max-w-3xl">
            <p className="text-accent font-semibold mb-3 uppercase tracking-widest text-sm">Community</p>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Promoters &amp; <span className="gradient-text">Instructors</span>
            </h1>
            <p className="text-lg md:text-xl text-foreground/70 max-w-2xl leading-relaxed">
              Discover the talented promoters and instructors who bring Latin dance to life across the UK. Browse their events, classes, and courses.
            </p>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border/50 bg-card/50 py-6">
        <div className="container">
          <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                <Megaphone size={18} className="text-accent" />
              </div>
              <div>
                <div className="text-xl font-bold">{promoterCount}</div>
                <div className="text-xs text-foreground/60">Promoters</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                <GraduationCap size={18} className="text-accent" />
              </div>
              <div>
                <div className="text-xl font-bold">{instructorCount}</div>
                <div className="text-xs text-foreground/60">Instructors</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                <Music size={18} className="text-accent" />
              </div>
              <div>
                <div className="text-xl font-bold">{totalEvents}</div>
                <div className="text-xs text-foreground/60">Upcoming Events</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 border-b border-border/30">
        <div className="container">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
              <Input
                placeholder="Search by name, specialty..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "promoter", "instructor"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    roleFilter === r
                      ? "bg-accent text-white border-accent"
                      : "bg-transparent text-foreground/60 border-border/50 hover:border-accent/50 hover:text-foreground"
                  }`}
                >
                  {r === "all" ? "All" : r === "promoter" ? "Promoters" : "Instructors"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-12 md:py-20">
        <div className="container">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-accent" size={48} />
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filtered.map((p) => (
                <PromoterCard key={p.id} promoter={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                <Users size={32} className="text-accent/50" />
              </div>
              <p className="text-xl text-foreground/70 mb-3">
                {search || roleFilter !== "all" ? "No results found." : "No promoters or instructors yet."}
              </p>
              <p className="text-foreground/50 text-sm">
                {search || roleFilter !== "all" ? "Try adjusting your filters." : "Check back soon!"}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-accent/10 via-primary/10 to-accent/10 border-t border-border/30">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Want to promote your events?</h2>
          <p className="text-foreground/60 mb-8 max-w-xl mx-auto">
            Join UK Sabor as a promoter or instructor. Create events, run classes, and reach thousands of Latin dance enthusiasts across the UK.
          </p>
          <Link href="/plans">
            <button className="btn-vibrant px-8 py-3 rounded-full font-semibold text-white bg-accent hover:bg-accent/90 transition-colors">
              View Plans
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
