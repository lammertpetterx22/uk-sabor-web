import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import {
    Home,
    BookOpen,
    CalendarDays,
    User,
    LayoutDashboard,
    Settings,
    LogOut,
    Menu,
    X,
    Users,
    Mail,
    CreditCard,
    QrCode,
    BarChart3,
    Banknote,
    Wallet,
} from "lucide-react";

const SABOR_LOGO =
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663400274503/DGihaPaJvnMFHruoq9jmVQ/sabor-logo_7c905b38.png";

// ──────────────────────────────────────────────────────────────────────────────
// Tab Bar tabs (mobile bottom nav) — 4 primary destinations
// ──────────────────────────────────────────────────────────────────────────────
const BOTTOM_TABS = [
    { href: "/", label: "Home", icon: Home },
    { href: "/courses", label: "Cursos", icon: BookOpen },
    { href: "/events", label: "Eventos", icon: CalendarDays },
    { href: "/profile", label: "Perfil", icon: User },
];

// ──────────────────────────────────────────────────────────────────────────────
// Sidebar / drawer nav links
// ──────────────────────────────────────────────────────────────────────────────
const PUBLIC_NAV = [
    { href: "/", label: "Home", icon: Home },
    { href: "/courses", label: "Cursos", icon: BookOpen },
    { href: "/events", label: "Eventos", icon: CalendarDays },
    { href: "/classes", label: "Clases", icon: CalendarDays },
];

