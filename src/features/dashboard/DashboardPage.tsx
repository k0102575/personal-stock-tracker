import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { EmptyState } from "../../components/EmptyState";
import { api, getErrorMessage } from "../../lib/api";
import { formatDate, getInventorySignals } from "../../lib/inventory";

export function DashboardPage() {
  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: api.getDashboardSummary
  });

  if (summaryQuery.isPending) {
    return <div className="panel">Loading dashboard...</div>;
  }

  if (summaryQuery.isError) {
    return (
      <div className="panel inline-alert" role="alert">
        {getErrorMessage(summaryQuery.error)}
      </div>
    );
  }

  const summary = summaryQuery.data;

  if (summary.totalItems === 0) {
    return (
      <EmptyState
        title="Start your personal care inventory"
        description="Add your first product so you can check stock, expiry, and restock needs before shopping."
        actionLabel="Add first item"
        actionTo="/items/new"
      />
    );
  }

  return (
    <div className="stack-lg">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Daily snapshot</p>
          <h2>{summary.totalItems} products in rotation</h2>
          <p className="muted-text">
            Keep a fast view of what needs attention before your next store or pharmacy run.
          </p>
        </div>
        <div className="hero-actions">
          <Link className="button button--primary" to="/inventory">
            Open inventory
          </Link>
          <Link className="button button--secondary" to="/items/new">
            Quick add
          </Link>
        </div>
      </section>

      <section className="summary-grid">
        <article className="stat-card">
          <span className="stat-card__label">Low stock</span>
          <strong>{summary.lowStockCount}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">Expiring soon</span>
          <strong>{summary.expiringSoonCount}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">Expired</span>
          <strong>{summary.expiredCount}</strong>
        </article>
      </section>

      <section className="panel stack-md">
        <div className="section-heading">
          <h2>Category spread</h2>
          <Link className="text-link" to="/inventory">
            View all
          </Link>
        </div>
        <div className="chip-row">
          {summary.categories.map((entry) => (
            <span className="chip" key={entry.category}>
              {entry.category} / {entry.count}
            </span>
          ))}
        </div>
      </section>

      <section className="panel stack-md">
        <div className="section-heading">
          <h2>Recently updated</h2>
          <Link className="text-link" to="/inventory">
            Manage items
          </Link>
        </div>
        <div className="stack-sm">
          {summary.recentItems.map((item) => {
            const signals = getInventorySignals(item);
            return (
              <Link className="recent-row" key={item.id} to={`/items/${item.id}`}>
                <div>
                  <strong>{item.name}</strong>
                  <p className="muted-text">
                    {item.brand || item.category} / Updated {formatDate(item.updatedAt)}
                  </p>
                </div>
                <div className="badge-row">
                  {signals.lowStock && <span className="badge badge--warning">Low stock</span>}
                  {signals.expired && <span className="badge badge--danger">Expired</span>}
                  {!signals.expired && signals.expiringSoon && (
                    <span className="badge badge--neutral">Soon</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
