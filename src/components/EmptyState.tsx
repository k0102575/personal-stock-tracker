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
    <Card className="overflow-hidden bg-surface-container-low">
      <CardContent className="space-y-5">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary-container text-primary">
          <Sparkles className="size-6" />
        </div>
        <div className="space-y-3">
          <p className="eyebrow">{APP_NAME}</p>
          <h2 className="text-3xl font-semibold tracking-[-0.04em]">{title}</h2>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{description}</p>
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
