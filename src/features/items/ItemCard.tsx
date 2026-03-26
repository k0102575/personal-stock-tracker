import { Link } from "react-router-dom";
import { formatDate, getInventorySignals, getItemSubtitle, getMinimumLabel, getQuantityLabel } from "../../lib/inventory";
import { getCategoryLabel, getStatusLabel } from "../../shared/labels";
import type { InventoryItem } from "../../shared/types";

export function ItemCard({ item }: { item: InventoryItem }) {
  const signals = getInventorySignals(item);

  return (
    <Link className="item-card" to={`/items/${item.id}`}>
      <div className="item-card__top">
        <div>
          <p className="eyebrow">{getCategoryLabel(item.category)}</p>
          <h2>{item.name}</h2>
          <p className="muted-text">{getItemSubtitle(item)}</p>
        </div>
        <span className="status-pill">{getStatusLabel(item.status)}</span>
      </div>

      <div className="badge-row">
        {signals.lowStock && <span className="badge badge--warning">재고 부족</span>}
        {signals.expired && <span className="badge badge--danger">우선 유통기한 경과</span>}
        {!signals.expired && signals.expiringSoon && (
          <span className="badge badge--neutral">우선 유통기한 임박</span>
        )}
      </div>

      <dl className="meta-grid">
        <div>
          <dt>현재 수량</dt>
          <dd>{getQuantityLabel(item)}</dd>
        </div>
        <div>
          <dt>기준 수량</dt>
          <dd>{getMinimumLabel(item)}</dd>
        </div>
        <div>
          <dt>우선 유통기한</dt>
          <dd>{formatDate(item.expiryDate)}</dd>
        </div>
        <div>
          <dt>수정일</dt>
          <dd>{formatDate(item.updatedAt)}</dd>
        </div>
      </dl>
    </Link>
  );
}
