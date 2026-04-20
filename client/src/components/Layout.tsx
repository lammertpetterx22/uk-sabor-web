import { useMemo, useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTranslation } from "react-i18next";
import CartButton from "@/components/cart/CartButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SUPPORTED_LANGUAGES } from "@/i18n/config";
import {
    Home,
    BookOpen,
    CalendarDays,
    User,
    LogOut,
    Menu,
    X,
    Users,
    Mail,
    QrCode,
    BarChart3,
    Banknote,
    Wallet,
    UserPlus,
    ChevronDown,
    ChevronRight,
    Compass,
    Ticket,
    LayoutDashboard,
    Radio,
    Shield,
    Globe,
    GraduationCap,
    Megaphone,
} from "lucide-react";

const SABOR_LOGO =
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663400274503/DGihaPaJvnMFHruoq9jmVQ/sabor-logo_7c905b38.png";

// ──────────────────────────────────────────────────────────────────────────────
// Tab Bar tabs (mobile bottom nav) — 4 primary destinations
// ──────────────────────────────────────────────────────────────────────────────
const BOTTOM_TABS = [
    { href: "/", label: "Home", icon: Home },
    { href: "/courses", label: "Courses", icon: BookOpen },
    { href: "/events", label: "Events", icon: CalendarDays },
    { href: "/profile", label: "Profile", icon: User },
];

// ──────────────────────────────────────────────────────────────────────────────
// Sidebar / drawer nav links
// ──────────────────────────────────────────────────────────────────────────────
const EXPLORE_NAV = [
    { href: "/", label: "Home", icon: Home },
    { href: "/events", label: "Events", icon: CalendarDays },
    { href: "/classes", label: "Classes", icon: GraduationCap },
    { href: "/courses", label: "Courses", icon: BookOpen },
    { href: "/instructors", label: "Instructors", icon: Users },
    { href: "/promoters", label: "Promoters", icon: Megaphone },
];

// Extract all role strings for a user (primary role + roles JSON array)
function collectRoles(user: { role?: string | null; roles?: string | null } | null | undefined): string[] {
    if (!user) return [];
    const primary = user.role || "user";
    let extra: string[] = [];
    try {
        const parsed = user.roles ? JSON.parse(user.roles) : [];
        if (Array.isArray(parsed)) extra = parsed as string[];
    } catch { /* ignore */ }
    return Array.from(new Set([primary, ...extra]));
}

