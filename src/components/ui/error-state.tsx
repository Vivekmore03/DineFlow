"use client";

import * as React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  error?: Error;
  reset?: () => void;
}

export function ErrorCard({
  title = "Something went wrong",
  description = "An unexpected error occurred while loading this section.",
  error,
  reset,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 rounded-xl border border-destructive/20 bg-destructive/5 text-center max-w-md mx-auto select-none animate-in fade-in-40 slide-in-from-bottom-2 duration-300",
        className
      )}
      {...props}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20 mb-4">
        <AlertCircle className="h-5 w-5 text-destructive" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
        {error?.message || description}
      </p>
      {reset && (
        <Button variant="secondary" onClick={reset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Try again
        </Button>
      )}
    </div>
  );
}

/**
 * Basic React Error Boundary fallback screen
 */
export class ReactErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-[400px] items-center justify-center p-4">
          <ErrorCard
            title="Application Error"
            description="A critical error occurred. Please try reloading the page."
            error={this.state.error || undefined}
            reset={() => this.setState({ hasError: false, error: null })}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
