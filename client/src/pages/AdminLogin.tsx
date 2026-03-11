import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

const SABOR_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663400274503/DGihaPaJvnMFHruoq9jmVQ/sabor-logo_7c905b38.png";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  const loginMutation = trpc.adminAuth.login.useMutation({
    onSuccess: (data: any) => {
      if (data.success) {
        // Store the session and redirect to admin dashboard
        localStorage.setItem("adminSession", JSON.stringify(data));
        setLocation("/admin");
      }
    },
    onError: (err: any) => {
      setError(err.message || "Login failed. Please check your credentials.");
      setLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    loginMutation.mutate({ email, password } as any);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#E91E8C]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-[#FF4500]/10 rounded-full blur-3xl"></div>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md bg-card/95 border-border/50 backdrop-blur-sm relative z-10">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center mb-4">
            <img src={SABOR_LOGO} alt="UK Sabor" className="h-16 w-auto" />
          </div>
          <CardTitle className="text-3xl">Admin Login</CardTitle>
          <CardDescription>Access the UK Sabor administration panel</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="petterlammert@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="bg-background border-border/50 h-10"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="bg-background border-border/50 h-10"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3 flex gap-2 items-start">
                <AlertCircle size={18} className="text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <Button
              type="submit"
              disabled={loading}
              className="btn-vibrant w-full h-10 mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login to Admin Panel"
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-border/50 text-center text-xs text-foreground/60">
            <p>UK Sabor Admin Dashboard</p>
            <p className="mt-1">For authorized administrators only</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
