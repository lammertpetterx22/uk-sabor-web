import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "card" | "text" | "circle" | "rectangle";
}

export function Skeleton({ className, variant = "rectangle", ...props }: SkeletonProps) {
  const variants = {
    card: "h-64 rounded-lg",
    text: "h-4 rounded",
    circle: "h-12 w-12 rounded-full",
    rectangle: "h-12 rounded",
  };

  return (
    <div
      className={cn(
        "animate-pulse bg-gradient-to-r from-background via-card to-background",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="space-y-4 rounded-lg border border-border/50 p-4">
      <Skeleton variant="rectangle" className="h-48 w-full" />
      <div className="space-y-2">
        <Skeleton variant="text" className="h-6 w-3/4" />
        <Skeleton variant="text" className="h-4 w-full" />
        <Skeleton variant="text" className="h-4 w-2/3" />
      </div>
      <Skeleton variant="rectangle" className="h-10 w-full" />
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
