import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

type ProtectedRouteProps = {
    children: React.ReactNode;
    /** If provided, only these roles can access the route. Any authenticated user if omitted. */
    allowedRoles?: string[];
};

/**
 * Wrap any route to enforce authentication (and optional role) at the router level.
 * - While loading: shows a full-screen spinner
 * - Unauthenticated: redirects to /login?redirect=<current-path>
 * - Wrong role: redirects to / (home)
 */
export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, isAuthenticated, loading } = useAuth();
    const [location, setLocation] = useLocation();

    useEffect(() => {
        if (loading) return;

        if (!isAuthenticated) {
            // Pass current path so login page can redirect back after auth
            const redirectParam = location !== "/login" ? `?redirect=${encodeURIComponent(location)}` : "";
            setLocation(`/login${redirectParam}`);
            return;
        }

        if (allowedRoles && user && !allowedRoles.includes(user.role)) {
            setLocation("/");
        }
    }, [loading, isAuthenticated, user, allowedRoles, location, setLocation]);

    // Show spinner while auth is resolving
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-accent" />
                    <p className="text-foreground/50 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    // Not yet redirected (useEffect fires async) — render nothing to avoid flash
    if (!isAuthenticated) return null;
    if (allowedRoles && user && !allowedRoles.includes(user.role)) return null;

    return <>{children}</>;
}
