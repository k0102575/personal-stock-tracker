import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full min-w-0 rounded-3xl bg-surface-container px-4 py-3 text-base text-foreground transition-[color,box-shadow,background-color] outline-none placeholder:text-muted-foreground/80 focus-visible:bg-surface-container-lowest focus-visible:ring-4 focus-visible:ring-ring/80 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
