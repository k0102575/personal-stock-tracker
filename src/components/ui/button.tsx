import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[13px] font-medium transition-[color,box-shadow,transform,background-color,border-color] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] sm:text-sm",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-dim",
        secondary:
          "border border-outline-variant bg-white text-foreground hover:bg-surface-container-high",
        destructive: "bg-error text-white hover:bg-error-dim",
        outline:
          "border border-outline-variant bg-transparent text-foreground hover:border-outline hover:bg-surface-container",
        ghost: "bg-transparent text-foreground hover:bg-surface-container",
        link: "bg-transparent px-0 text-foreground underline-offset-4 hover:underline"
      },
      size: {
        default: "h-10 px-5 has-[>svg]:px-4 sm:h-11 sm:px-6 sm:has-[>svg]:px-5",
        sm: "h-9 rounded-full px-4 text-xs has-[>svg]:px-3.5",
        lg: "h-12 rounded-full px-6 has-[>svg]:px-5 sm:h-12 sm:px-7 sm:has-[>svg]:px-6",
        icon: "size-10 sm:size-11"
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
