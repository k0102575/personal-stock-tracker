import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.06em] whitespace-nowrap shrink-0 [&>svg]:size-3.5 gap-1",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary-container text-primary",
        warning:
          "border-transparent bg-tertiary-container text-tertiary",
        danger:
          "border-transparent bg-[color:color-mix(in_srgb,var(--error-container)_28%,white)] text-error-dim",
        neutral:
          "border-transparent bg-surface-container-high text-muted-foreground",
        outline:
          "border-[color:color-mix(in_srgb,var(--outline-variant)_28%,transparent)] bg-transparent text-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
