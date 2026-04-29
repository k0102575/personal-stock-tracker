import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap shrink-0 [&>svg]:size-3.5 gap-1",
  {
    variants: {
      variant: {
        default:
          "border-foreground bg-foreground text-white",
        warning:
          "border-foreground bg-surface-container-high text-foreground",
        danger:
          "border-transparent bg-[color:color-mix(in_srgb,var(--error-container)_78%,white)] text-error-dim",
        neutral:
          "border-outline-variant bg-surface-container text-muted-foreground",
        outline:
          "border-outline-variant bg-transparent text-foreground"
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
