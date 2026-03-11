import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Music } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="container flex flex-col items-center justify-center min-h-[80vh] text-center py-16 pt-28">
        {/* Animated icon */}
        <div className="relative mb-8">
          <div className="w-32 h-32 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
            <Music className="h-16 w-16 text-accent/50 animate-bounce" />
          </div>
          <div className="absolute -top-2 -right-2 bg-accent text-white text-xs font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-lg">
            404
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold gradient-text mb-4">Oops!</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Page Not Found</h2>
        <p className="text-foreground/60 max-w-md mb-10 leading-relaxed">
          Looks like this page has danced off somewhere. The page you're looking for doesn't exist or may have been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => setLocation(-1 as any)}
            variant="outline"
            className="border-accent/50 text-accent hover:bg-accent/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <Link href="/">
            <Button className="btn-vibrant px-8">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Quick links */}
        <div className="mt-12 flex flex-wrap gap-4 justify-center">
          <Link href="/events">
            <Button variant="ghost" size="sm" className="text-foreground/60 hover:text-accent">Events</Button>
          </Link>
          <Link href="/courses">
            <Button variant="ghost" size="sm" className="text-foreground/60 hover:text-accent">Courses</Button>
          </Link>
          <Link href="/classes">
            <Button variant="ghost" size="sm" className="text-foreground/60 hover:text-accent">Classes</Button>
          </Link>
          <Link href="/instructors">
            <Button variant="ghost" size="sm" className="text-foreground/60 hover:text-accent">Instructors</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
