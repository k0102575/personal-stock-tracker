import { Link } from "react-router-dom";
import { formatDate, getInventorySignals, getItemSubtitle, getMinimumLabel, getQuantityLabel } from "../../lib/inventory";
import type { InventoryItem } from "../../shared/types";

export function ItemCard({ item }: { item: InventoryItem }) {
  const signals = getInventorySignals(item);

  return (
    <Link className="item-card" to={`/items/${item.id}`}>
      <div className="item-card__top">
        <div>
          <p className="eyebrow">{item.category}</p>
          <h2>{item.name}</h2>
          <p className="muted-text">{getItemSubtitle(item)}</p>
        </div>
        <span className="status-pill">{item.status.replace("_", " ")}</span>
      </div>

      <div className="badge-row">
        {signals.lowStock && <span className="badge badge--warning">Low stock</span>}
        {signals.expired && <span className="badge badge--danger">Expired</span>}
        {!signals.expired && signals.expiringSoon && (
          <span className="badge badge--neutral">Expiry soon</span>
        )}
      </div>

      <dl className="meta-grid">
        <div>
          <dt>Quantity</dt>
          <dd>{getQuantityLabel(item)}</dd>
        </div>
        <div>
          <dt>Minimum</dt>
          <dd>{getMinimumLabel(item)}</dd>
        </div>
        <div>
          <dt>Expiry</dt>
          <dd>{formatDate(item.expiryDate)}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>{formatDate(item.updatedAt)}</dd>
        </div>
      </dl>
    </Link>
  );
}
