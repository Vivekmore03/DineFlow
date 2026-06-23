import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none cursor-pointer duration-150",
  {
    variants: {
      variant: {
        primary:
          "bg-linear-to-b from-primary to-[hsl(var(--primary)/0.9)] text-primary-foreground shadow-[0_2px_4px_rgba(99,91,255,0.2),inset_0_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0_4px_12px_rgba(99,91,255,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:brightness-105 active:brightness-95",
        secondary:
          "bg-secondary text-secondary-foreground border border-border/80 shadow-xs hover:bg-muted/80 hover:border-border active:bg-muted",
        outline:
          "border border-border bg-transparent shadow-xs hover:bg-secondary hover:text-secondary-foreground hover:border-border/80 active:bg-secondary/60",
        ghost: "hover:bg-secondary hover:text-secondary-foreground active:bg-secondary/60",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:brightness-110 active:brightness-90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {size !== "icon" && (children || "Loading...")}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
