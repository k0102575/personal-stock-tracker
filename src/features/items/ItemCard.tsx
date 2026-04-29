import { Link } from 'react-router-dom';
import { InventorySignals } from '@/components/InventorySignals';
import { StockMeter } from '@/components/StockMeter';
import {
  formatDate,
  getInventorySignals,
  getMinimumLabel,
  getQuantityLabel,
  getStockMeterValue,
} from '../../lib/inventory';
import { getCategoryLabel } from '../../shared/labels';
import type { InventoryItem } from '../../shared/types';

export function ItemCard({ item }: { item: InventoryItem }) {
  const signals = getInventorySignals(item);
  const volumeLabel = item.volumeOrUnit || '용량 미입력';

  return (
    <Link
      className="group block h-full border border-outline-variant bg-surface-container-lowest px-3 py-3 transition-colors duration-200 hover:bg-surface-container sm:px-5 sm:py-5"
      to={`/items/${item.id}`}
    >
      <div className="flex items-center justify-between gap-2 sm:hidden">
        <p className="min-w-0 truncate text-[12px] font-medium text-foreground">
          <span>{item.name}</span>
          {item.brand && <span className="text-muted-foreground"> / {item.brand}</span>}
          <span className="text-muted-foreground"> / {getCategoryLabel(item.category)}</span>
        </p>
      </div>

      <div className="hidden items-start gap-3 sm:flex sm:gap-4">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-4">
          <div className="hidden min-w-0 items-baseline gap-2 overflow-hidden whitespace-nowrap sm:flex">
            <h2 className="min-w-0 truncate font-serif text-[0.95rem] font-medium uppercase text-foreground sm:text-[1.35rem]">
              {item.name}
            </h2>
            {item.brand && (
              <>
                <span className="shrink-0 text-sm font-medium text-muted-foreground/70">/</span>
                <span className="truncate text-sm text-muted-foreground">{item.brand}</span>
              </>
            )}
            <span className="shrink-0 text-sm font-medium text-muted-foreground/70">/</span>
            <span className="eyebrow shrink-0">{getCategoryLabel(item.category)}</span>
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 sm:mt-4 sm:gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="rounded-full border border-outline-variant bg-surface-container-low px-2.5 py-1 text-[11px] font-semibold text-muted-foreground sm:text-xs">
            {volumeLabel}
          </span>
          <InventorySignals
            expired={signals.expired}
            expiringSoon={signals.expiringSoon}
            lowStock={false}
          />
        </div>
        <div className="space-y-1">
          <StockMeter
            activeCount={getStockMeterValue(item)}
            tone={signals.lowStock ? 'danger' : 'primary'}
            className="justify-end"
          />
          <p
            className={`hidden text-right text-[11px] uppercase tracking-[0.16em] sm:block ${
              signals.lowStock ? 'text-error' : 'text-muted-foreground'
            }`}
          >
            {signals.lowStock ? '재고 부족' : '재고 결'}
          </p>
        </div>
      </div>

      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-outline-variant pt-2 sm:mt-5 sm:gap-3 sm:border-0 sm:pt-0">
        <div className="sm:border sm:border-outline-variant sm:bg-surface-container-low sm:px-4 sm:py-3">
          <dt className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            현재 수량
          </dt>
          <dd className="text-sm font-semibold text-foreground sm:mt-1 sm:text-lg">
            {getQuantityLabel(item)}
          </dd>
        </div>
        <div className="sm:border sm:border-outline-variant sm:bg-surface-container-low sm:px-4 sm:py-3">
          <dt className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            기준 수량
          </dt>
          <dd className="text-sm font-semibold text-foreground sm:mt-1 sm:text-lg">
            {getMinimumLabel(item)}
          </dd>
        </div>
        <div className="sm:border sm:border-outline-variant sm:bg-surface-container-low sm:px-4 sm:py-3">
          <dt className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            우선 유통기한
          </dt>
          <dd className="text-[11px] font-semibold text-foreground sm:mt-1 sm:text-sm">
            {formatDate(item.expiryDate)}
          </dd>
        </div>
        <div className="sm:border sm:border-outline-variant sm:bg-surface-container-low sm:px-4 sm:py-3">
          <dt className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            수정일
          </dt>
          <dd className="text-[11px] font-semibold text-foreground sm:mt-1 sm:text-sm">
            {formatDate(item.updatedAt)}
          </dd>
        </div>
      </dl>
    </Link>
  );
}
