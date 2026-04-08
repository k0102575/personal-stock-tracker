import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex field-sizing-content min-h-24 w-full rounded-[1.5rem] bg-surface-container px-4 py-3 text-sm text-foreground transition-[color,box-shadow,background-color] outline-none placeholder:text-muted-foreground/80 focus-visible:bg-surface-container-lowest focus-visible:ring-4 focus-visible:ring-ring/80 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-32",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
