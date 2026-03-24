import { Link } from "react-router-dom";

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
    <div className="empty-state panel">
      <p className="eyebrow">Nothing here yet</p>
      <h2>{title}</h2>
      <p className="muted-text">{description}</p>
      {actionLabel && actionTo ? (
        <Link className="button button--primary" to={actionTo}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
