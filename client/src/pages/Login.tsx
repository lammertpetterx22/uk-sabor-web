import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const SABOR_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663400274503/DGihaPaJvnMFHruoq9jmVQ/sabor-logo_7c905b38.png";

export default function Login() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const utils = trpc.useUtils();

  // Parse redirect destination from query string
  const params = new URLSearchParams(search);
  const redirectTo = params.get("redirect") || "/";

  // If already logged in, redirect immediately
  useEffect(() => {
    if (isAuthenticated) {
      setLocation(redirectTo);
    }
  }, [isAuthenticated, redirectTo, setLocation]);

  const loginMutation = trpc.adminAuth.login.useMutation({
    onSuccess: async () => {
      toast.success("Welcome back!");
      await utils.auth.me.invalidate();
      setLocation(redirectTo);
    },
    onError: (error) => {
      toast.error(error.message || "Invalid email or password");
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const registerMutation = trpc.adminAuth.register.useMutation({
    onSuccess: async () => {
      toast.success("Account created successfully!");
      await utils.auth.me.invalidate();
      setLocation(redirectTo);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create account");
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    loginMutation.mutate({ email, password });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    registerMutation.mutate({ name, email, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={SABOR_LOGO} alt="UK Sabor logo" className="h-20 w-auto mx-auto mb-4" />
          <h1 className="text-3xl font-bold gradient-text">UK Sabor</h1>
          <p className="text-foreground/60 mt-2">Dance Events & Online Courses</p>
        </div>

        {/* Login/Register Card */}
        <Card className="border-border/50 shadow-xl">
          <CardHeader>
            <CardTitle className="gradient-text">
              {isRegister ? "Create Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription>
              {isRegister
                ? "Join UK Sabor and start dancing"
                : "Sign in to your account"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
              {/* Name Field (Register Only) */}
              {isRegister && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    className="bg-card/50 border-border/50"
                    autoComplete="name"
                  />
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="bg-card/50 border-border/50"
                  autoComplete={isRegister ? "email" : "username"}
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-card/50 border-border/50"
                  autoComplete={isRegister ? "new-password" : "current-password"}
                />
                {isRegister && (
                  <p className="text-xs text-foreground/50">
                    Minimum 6 characters
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full btn-vibrant mt-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isRegister ? "Creating account..." : "Signing in..."}
                  </>
                ) : isRegister ? (
                  "Create Account"
                ) : (
                  "Sign In"
                )}
              </Button>

              {/* Toggle Register/Login */}
              <div className="text-center pt-4 border-t border-border/50">
                <p className="text-sm text-foreground/60 mb-3">
                  {isRegister ? "Already have an account?" : "Don't have an account?"}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setEmail("");
                    setPassword("");
                    setName("");
                  }}
                  disabled={isLoading}
                >
                  {isRegister ? "Sign In" : "Create Account"}
                </Button>
              </div>
            </form>

            {/* Benefits */}
            {isRegister && (
              <div className="mt-6 p-4 bg-accent/10 rounded-lg border border-accent/20 space-y-2">
                <p className="text-xs font-semibold text-foreground/80 mb-2">By registering you can:</p>
                <div className="flex items-center gap-2 text-xs text-foreground/70">
                  <CheckCircle2 className="h-3 w-3 text-accent flex-shrink-0" />
                  <span>Buy tickets for events</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground/70">
                  <CheckCircle2 className="h-3 w-3 text-accent flex-shrink-0" />
                  <span>Access online dance courses</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground/70">
                  <CheckCircle2 className="h-3 w-3 text-accent flex-shrink-0" />
                  <span>Book in-person classes</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-foreground/50 mt-8">
          © 2026 UK Sabor. All rights reserved.
        </p>
      </div>
    </div>
  );
}
