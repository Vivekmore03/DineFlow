import * as React from "react";
import { Label } from "./label";
import { cn } from "@/lib/utils";

interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

const FormGroup = React.forwardRef<HTMLDivElement, FormGroupProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 w-full", className)}
        {...props}
      />
    );
  }
);
FormGroup.displayName = "FormGroup";

interface FormFeedbackProps extends React.HTMLAttributes<HTMLParagraphElement> {
  type?: "error" | "success";
}

const FormFeedback = React.forwardRef<HTMLParagraphElement, FormFeedbackProps>(
  ({ className, type = "error", ...props }, ref) => {
    if (!props.children) return null;
    return (
      <p
        ref={ref}
        className={cn(
          "text-xs font-medium transition-all duration-150 animate-in fade-in-50",
          type === "error" ? "text-destructive" : "text-emerald-500",
          className
        )}
        {...props}
      />
    );
  }
);
FormFeedback.displayName = "FormFeedback";

interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const FormDescription = React.forwardRef<HTMLParagraphElement, FormDescriptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn("text-xs text-muted-foreground leading-normal", className)}
        {...props}
      />
    );
  }
);
FormDescription.displayName = "FormDescription";

export { FormGroup, FormFeedback, FormDescription };
