import * as React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionLoading?: boolean;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon: Icon, title, description, actionText, onAction, actionLoading = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center text-center p-8 rounded-lg border border-dashed border-border bg-card/20 min-h-[320px] max-w-lg mx-auto",
          className
        )}
        {...props}
      />
    );
  }
);
EmptyState.displayName = "EmptyState";

// Complete component export
export function EmptyStateComponent({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  actionLoading = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-12 rounded-xl border border-dashed border-border/80 bg-card/10 backdrop-blur-xs select-none animate-in fade-in-40 slide-in-from-bottom-2 duration-300",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary border border-border/60 mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <Button variant="secondary" onClick={onAction} isLoading={actionLoading}>
          {actionText}
        </Button>
      )}
    </div>
  );
}

export { EmptyState };
