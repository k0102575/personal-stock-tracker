import { cn } from "@/lib/utils";

interface StockMeterProps {
  activeCount: number;
  total?: number;
  tone?: "primary" | "warning" | "danger";
  className?: string;
}

const toneClassName: Record<NonNullable<StockMeterProps["tone"]>, string> = {
  primary: "bg-primary",
  warning: "bg-tertiary",
  danger: "bg-error"
};

export function StockMeter({
  activeCount,
  total = 6,
  tone = "primary",
  className
}: StockMeterProps) {
  return (
    <div className={cn("flex items-end gap-1", className)} aria-hidden="true">
      {Array.from({ length: total }, (_, index) => {
        const active = index < activeCount;
        return (
          <span
            key={index}
            className={cn(
              "block h-5 w-[5px] rounded-full transition-colors",
              active ? toneClassName[tone] : "bg-outline-variant/30"
            )}
          />
        );
      })}
    </div>
  );
}
