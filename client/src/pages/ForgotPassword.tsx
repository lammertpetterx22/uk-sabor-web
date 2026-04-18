import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const SABOR_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663400274503/DGihaPaJvnMFHruoq9jmVQ/sabor-logo_7c905b38.png";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const requestMutation = trpc.adminAuth.requestPasswordReset.useMutation({
    onSuccess: () => setSent(true),
    onError: (err) => toast.error(err.message || "Something went wrong"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Enter your email");
      return;
    }
    requestMutation.mutate({ email });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={SABOR_LOGO} alt="UK Sabor logo" className="h-20 w-auto mx-auto mb-4" />
          <h1 className="text-3xl font-bold gradient-text">UK Sabor</h1>
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardHeader>
            <CardTitle className="gradient-text">Forgot Password?</CardTitle>
            <CardDescription>
              Enter your email and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4 text-center py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="font-semibold">Check your email</h3>
                <p className="text-sm text-foreground/60">
                  If an account exists for <strong>{email}</strong>, we've sent a password reset link.
                  The link expires in 1 hour.
                </p>
                <p className="text-xs text-foreground/50">
                  Don't see it? Check your spam folder.
                </p>
                <Link href="/login">
                  <Button variant="outline" className="w-full mt-4">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={requestMutation.isPending}
                      className="bg-card/50 border-border/50 pl-10"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={requestMutation.isPending || !email}
                  className="w-full btn-vibrant"
                >
                  {requestMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…</>
                  ) : (
                    "Send reset link"
                  )}
                </Button>

                <div className="text-center pt-4 border-t border-border/50">
                  <Link href="/login">
                    <Button type="button" variant="ghost" className="w-full text-sm">
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back to login
                    </Button>
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-foreground/50 mt-8">
          © 2026 UK Sabor. All rights reserved.
        </p>
      </div>
    </div>
  );
}
