import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Menu,
  X,
  ChevronDown,
  Calendar,
  GraduationCap,
  BookOpen,
  Users,
  Megaphone,
  Ticket,
  LayoutDashboard,
  Radio,
  Shield,
  LogOut,
  UserCircle,
  Globe,
  ArrowRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTranslations } from "@/hooks/useTranslations";
import { useTr } from "@/components/Trans";
import { SUPPORTED_LANGUAGES } from "@/i18n/config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SABOR_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663400274503/DGihaPaJvnMFHruoq9jmVQ/sabor-logo_7c905b38.png";

type User = {
  id: number;
  name?: string | null;
  email?: string | null;
  role: string;
  roles?: string | null;
  subscriptionPlan?: string | null;
};

function parseRolesJson(s: string | null | undefined): string[] {
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getAllRoles(user: User | null | undefined): string[] {
  if (!user) return [];
  const all = [user.role, ...parseRolesJson(user.roles)];
  return Array.from(new Set(all));
}

function roleChips(roles: string[]): Array<{ label: string; className: string }> {
  const chips: Array<{ label: string; className: string }> = [];
  if (roles.includes("admin")) chips.push({ label: "Admin", className: "bg-red-500/15 text-red-400 border-red-500/30" });
  if (roles.includes("instructor")) chips.push({ label: "Instructor", className: "bg-purple-500/15 text-purple-400 border-purple-500/30" });
  if (roles.includes("promoter")) chips.push({ label: "Promoter", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" });
  if (roles.includes("rrp")) chips.push({ label: "RRP", className: "bg-orange-500/15 text-orange-400 border-orange-500/30" });
  if (chips.length === 0) chips.push({ label: "User", className: "bg-foreground/10 text-foreground/60 border-foreground/20" });
  return chips;
}

export default function Header() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useTranslations();
  const { i18n } = useTranslation();
  const { tr } = useTr();

  const [open, setOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);

  const roles = useMemo(() => getAllRoles(user as any), [user]);
  const isCreator = roles.some(r => r === "instructor" || r === "promoter");
  const isRrp = roles.includes("rrp");
  const isAdmin = roles.includes("admin");
  const hasAnyManagement = isCreator || isAdmin;

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    window.location.href = "/";
  };

  const closeMenu = () => setOpen(false);
  const go = (path: string) => { setOpen(false); setLocation(path); };

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === i18n.language) ?? SUPPORTED_LANGUAGES[0];
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const changeLang = (code: string) => {
    i18n.changeLanguage(code);
    setLangMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 border-b border-border/40 backdrop-blur-md shadow-md">
      <nav className="container flex items-center justify-between h-16 md:h-20" aria-label="Main navigation">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
          <img src={SABOR_LOGO} alt="UK Sabor" className="h-10 md:h-12 w-auto" />
          <span className="hidden sm:inline text-lg md:text-xl font-bold gradient-text">SABOR</span>
        </Link>

        {/* ═══════════════════ DESKTOP NAV ═══════════════════ */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/events" className="text-sm font-medium text-foreground/70 hover:text-accent transition-colors">
            {t("nav.events")}
          </Link>
          <Link href="/classes" className="text-sm font-medium text-foreground/70 hover:text-accent transition-colors">
            {t("nav.classes")}
          </Link>
          <Link href="/courses" className="text-sm font-medium text-foreground/70 hover:text-accent transition-colors">
            {t("nav.courses")}
          </Link>
          {/* More dropdown for secondary links */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-sm font-medium text-foreground/70 hover:text-accent transition-colors inline-flex items-center gap-1">
                {t("nav.more") || "More"} <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setLocation("/instructors")}>
                <GraduationCap className="h-4 w-4 mr-2" /> {t("nav.instructors")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation("/promoters")}>
                <Megaphone className="h-4 w-4 mr-2" /> {t("nav.promoters")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ═══════════════════ DESKTOP RIGHT ═══════════════════ */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Role-based primary CTA */}
              {hasAnyManagement && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setLocation("/admin")}
                  className="gap-1.5 border-accent/50 text-accent hover:bg-accent/10"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {isAdmin ? "Admin" : "My Studio"}
                </Button>
              )}
              {isRrp && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setLocation("/rrp-dashboard")}
                  className="gap-1.5 border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
                >
                  <Radio className="h-4 w-4" /> RRP
                </Button>
              )}

              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5 px-2">
                    <UserCircle className="h-5 w-5" />
                    <span className="max-w-[100px] truncate">{(user?.name || user?.email || "Profile").split(" ")[0]}</span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-2 border-b border-border/40">
                    <div className="font-medium text-sm truncate">{user?.name || "Profile"}</div>
                    <div className="text-xs text-foreground/60 truncate">{user?.email}</div>
                    <div className="flex gap-1 flex-wrap mt-2">
                      {roleChips(roles).map(c => (
                        <Badge key={c.label} variant="outline" className={`text-xs ${c.className}`}>{c.label}</Badge>
                      ))}
                    </div>
                  </div>
                  <DropdownMenuItem onClick={() => setLocation("/dashboard")}>
                    <Ticket className="h-4 w-4 mr-2" /> My Tickets
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/profile")}>
                    <UserCircle className="h-4 w-4 mr-2" /> Settings
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setLocation("/crm")}>CRM</DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-foreground/50">Language</DropdownMenuLabel>
                  {SUPPORTED_LANGUAGES.map(l => (
                    <DropdownMenuItem
                      key={l.code}
                      onClick={() => changeLang(l.code)}
                      className={l.code === i18n.language ? "bg-accent/10 text-accent" : ""}
                    >
                      <span className="mr-2">{l.flag}</span> {l.name}
                      {l.code === i18n.language && <span className="ml-auto text-xs">✓</span>}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-400 focus:text-red-400">
                    <LogOut className="h-4 w-4 mr-2" /> {t("nav.signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5 px-2">
                    <Globe className="h-4 w-4" /> {currentLang.flag}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Language</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {SUPPORTED_LANGUAGES.map(l => (
                    <DropdownMenuItem
                      key={l.code}
                      onClick={() => changeLang(l.code)}
                      className={l.code === i18n.language ? "bg-accent/10 text-accent" : ""}
                    >
                      <span className="mr-2">{l.flag}</span> {l.name}
                      {l.code === i18n.language && <span className="ml-auto text-xs">✓</span>}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button asChild className="btn-vibrant" size="sm">
                <a href="/login">{t("nav.login")}</a>
              </Button>
            </>
          )}
        </div>

        {/* ═══════════════════ MOBILE TRIGGER ═══════════════════ */}
        <button
          className="md:hidden p-2 -mr-2 hover:bg-foreground/5 rounded-lg transition-colors"
          onClick={() => setOpen(v => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* ═══════════════════ MOBILE DRAWER ═══════════════════ */}
      {open && (
        <div className="md:hidden fixed inset-0 top-16 bg-background/98 backdrop-blur-sm z-40 overflow-y-auto">
          <div className="container py-6 flex flex-col gap-5">

            {/* User card */}
            {isAuthenticated ? (
              <button
                onClick={() => go("/profile")}
                className="text-left bg-gradient-to-br from-accent/10 to-purple-500/10 border border-accent/30 rounded-xl p-4 hover:border-accent/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center shrink-0">
                    <UserCircle className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{user?.name || "Hola"}</div>
                    <div className="text-xs text-foreground/60 truncate">{user?.email}</div>
                    <div className="flex gap-1 flex-wrap mt-1.5">
                      {roleChips(roles).map(c => (
                        <Badge key={c.label} variant="outline" className={`text-[10px] px-1.5 py-0 ${c.className}`}>{c.label}</Badge>
                      ))}
                      {user?.subscriptionPlan && user.subscriptionPlan !== "starter" && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-500/15 text-amber-400 border-amber-500/30">
                          {user.subscriptionPlan}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ChevronDown className="h-5 w-5 text-foreground/40 rotate-[-90deg]" />
                </div>
              </button>
            ) : (
              <Button asChild className="btn-vibrant w-full" size="lg" onClick={closeMenu}>
                <a href="/login">{t("nav.login")}</a>
              </Button>
            )}

            {/* EXPLORE (collapsible) */}
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <button
                onClick={() => setExploreOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3.5 bg-card/50 hover:bg-card transition-colors"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-foreground/60">{tr("Explore")}</span>
                <ChevronDown className={`h-4 w-4 text-foreground/60 transition-transform ${exploreOpen ? "rotate-180" : ""}`} />
              </button>
              {exploreOpen && (
                <div className="divide-y divide-border/30 bg-card/20">
                  <MobileMenuItem icon={Calendar} label={t("nav.events") || "Events"} onClick={() => go("/events")} />
                  <MobileMenuItem icon={GraduationCap} label={t("nav.classes") || "Classes"} onClick={() => go("/classes")} />
                  <MobileMenuItem icon={BookOpen} label={t("nav.courses") || "Courses"} onClick={() => go("/courses")} />
                  <MobileMenuItem icon={Users} label={t("nav.instructors") || "Instructors"} onClick={() => go("/instructors")} />
                  <MobileMenuItem icon={Megaphone} label={t("nav.promoters") || "Promoters"} onClick={() => go("/promoters")} />
                </div>
              )}
            </div>

            {/* My Tickets (only if logged in) */}
            {isAuthenticated && (
              <MobileMenuItem
                icon={Ticket}
                label="My Tickets"
                onClick={() => go("/dashboard")}
                variant="framed"
              />
            )}

            {/* Role shortcuts */}
            {isAuthenticated && hasAnyManagement && (
              <MobileMenuItem
                icon={LayoutDashboard}
                label={isAdmin ? "Admin Panel" : "My Studio"}
                onClick={() => go("/admin")}
                trailing={<ArrowRight className="h-4 w-4" />}
                variant="highlighted"
                description={isAdmin ? "Full platform management" : "Manage your events, classes, earnings & attendance"}
              />
            )}
            {isAuthenticated && isRrp && (
              <MobileMenuItem
                icon={Radio}
                label="RRP Dashboard"
                onClick={() => go("/rrp-dashboard")}
                trailing={<ArrowRight className="h-4 w-4" />}
                variant="rrp"
                description="Your code, sales and commissions"
              />
            )}
            {isAuthenticated && isAdmin && (
              <div className="grid grid-cols-1 gap-2">
                <MobileSubItem label="CRM" onClick={() => go("/crm")} />
              </div>
            )}

            {/* Settings + language + logout */}
            {isAuthenticated && (
              <div className="rounded-xl border border-border/50 divide-y divide-border/30 bg-card/20 overflow-hidden">
                <MobileMenuItem icon={UserCircle} label="Settings" onClick={() => go("/profile")} />
                <button
                  onClick={() => setLangMenuOpen(v => !v)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-card transition-colors text-left"
                >
                  <Globe className="h-5 w-5 text-foreground/60 shrink-0" />
                  <span className="flex-1 font-medium text-sm">Language</span>
                  <span className="text-xs text-foreground/60 flex items-center gap-1">
                    {currentLang.flag} {currentLang.name}
                    <ChevronDown className={`h-4 w-4 transition-transform ${langMenuOpen ? "rotate-180" : ""}`} />
                  </span>
                </button>
                {langMenuOpen && (
                  <div className="bg-background/40 divide-y divide-border/20">
                    {SUPPORTED_LANGUAGES.map(l => (
                      <button
                        key={l.code}
                        onClick={() => changeLang(l.code)}
                        className={`w-full flex items-center gap-3 px-6 py-3 text-sm text-left hover:bg-card/50 transition-colors ${
                          l.code === i18n.language ? "text-accent font-semibold" : ""
                        }`}
                      >
                        <span className="text-base">{l.flag}</span>
                        <span className="flex-1">{l.name}</span>
                        {l.code === i18n.language && <span className="text-accent">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-500/10 transition-colors text-left text-red-400"
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  <span className="flex-1 font-medium text-sm">{tr("Log out")}</span>
                </button>
              </div>
            )}

            {/* Language switcher when logged out */}
            {!isAuthenticated && (
              <div className="rounded-xl border border-border/50 overflow-hidden bg-card/20">
                <button
                  onClick={() => setLangMenuOpen(v => !v)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-card transition-colors text-left"
                >
                  <Globe className="h-5 w-5 text-foreground/60 shrink-0" />
                  <span className="flex-1 font-medium text-sm">Language</span>
                  <span className="text-xs text-foreground/60 flex items-center gap-1">
                    {currentLang.flag} {currentLang.name}
                    <ChevronDown className={`h-4 w-4 transition-transform ${langMenuOpen ? "rotate-180" : ""}`} />
                  </span>
                </button>
                {langMenuOpen && (
                  <div className="bg-background/40 divide-y divide-border/20 border-t border-border/30">
                    {SUPPORTED_LANGUAGES.map(l => (
                      <button
                        key={l.code}
                        onClick={() => changeLang(l.code)}
                        className={`w-full flex items-center gap-3 px-6 py-3 text-sm text-left hover:bg-card/50 transition-colors ${
                          l.code === i18n.language ? "text-accent font-semibold" : ""
                        }`}
                      >
                        <span className="text-base">{l.flag}</span>
                        <span className="flex-1">{l.name}</span>
                        {l.code === i18n.language && <span className="text-accent">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

// ─── Subcomponents ─────────────────────────────────────────────────────────────

interface MobileMenuItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  description?: string;
  trailing?: React.ReactNode;
  variant?: "default" | "framed" | "highlighted" | "rrp";
}

function MobileMenuItem({ icon: Icon, label, onClick, description, trailing, variant = "default" }: MobileMenuItemProps) {
  const { tr } = useTr();
  const wrapperClass =
    variant === "framed" ? "rounded-xl border border-border/50 bg-card/20 hover:bg-card/50"
    : variant === "highlighted" ? "rounded-xl bg-gradient-to-br from-accent/15 to-purple-500/15 border border-accent/40 hover:border-accent/70"
    : variant === "rrp" ? "rounded-xl bg-gradient-to-br from-orange-500/15 to-red-500/10 border border-orange-500/40 hover:border-orange-500/70"
    : "hover:bg-card/50";

  const iconColor =
    variant === "highlighted" ? "text-accent"
    : variant === "rrp" ? "text-orange-400"
    : "text-foreground/70";

  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left ${wrapperClass}`}>
      <Icon className={`h-5 w-5 shrink-0 ${iconColor}`} />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{tr(label)}</div>
        {description && <div className="text-xs text-foreground/50 mt-0.5">{tr(description)}</div>}
      </div>
      {trailing ? <span className="text-foreground/40">{trailing}</span> : null}
    </button>
  );
}

function MobileSubItem({ label, onClick }: { label: string; onClick: () => void }) {
  const { tr } = useTr();
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-border/50 bg-card/20 hover:bg-card/50 transition-colors py-3 text-center text-sm font-medium"
    >
      {tr(label)}
    </button>
  );
}
