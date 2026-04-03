import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-[color,box-shadow,transform,background-color,border-color] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-4 focus-visible:ring-ring/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[linear-gradient(145deg,var(--primary),var(--primary-dim))] text-primary-foreground shadow-[var(--shadow-ambient)] hover:brightness-[1.03]",
        secondary:
          "bg-surface-container-lowest text-foreground shadow-[0_8px_22px_rgba(47,52,48,0.04)] hover:bg-surface-container",
        destructive: "bg-error text-white shadow-[var(--shadow-ambient)] hover:bg-error-dim",
        outline:
          "border border-[color:color-mix(in_srgb,var(--outline-variant)_24%,transparent)] bg-transparent text-foreground hover:bg-surface-container-low",
        ghost: "bg-transparent text-primary hover:bg-primary/8",
        link: "bg-transparent px-0 text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-11 px-5 has-[>svg]:px-4",
        sm: "h-9 rounded-full px-4 text-xs has-[>svg]:px-3.5",
        lg: "h-12 rounded-full px-6 has-[>svg]:px-5",
        icon: "size-11"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
