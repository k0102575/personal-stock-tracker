import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { InventorySignals } from "@/components/InventorySignals";
import { StockMeter } from "@/components/StockMeter";
import {
  formatDate,
  getInventorySignals,
  getItemInitials,
  getItemSubtitle,
  getMinimumLabel,
  getQuantityLabel,
  getStockMeterValue
} from "../../lib/inventory";
import { getCategoryLabel, getStatusLabel } from "../../shared/labels";
import type { InventoryItem } from "../../shared/types";

export function ItemCard({ item }: { item: InventoryItem }) {
  const signals = getInventorySignals(item);

  return (
    <Link
      className="group block rounded-[1.75rem] bg-surface-container-lowest px-5 py-5 shadow-[0_14px_36px_rgba(47,52,48,0.04)] transition-transform duration-200 hover:-translate-y-0.5"
      to={`/items/${item.id}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-[1.35rem] bg-primary-container/75 font-serif text-lg font-semibold text-primary">
            {getItemInitials(item)}
          </div>
          <div className="space-y-1.5">
            <p className="eyebrow">{getCategoryLabel(item.category)}</p>
            <h2 className="text-xl font-semibold text-foreground">{item.name}</h2>
            <p className="text-sm text-muted-foreground">{getItemSubtitle(item)}</p>
          </div>
        </div>
        <div className="space-y-3 text-right">
          <span className="inline-flex rounded-full bg-surface-container px-3 py-1 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground">
            {getStatusLabel(item.status)}
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
            열기
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <InventorySignals {...signals} />
        <div className="space-y-1">
          <StockMeter
            activeCount={getStockMeterValue(item)}
            tone={signals.expired ? "danger" : signals.lowStock ? "warning" : "primary"}
            className="justify-end"
          />
          <p className="text-right text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            재고 결
          </p>
        </div>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.25rem] bg-surface-container-low px-4 py-3">
          <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">현재 수량</dt>
          <dd className="mt-1 text-lg font-semibold text-foreground">{getQuantityLabel(item)}</dd>
        </div>
        <div className="rounded-[1.25rem] bg-surface-container-low px-4 py-3">
          <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">기준 수량</dt>
          <dd className="mt-1 text-lg font-semibold text-foreground">{getMinimumLabel(item)}</dd>
        </div>
        <div className="rounded-[1.25rem] bg-surface-container-low px-4 py-3">
          <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">우선 유통기한</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{formatDate(item.expiryDate)}</dd>
        </div>
        <div className="rounded-[1.25rem] bg-surface-container-low px-4 py-3">
          <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">수정일</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{formatDate(item.updatedAt)}</dd>
        </div>
      </dl>
    </Link>
  );
}