export default function Layout({ children }: { children: React.ReactNode }) {
    // Always start closed - sidebar should only open when user clicks menu button
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [exploreOpen, setExploreOpen] = useState(true);
    const [langMenuOpen, setLangMenuOpen] = useState(false);

    const handleSetDrawerOpen = useCallback((open: boolean) => {
        setDrawerOpen(open);
        localStorage.setItem("sidebar-state", String(open));
    }, []);

    const handleCloseDrawer = useCallback(() => {
        handleSetDrawerOpen(false);
    }, [handleSetDrawerOpen]);

    const [location] = useLocation();
    const { user, isAuthenticated, loading, logout } = useAuth();
    const { i18n } = useTranslation();

    const allRoles = useMemo(() => collectRoles(user as any), [user]);
    const isAdmin = allRoles.includes("admin");
    const isCreator = allRoles.some(r => r === "admin" || r === "instructor" || r === "promoter");
    const isRrp = allRoles.includes("rrp");

    const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === i18n.language) ?? SUPPORTED_LANGUAGES[0];

    const handleLogout = useCallback(async () => {
        await logout();
        handleSetDrawerOpen(false);
        window.location.href = "/";
    }, [logout, handleSetDrawerOpen]);

    const NavLink = ({
        href,
        icon: Icon,
        label,
        onClick,
        indent = false,
    }: {
        href: string;
        icon: React.ElementType;
        label: string;
        onClick?: () => void;
        indent?: boolean;
    }) => {
        const active = location === href;
        return (
            <Link
                href={href}
                onClick={onClick}
                className={`flex items-center gap-3 ${indent ? "pl-8 pr-4" : "px-4"} py-2.5 rounded-xl font-medium transition-all duration-200 group ${active
                    ? "bg-[#FA3698]/15 text-[#FA3698] shadow-[inset_0_0_0_1px_rgba(250,54,152,0.3)]"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
            >
                <Icon
                    size={17}
                    className={active ? "text-[#FA3698]" : "group-hover:text-[#FA3698] transition-colors"}
                />
                <span className="text-sm">{label}</span>
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FA3698]" />}
            </Link>
        );
    };

    const RoleCTA = ({
        href, icon: Icon, label, description, onClick, tone,
    }: {
        href: string;
        icon: React.ElementType;
        label: string;
        description?: string;
        onClick?: () => void;
        tone: "pink" | "orange" | "red";
    }) => {
        const toneClass =
            tone === "pink"   ? "from-[#FA3698]/15 to-purple-500/10 border-[#FA3698]/40 hover:border-[#FA3698]/70 text-[#FA3698]"
            : tone === "orange" ? "from-orange-500/15 to-red-500/10 border-orange-500/40 hover:border-orange-500/70 text-orange-400"
            : "from-red-500/15 to-rose-500/10 border-red-500/40 hover:border-red-500/70 text-red-400";
        return (
            <Link
                href={href}
                onClick={onClick}
                className={`group block rounded-xl bg-gradient-to-br ${toneClass} border p-3.5 transition-all`}
            >
                <div className="flex items-center gap-3">
                    <Icon size={20} />
                    <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{label}</div>
                        {description && (
                            <div className="text-[11px] text-white/50 mt-0.5">{description}</div>
                        )}
                    </div>
                    <ChevronRight size={16} className="text-white/30 group-hover:text-white/60 transition-colors" />
                </div>
            </Link>
        );
    };

    // ──────────────────────────────────────────────────────────────────────────
    // Sidebar content shared between desktop sidebar and mobile drawer
    // ──────────────────────────────────────────────────────────────────────────
    const SidebarContent = useCallback(({ onClose }: { onClose?: () => void }) => (
        <div className="flex flex-col h-full">
            {/* Logo header */}
            <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
                <Link href="/" onClick={onClose} className="flex items-center gap-3">
                    <img src={SABOR_LOGO} alt="Con Sabor" className="h-9 w-auto" />
                    <div>
                        <p className="font-bold text-white text-base leading-tight gradient-text">CON SABOR</p>
                        <p className="text-white/40 text-[11px]">Dance Platform</p>
                    </div>
                </Link>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="ml-auto p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* User card (if logged in) */}
            {isAuthenticated && (
                <Link
                    href="/profile"
                    onClick={onClose}
                    className="mx-3 mt-3 rounded-xl bg-gradient-to-br from-[#FA3698]/10 to-purple-500/10 border border-[#FA3698]/30 p-3 hover:border-[#FA3698]/60 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#FA3698] to-purple-500 flex items-center justify-center shrink-0">
                            <span className="text-white text-base font-bold uppercase">
                                {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-white text-sm truncate">{user?.name || "User"}</div>
                            <div className="text-[11px] text-white/50 truncate">{user?.email}</div>
                            <div className="flex gap-1 flex-wrap mt-1">
                                {allRoles.map(r => {
                                    const color =
                                        r === "admin" ? "bg-red-500/15 text-red-400 border-red-500/30"
                                        : r === "instructor" ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                                        : r === "promoter" ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                                        : r === "rrp" ? "bg-orange-500/15 text-orange-300 border-orange-500/30"
                                        : "bg-white/10 text-white/60 border-white/20";
                                    return (
                                        <Badge key={r} variant="outline" className={`text-[9px] px-1.5 py-0 ${color}`}>{r}</Badge>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </Link>
            )}

            {/* Scrollable nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">

                {/* EXPLORE (collapsible) */}
                <button
                    onClick={() => setExploreOpen(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-2 text-[10px] uppercase tracking-widest text-white/40 font-semibold hover:text-white/70 transition-colors"
                >
                    <span className="flex items-center gap-2">
                        <Compass size={12} /> Explorar
                    </span>
                    <ChevronDown size={14} className={`transition-transform ${exploreOpen ? "rotate-180" : ""}`} />
                </button>
                {exploreOpen && (
                    <div className="flex flex-col gap-0.5 mb-2">
                        {EXPLORE_NAV.map(item => (
                            <NavLink key={item.href} {...item} onClick={onClose} />
                        ))}
                    </div>
                )}

                {/* My account */}
                {isAuthenticated && (
                    <>
                        <p className="px-4 pt-3 pb-2 text-[10px] uppercase tracking-widest text-white/40 font-semibold">
                            My Account
                        </p>
                        <NavLink href="/dashboard" icon={Ticket} label="My Tickets" onClick={onClose} />
                        {!isCreator && !isRrp && (
                            <NavLink
                                href="/become-instructor"
                                icon={UserPlus}
                                label="Become Instructor / Promoter"
                                onClick={onClose}
                            />
                        )}
                    </>
                )}

                {/* Creator / Admin primary CTA (Earnings/Attendance/Plans live INSIDE this panel) */}
                {isAuthenticated && isCreator && (
                    <div className="mt-4 px-1">
                        <RoleCTA
                            href="/admin"
                            icon={LayoutDashboard}
                            label={isAdmin ? "Admin Panel" : "My Studio"}
                            description={isAdmin ? "Full platform management" : "Manage your events, classes, earnings & attendance"}
                            onClick={onClose}
                            tone="pink"
                        />
                    </div>
                )}

                {/* RRP */}
                {isAuthenticated && isRrp && (
                    <div className="mt-4 px-1">
                        <RoleCTA
                            href="/rrp-dashboard"
                            icon={Radio}
                            label="RRP Hub"
                            description="Your code, sales and commissions"
                            onClick={onClose}
                            tone="orange"
                        />
                    </div>
                )}

                {/* Admin subsection */}
                {isAuthenticated && isAdmin && (
                    <div className="mt-4">
                        <p className="px-4 pb-2 text-[10px] uppercase tracking-widest text-white/40 font-semibold flex items-center gap-2">
                            <Shield size={12} /> Administration
                        </p>
                        <NavLink href="/crm" icon={Users} label="CRM" onClick={onClose} />
                        <NavLink href="/email-marketing" icon={Mail} label="Email Marketing" onClick={onClose} />
                        <NavLink href="/admin/withdrawals" icon={Banknote} label="Withdrawals" onClick={onClose} />
                    </div>
                )}

                {/* Legal */}
                <div className="mt-5">
                    <p className="px-4 pb-2 text-[10px] uppercase tracking-widest text-white/30 font-semibold">
                        Legal
                    </p>
                    <Link
                        href="/terms"
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-2 rounded-xl text-xs text-white/40 hover:text-white/70 transition-colors"
                    >
                        Terms of Service
                    </Link>
                    <Link
                        href="/privacy"
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-2 rounded-xl text-xs text-white/40 hover:text-white/70 transition-colors"
                    >
                        Privacy Policy
                    </Link>
                </div>
            </nav>

            {/* Footer: language + logout / login */}
            <div className="px-3 py-3 border-t border-white/5 space-y-2">
                {/* Language picker */}
                <div>
                    <button
                        onClick={() => setLangMenuOpen(v => !v)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-white/70 hover:text-white text-sm"
                    >
                        <Globe size={17} />
                        <span className="flex-1 text-left">Language</span>
                        <span className="text-xs text-white/60 flex items-center gap-1.5">
                            <span className="text-base leading-none">{currentLang.flag}</span>
                            <ChevronDown size={14} className={`transition-transform ${langMenuOpen ? "rotate-180" : ""}`} />
                        </span>
                    </button>
                    {langMenuOpen && (
                        <div className="mt-1 mx-1 rounded-xl border border-white/10 bg-black/50 overflow-hidden">
                            {SUPPORTED_LANGUAGES.map(l => {
                                const active = l.code === i18n.language;
                                return (
                                    <button
                                        key={l.code}
                                        onClick={() => {
                                            i18n.changeLanguage(l.code);
                                            setLangMenuOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                                            active ? "bg-[#FA3698]/15 text-[#FA3698]" : "text-white/70 hover:bg-white/5 hover:text-white"
                                        }`}
                                    >
                                        <span className="text-base">{l.flag}</span>
                                        <span className="flex-1">{l.name}</span>
                                        {active && <span className="text-xs">✓</span>}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Logout / Login */}
                {isAuthenticated ? (
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/50 hover:text-[#FD4D43] hover:bg-[#FD4D43]/10 transition-all text-sm font-medium"
                    >
                        <LogOut size={17} />
                        Log Out
                    </button>
                ) : (
                    <Link
                        href="/login"
                        onClick={onClose}
                        className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#FA3698] to-[#FD4D43] text-white font-bold text-sm hover:shadow-lg hover:shadow-[#FA3698]/30 transition-all"
                    >
                        Log In
                    </Link>
                )}
            </div>
        </div>
    ), [isAuthenticated, isCreator, isAdmin, isRrp, user, allRoles, exploreOpen, langMenuOpen, currentLang, i18n, handleLogout, location]);

    return (
        <div className="min-h-screen bg-black flex">
            {/* ── UNIFIED SIDEBAR: Slide-in drawer overlay for Desktop & Mobile ── */}
            {drawerOpen && (
                <div
                    className="fixed inset-0 z-50 flex"
                    onClick={() => handleSetDrawerOpen(false)}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />
                    {/* Drawer panel */}
                    <aside
                        className="relative w-64 xl:w-72 max-w-[85vw] h-full bg-[#0a0a0a] border-r border-white/10 animate-slide-in-left shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <SidebarContent onClose={handleCloseDrawer} />
                    </aside>
                </div>
            )}

            {/* ── MAIN CONTENT AREA ───────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col w-full min-w-0">
                {/* Global top bar */}
                <header className="sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-black/90 backdrop-blur-md border-b border-white/5">
                    <button
                        onClick={() => handleSetDrawerOpen(true)}
                        className="p-2 -ml-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all"
                        aria-label="Open menu"
                    >
                        <Menu size={20} />
                    </button>
                    <Link href="/" className="flex items-center gap-2">
                        <img src={SABOR_LOGO} alt="Con Sabor" className="h-8 w-auto" />
                        <span className="font-bold text-sm gradient-text">CON SABOR</span>
                    </Link>
                    {/* Right actions — cart, login/avatar */}
                    <div className="flex items-center gap-2">
                        <CartButton />
                        {loading ? (
                            <Skeleton className="w-8 h-8 rounded-full" />
                        ) : isAuthenticated ? (
                            <Link
                                href="/profile"
                                className="w-8 h-8 rounded-full bg-[#FA3698]/20 border border-[#FA3698]/40 flex items-center justify-center"
                            >
                                <span className="text-[#FA3698] text-xs font-bold uppercase">
                                    {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                                </span>
                            </Link>
                        ) : (
                            <Link
                                href="/login"
                                className="text-xs font-semibold text-[#FA3698] hover:text-[#FA3698]/80 transition-colors"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 pb-20 lg:pb-4">{children}</main>

                {/* Footer - Desktop only (mobile has bottom tab bar) */}
                <footer className="hidden lg:block border-t border-white/5 bg-black/50 backdrop-blur-sm py-6 px-4">
                    <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
                        <p className="text-white/40">
                            © {new Date().getFullYear()} UK Sabor. All rights reserved.
                        </p>
                        <nav className="flex items-center gap-6">
                            <Link
                                href="/terms"
                                className="text-white/50 hover:text-accent transition-colors font-medium"
                            >
                                Terms of Service
                            </Link>
                            <Link
                                href="/privacy"
                                className="text-white/50 hover:text-accent transition-colors font-medium"
                            >
                                Privacy Policy
                            </Link>
                            <a
                                href="mailto:support@uksabor.com"
                                className="text-white/50 hover:text-accent transition-colors font-medium"
                            >
                                Contact
                            </a>
                        </nav>
                    </div>
                </footer>
            </div>

            {/* ── MOBILE: Bottom Tab Bar ──────────────────────────────────────────── */}
            <nav
                className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch bg-black/95 backdrop-blur-xl border-t border-white/8"
                style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
                aria-label="Main navigation"
            >
                {BOTTOM_TABS.map(({ href, label, icon: Icon }) => {
                    const active = location === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 relative transition-all duration-200 ${active ? "text-[#FA3698]" : "text-white/40 hover:text-white/70"
                                }`}
                        >
                            {active && (
                                <span className="absolute top-0 inset-x-4 h-0.5 rounded-b-full bg-gradient-to-r from-[#FA3698] to-[#FD4D43]" />
                            )}
                            <Icon
                                size={active ? 22 : 20}
                                strokeWidth={active ? 2.5 : 1.8}
                                className="transition-all duration-200"
                            />
                            <span
                                className={`text-[10px] font-semibold tracking-wide transition-all ${active ? "opacity-100" : "opacity-60"
                                    }`}
                            >
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
