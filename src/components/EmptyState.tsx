import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { APP_NAME } from "../shared/labels";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionTo
}: EmptyStateProps) {
  return (
    <Card className="overflow-hidden bg-surface-container-lowest shadow-[var(--shadow-soft)]">
      <CardContent className="relative space-y-5 px-4 py-5 sm:space-y-6 sm:px-8 sm:py-7">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary-container text-primary shadow-[0_12px_28px_rgba(88,98,73,0.12)] sm:size-14">
          <Sparkles className="size-5 sm:size-6" />
        </div>
        <div className="space-y-2.5 sm:space-y-3">
          <p className="eyebrow">{APP_NAME}</p>
          <h2 className="text-[1.6rem] font-semibold tracking-[-0.04em] sm:text-[2.1rem]">{title}</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {actionLabel && actionTo ? (
          <Button asChild className="w-full sm:w-auto">
            <Link to={actionTo}>{actionLabel}</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