export default function Layout({ children }: { children: React.ReactNode }) {
    const [drawerOpen, setDrawerOpen] = useState(() => {
        const saved = localStorage.getItem("sidebar-state");
        return saved ? saved === "true" : false;
    });

    const handleSetDrawerOpen = (open: boolean) => {
        setDrawerOpen(open);
        localStorage.setItem("sidebar-state", String(open));
    };

    const [location] = useLocation();
    const { user, isAuthenticated, logout } = useAuth();

    const isAdmin = user?.role === "admin";
    const isCreator =
        user?.role === "admin" ||
        user?.role === "instructor" ||
        user?.role === "promoter";

    const handleLogout = async () => {
        await logout();
        handleSetDrawerOpen(false);
        window.location.href = "/";
    };

    const NavLink = ({
        href,
        icon: Icon,
        label,
        onClick,
    }: {
        href: string;
        icon: React.ElementType;
        label: string;
        onClick?: () => void;
    }) => {
        const active = location === href;
        return (
            <Link
                href={href}
                onClick={onClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${active
                        ? "bg-[#FA3698]/15 text-[#FA3698] shadow-[inset_0_0_0_1px_rgba(250,54,152,0.3)]"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
            >
                <Icon
                    size={18}
                    className={active ? "text-[#FA3698]" : "group-hover:text-[#FA3698] transition-colors"}
                />
                <span className="text-sm">{label}</span>
                {active && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FA3698]" />
                )}
            </Link>
        );
    };

    // ──────────────────────────────────────────────────────────────────────────
    // Sidebar content shared between desktop sidebar and mobile drawer
    // ──────────────────────────────────────────────────────────────────────────
    const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 py-6 border-b border-white/5">
                <Link href="/" onClick={onClose} className="flex items-center gap-3">
                    <img src={SABOR_LOGO} alt="Con Sabor" className="h-10 w-auto" />
                    <div>
                        <p className="font-bold text-white text-base leading-tight gradient-text">
                            CON SABOR
                        </p>
                        <p className="text-white/40 text-xs">Dance Platform</p>
                    </div>
                </Link>
                {/* Close button (mobile only) */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="ml-auto p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
                {/* Public */}
                <p className="px-4 py-2 text-[10px] uppercase tracking-widest text-white/25 font-semibold">
                    Explorar
                </p>
                {PUBLIC_NAV.map((item) => (
                    <NavLink key={item.href} {...item} onClick={onClose} />
                ))}

                {/* Authenticated */}
                {isAuthenticated && (
                    <>
                        <p className="px-4 pt-4 pb-2 text-[10px] uppercase tracking-widest text-white/25 font-semibold">
                            Mi cuenta
                        </p>
                        <NavLink
                            href="/dashboard"
                            icon={LayoutDashboard}
                            label="Dashboard"
                            onClick={onClose}
                        />
                        <NavLink
                            href="/profile"
                            icon={User}
                            label="Mi Perfil"
                            onClick={onClose}
                        />
                    </>
                )}

                {/* Creator / Admin */}
                {isCreator && (
                    <>
                        <p className="px-4 pt-4 pb-2 text-[10px] uppercase tracking-widest text-white/25 font-semibold">
                            Panel de control
                        </p>
                        <NavLink
                            href="/admin"
                            icon={Settings}
                            label={isAdmin ? "Admin" : "Mi Panel"}
                            onClick={onClose}
                        />
                        <NavLink
                            href="/attendance"
                            icon={QrCode}
                            label="Asistencia"
                            onClick={onClose}
                        />
                        <NavLink
                            href="/earnings"
                            icon={Wallet}
                            label="Ganancias"
                            onClick={onClose}
                        />
                        {isCreator && (
                            <NavLink
                                href="/pricing"
                                icon={BarChart3}
                                label="Planes"
                                onClick={onClose}
                            />
                        )}
                    </>
                )}

                {/* Admin-only */}
                {isAdmin && (
                    <>
                        <p className="px-4 pt-4 pb-2 text-[10px] uppercase tracking-widest text-white/25 font-semibold">
                            Administración
                        </p>
                        <NavLink href="/crm" icon={Users} label="CRM" onClick={onClose} />
                        <NavLink
                            href="/admin/withdrawals"
                            icon={Banknote}
                            label="Retiros"
                            onClick={onClose}
                        />
                        <NavLink
                            href="/email-marketing"
                            icon={Mail}
                            label="Email Marketing"
                            onClick={onClose}
                        />
                    </>
                )}
            </nav>

            {/* Footer */}
            <div className="px-3 py-4 border-t border-white/5">
                {isAuthenticated ? (
                    <div className="flex flex-col gap-2">
                        <div className="px-4 py-2 rounded-xl bg-white/5 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#FA3698]/20 border border-[#FA3698]/30 flex items-center justify-center">
                                <span className="text-[#FA3698] text-xs font-bold uppercase">
                                    {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-xs font-medium truncate">
                                    {user?.name || "Usuario"}
                                </p>
                                <p className="text-white/40 text-[11px] truncate">{user?.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/50 hover:text-[#FD4D43] hover:bg-[#FD4D43]/10 transition-all text-sm font-medium"
                        >
                            <LogOut size={16} />
                            Cerrar sesión
                        </button>
                    </div>
                ) : (
                    <Link
                        href="/login"
                        onClick={onClose}
                        className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#FA3698] to-[#FD4D43] text-white font-bold text-sm hover:shadow-lg hover:shadow-[#FA3698]/30 transition-all"
                    >
                        Iniciar sesión
                    </Link>
                )}
            </div>
        </div>
    );

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
                        <SidebarContent onClose={() => handleSetDrawerOpen(false)} />
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
                        aria-label="Abrir menú"
                    >
                        <Menu size={20} />
                    </button>
                    <Link href="/" className="flex items-center gap-2">
                        <img src={SABOR_LOGO} alt="Con Sabor" className="h-8 w-auto" />
                        <span className="font-bold text-sm gradient-text">CON SABOR</span>
                    </Link>
                    {/* Right action — login/avatar */}
                    {isAuthenticated ? (
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
                </header>

                {/* Page content */}
                <main className="flex-1 pb-20 lg:pb-0">{children}</main>
            </div>

            {/* ── MOBILE: Bottom Tab Bar ──────────────────────────────────────────── */}
            <nav
                className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch bg-black/95 backdrop-blur-xl border-t border-white/8"
                style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
                aria-label="Navegación principal"
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
