import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { AlertTriangle, Home } from "lucide-react";
import { Component, ReactNode } from "react";
import { Link } from "wouter";

interface Props {
  children: ReactNode;
  routeName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Per-route error boundary component
 * Prevents a single component error from crashing the entire application
 */
class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging and monitoring
    const routeName = this.props.routeName ? ` - ${this.props.routeName}` : "";
    logger.error(`RouteErrorBoundary${routeName}`, error, { errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[60vh] p-8">
          <div className="flex flex-col items-center w-full max-w-lg p-6 glass rounded-xl border border-destructive/20">
            <AlertTriangle
              size={40}
              className="text-destructive mb-4 flex-shrink-0"
            />

            <h2 className="text-lg font-semibold mb-2">
              {this.props.routeName
                ? `Error loading ${this.props.routeName}`
                : "Something went wrong"}
            </h2>

            <p className="text-sm text-foreground/70 mb-6 text-center">
              We encountered an error while loading this page. The rest of the
              application should still work normally.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm",
                  "bg-primary text-primary-foreground",
                  "hover:opacity-90 cursor-pointer transition-opacity"
                )}
              >
                Try Again
              </button>

              <Link href="/">
                <button
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm",
                    "bg-secondary text-secondary-foreground",
                    "hover:opacity-90 cursor-pointer transition-opacity"
                  )}
                >
                  <Home size={16} />
                  Go Home
                </button>
              </Link>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-6 w-full">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  Error details (dev only)
                </summary>
                <div className="mt-2 p-3 rounded bg-muted overflow-auto max-h-48">
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
                    {this.state.error.stack}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RouteErrorBoundary;
