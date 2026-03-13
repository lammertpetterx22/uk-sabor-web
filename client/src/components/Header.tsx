import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTranslations } from "@/hooks/useTranslations";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const SABOR_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663400274503/DGihaPaJvnMFHruoq9jmVQ/sabor-logo_7c905b38.png";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useTranslations();

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-background via-background to-background border-b border-accent/20 backdrop-blur-md shadow-lg shadow-accent/10 animate-slide-down">
      <nav className="container flex items-center justify-between h-20" aria-label="Main navigation">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 hover-glow rounded-lg px-2 py-1 transition-smooth">
          <img src={SABOR_LOGO} alt="UK Sabor" className="h-12 w-auto animate-float" />
          <span className="hidden sm:inline text-xl font-bold gradient-text animate-gradient-shift">SABOR</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/events" className="text-foreground/70 hover:text-accent transition-smooth font-medium hover:underline underline-offset-4 decoration-accent/50 relative group">
            {t('nav.events')}
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-accent to-transparent group-hover:w-full transition-all duration-300" />
          </Link>
          <Link href="/courses" className="text-foreground/70 hover:text-accent transition-smooth font-medium hover:underline underline-offset-4 decoration-accent/50 relative group">
            {t('nav.courses')}
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-accent to-transparent group-hover:w-full transition-all duration-300" />
          </Link>
          <Link href="/classes" className="text-foreground/70 hover:text-accent transition-smooth font-medium hover:underline underline-offset-4 decoration-accent/50 relative group">
            {t('nav.classes')}
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-accent to-transparent group-hover:w-full transition-all duration-300" />
          </Link>
          <Link href="/instructors" className="text-foreground/70 hover:text-accent transition-smooth font-medium hover:underline underline-offset-4 decoration-accent/50 relative group">
            {t('nav.instructors')}
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-accent to-transparent group-hover:w-full transition-all duration-300" />
          </Link>
          <Link href="/promoters" className="text-foreground/70 hover:text-accent transition-smooth font-medium hover:underline underline-offset-4 decoration-accent/50 relative group">
            {t('nav.promoters')}
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-accent to-transparent group-hover:w-full transition-all duration-300" />
          </Link>
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <>
              <Link href="/dashboard" className="text-foreground/80 hover:text-accent transition-smooth font-medium text-sm hover-lift">
                {t('nav.dashboard')}
              </Link>
              <Link href="/profile" className="text-foreground/80 hover:text-accent transition-smooth font-medium text-sm hover-lift">
                {t('nav.profile')}
              </Link>
              {(user?.role === "admin" || user?.role === "instructor" || user?.role === "promoter") && (
                <Link href="/admin" className="text-accent font-bold hover:text-accent/80 transition-smooth hover-glow px-2 py-1 rounded-lg">
                  {user?.role === "admin" ? t('nav.admin') : t('nav.myPanel')}
                </Link>
              )}
              {user?.role === "admin" && (
                <Link href="/crm" className="text-accent font-bold hover:text-accent/80 transition-smooth hover-glow px-2 py-1 rounded-lg">
                  {t('nav.crm')}
                </Link>
              )}
              {user?.role === "admin" && (
                <Link href="/email-marketing" className="text-accent font-bold hover:text-accent/80 transition-smooth hover-glow px-2 py-1 rounded-lg">
                  {t('nav.email')}
                </Link>
              )}
              {(user?.role === "admin" || user?.role === "instructor" || user?.role === "promoter") && (
                <Link href="/pricing" className="text-accent font-bold hover:text-accent/80 transition-smooth hover-glow px-2 py-1 rounded-lg">
                  {t('nav.plans')}
                </Link>
              )}
              <Button onClick={handleLogout} variant="outline" size="sm" className="btn-modern hover-lift">
                {t('nav.signOut')}
              </Button>
            </>
          ) : (
            <Button asChild className="btn-vibrant btn-modern" size="sm">
              <a href="/login">{t('nav.login')}</a>
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 hover:bg-card rounded-lg transition-smooth hover-glow"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} className="animate-rotate" /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/50 bg-card/80 backdrop-blur-sm max-h-[calc(100vh-80px)] overflow-y-auto animate-slide-down">
          <div className="container py-3 flex flex-col gap-2">
            <Link href="/events" className="text-foreground/80 hover:text-accent transition-smooth font-medium py-1.5 text-sm hover-lift px-2 rounded-lg">
              {t('nav.events')}
            </Link>
            <Link href="/courses" className="text-foreground/80 hover:text-accent transition-smooth font-medium py-1.5 text-sm hover-lift px-2 rounded-lg">
              {t('nav.courses')}
            </Link>
            <Link href="/classes" className="text-foreground/80 hover:text-accent transition-smooth font-medium py-1.5 text-sm hover-lift px-2 rounded-lg">
              {t('nav.classes')}
            </Link>
            <Link href="/instructors" className="text-foreground/80 hover:text-accent transition-smooth font-medium py-1.5 text-sm hover-lift px-2 rounded-lg">
              {t('nav.instructors')}
            </Link>
            <Link href="/promoters" className="text-foreground/80 hover:text-accent transition-smooth font-medium py-1.5 text-sm hover-lift px-2 rounded-lg">
              {t('nav.promoters')}
            </Link>

            {/* Language Switcher in Mobile */}
            <div className="py-2">
              <LanguageSwitcher />
            </div>

            <div className="border-t border-border/50 pt-2 mt-2 flex flex-col gap-1.5">
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" className="text-foreground/80 hover:text-accent transition-smooth font-medium py-1.5 text-sm hover-lift px-2 rounded-lg">
                    {t('nav.dashboard')}
                  </Link>
                  <Link href="/profile" className="text-foreground/80 hover:text-accent transition-smooth font-medium py-1.5 text-sm hover-lift px-2 rounded-lg">
                    {t('nav.profile')}
                  </Link>
                  {(user?.role === "admin" || user?.role === "instructor" || user?.role === "promoter") && (
                    <Link href="/admin" className="text-accent font-bold hover:text-accent/80 transition-smooth py-1.5 text-sm hover-glow px-2 rounded-lg">
                      {user?.role === "admin" ? t('nav.admin') : t('nav.myPanel')}
                    </Link>
                  )}
                  {user?.role === "admin" && (
                    <Link href="/crm" className="text-accent font-bold hover:text-accent/80 transition-smooth py-1.5 text-sm hover-glow px-2 rounded-lg">
                      {t('nav.crm')}
                    </Link>
                  )}
                  {user?.role === "admin" && (
                    <Link href="/email-marketing" className="text-accent font-bold hover:text-accent/80 transition-smooth py-1.5 text-sm hover-glow px-2 rounded-lg">
                      {t('nav.email')}
                    </Link>
                  )}
                  {(user?.role === "admin" || user?.role === "instructor" || user?.role === "promoter") && (
                    <Link href="/pricing" className="text-accent font-bold hover:text-accent/80 transition-smooth py-1.5 text-sm hover-glow px-2 rounded-lg">
                      {t('nav.plans')}
                    </Link>
                  )}
                  <Button onClick={handleLogout} variant="outline" className="w-full mt-2 h-9 text-sm btn-modern hover-lift">
                    {t('nav.signOut')}
                  </Button>
                </>
              ) : (
                <Button asChild className="btn-vibrant btn-modern w-full">
                  <a href="/login">{t('nav.login')}</a>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
