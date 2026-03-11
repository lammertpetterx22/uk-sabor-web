import { useEffect, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2, PartyPopper, Ticket, BookOpen, Users } from "lucide-react";

export default function PaymentSuccess() {
  const { isAuthenticated } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSessionId(params.get("session_id"));
  }, []);

  const { data: verification, isLoading } = trpc.payments.verifySession.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId && isAuthenticated }
  );

  const getIcon = () => {
    if (!verification) return <PartyPopper className="h-16 w-16 text-accent" />;
    switch (verification.itemType) {
      case "event": return <Ticket className="h-16 w-16 text-accent" />;
      case "course": return <BookOpen className="h-16 w-16 text-accent" />;
      case "class": return <Users className="h-16 w-16 text-accent" />;
      default: return <PartyPopper className="h-16 w-16 text-accent" />;
    }
  };

  const getTitle = () => {
    if (!verification) return "Payment Complete!";
    switch (verification.itemType) {
      case "event": return "Ticket Purchased!";
      case "course": return "Course Unlocked!";
      case "class": return "Enrolment Confirmed!";
      default: return "Payment Complete!";
    }
  };

  const getMessage = () => {
    if (!verification) return "Your purchase has been processed successfully.";
    switch (verification.itemType) {
      case "event": return "Your ticket has been generated. Check your dashboard and email for your access code and QR code.";
      case "course": return "You now have access to the course. You can start watching the content right away.";
      case "class": return "Your spot has been reserved. Check your dashboard for full details and your QR code.";
      default: return "Your purchase has been processed successfully.";
    }
  };

  return (
    <div className="min-h-screen bg-background">

      <div className="container py-16 pt-28 max-w-lg mx-auto">
        <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 to-accent/5">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            {isLoading ? (
              <Loader2 className="h-16 w-16 animate-spin text-accent mx-auto" />
            ) : (
              <>
                <div className="mx-auto w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
                  {verification?.success ? (
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                  ) : (
                    getIcon()
                  )}
                </div>

                <div>
                  <h1 className="text-3xl font-bold mb-2">{getTitle()}</h1>
                  <p className="text-foreground/70">{getMessage()}</p>
                </div>

                {verification?.success && (
                  <div className="bg-background/50 rounded-lg p-4">
                    <p className="text-sm text-foreground/60">Total paid</p>
                    <p className="text-2xl font-bold text-accent">
                      £{verification.amount?.toFixed(2)} {verification.currency}
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-4">
                  <Link href="/dashboard">
                    <Button className="w-full btn-vibrant">
                      View my Dashboard
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button variant="outline" className="w-full">
                      Back to Home
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
