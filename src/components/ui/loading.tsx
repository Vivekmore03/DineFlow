import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Pulse Skeleton component for layout load placeholders
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/60 dark:bg-muted/40", className)}
      {...props}
    />
  );
}

/**
 * Standard Loading Spinner
 */
function Spinner({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("animate-spin text-primary", className)}
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

/**
 * Full page level overlay loader
 */
function PageLoader({ message = "Loading dashboard..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-3">
        <Spinner className="h-8 w-8 text-primary" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">{message}</p>
      </div>
    </div>
  );
}

export { Skeleton, Spinner, PageLoader };
