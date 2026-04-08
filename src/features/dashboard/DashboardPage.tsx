import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowUpRight, Clock3, Package2, TriangleAlert } from "lucide-react";
import { StockMeter } from "@/components/StockMeter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "../../components/EmptyState";
import { api, getErrorMessage } from "../../lib/api";
import {
  formatDate,
  getInventorySignals,
  getItemInitials,
  getStockMeterValue
} from "../../lib/inventory";
import { getCategoryLabel } from "../../shared/labels";

export function DashboardPage() {
  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: api.getDashboardSummary
  });

  if (summaryQuery.isPending) {
    return <Card>대시보드를 불러오는 중입니다...</Card>;
  }

  if (summaryQuery.isError) {
    return (
      <div className="inline-alert" role="alert">
        {getErrorMessage(summaryQuery.error)}
      </div>
    );
  }

  const summary = summaryQuery.data;

  if (summary.totalItems === 0) {
    return (
      <EmptyState
        title="첫 품목을 등록하고 재고 관리를 시작해보세요"
        description="쇼핑 전에 이미 가지고 있는 제품과 우선 유통기한, 재구매 필요 여부를 먼저 확인할 수 있어요."
        actionLabel="첫 품목 등록"
        actionTo="/items/new"
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="space-y-1">
        <h2 className="font-serif text-[1.95rem] font-medium tracking-[-0.04em] text-foreground sm:text-[2.2rem]">
          Shelf Overview
        </h2>
        <p className="text-sm uppercase tracking-[0.14em] text-muted-foreground/80">
          The Ritual of Care • Today
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card className="col-span-2 bg-surface-container-lowest">
          <CardContent className="flex h-36 flex-col justify-between sm:h-40">
            <div className="flex items-start justify-between">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Total Items
              </p>
              <Package2 className="size-5 text-primary/60" />
            </div>
            <div className="flex items-end gap-2">
              <strong className="font-serif text-[2.6rem] font-semibold text-primary sm:text-[3.1rem]">
                {summary.totalItems}
              </strong>
              <span className="pb-1 text-[11px] italic text-muted-foreground">
                Curated Essentials
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface-container-low">
          <CardContent className="flex h-28 flex-col justify-between sm:h-32">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Low Stock
            </p>
            <strong className="font-serif text-[1.9rem] font-medium text-foreground sm:text-[2.1rem]">
              {String(summary.lowStockCount).padStart(2, "0")}
            </strong>
          </CardContent>
        </Card>

        <Card className="bg-tertiary-container">
          <CardContent className="flex h-28 flex-col justify-between sm:h-32">
            <p className="text-[10px] uppercase tracking-[0.16em] text-tertiary/80">
              Expiring Soon
            </p>
            <strong className="font-serif text-[1.9rem] font-medium text-tertiary sm:text-[2.1rem]">
              {String(summary.expiringSoonCount).padStart(2, "0")}
            </strong>
          </CardContent>
        </Card>

        <Card className="col-span-2 bg-error-container/20">
          <CardContent className="flex items-center justify-between gap-4 py-5">
            <div className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-full bg-error-container text-error-dim">
                <TriangleAlert className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.14em] text-error-dim/70">
                  Expired
                </p>
                <p className="font-serif text-base font-medium text-error-dim sm:text-lg">
                  {summary.expiredCount} Item Needs Attention
                </p>
              </div>
            </div>
            <ArrowUpRight className="size-4 text-error-dim/40" />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h3 className="font-serif text-[1.25rem] font-medium text-foreground">
            Recent Additions
          </h3>
          <Button asChild variant="link" size="sm" className="h-auto px-0 text-[11px] uppercase tracking-[0.16em]">
            <Link to="/inventory">View All</Link>
          </Button>
        </div>
        <Card className="bg-transparent shadow-none">
          <CardContent className="space-y-2.5 px-0 pt-0 sm:space-y-3">
            {summary.recentItems.map((item) => {
              const signals = getInventorySignals(item);

              return (
                <Link
                  className="group flex items-center justify-between gap-4 rounded-[1rem] bg-surface-container-lowest px-4 py-4 transition-transform duration-200 hover:-translate-y-0.5"
                  key={item.id}
                  to={`/items/${item.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-[0.9rem] bg-surface-container-high font-serif text-base font-semibold text-primary/70">
                      {getItemInitials(item)}
                    </div>
                    <div className="space-y-1">
                      <strong className="block text-sm font-medium text-foreground sm:text-base">
                        {item.name}
                      </strong>
                      <p className="text-[11px] text-muted-foreground">
                        {item.brand || getCategoryLabel(item.category)} • 수정일{" "}
                        {formatDate(item.updatedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="space-y-1 text-right">
                      <StockMeter
                        activeCount={getStockMeterValue(item)}
                        tone={signals.expired ? "danger" : signals.lowStock ? "warning" : "primary"}
                        className="justify-end"
                      />
                      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        재고 결
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h3 className="font-serif text-[1.25rem] font-medium text-foreground">Categories</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {summary.categories.map((entry) => (
            <div
              className="flex min-w-28 shrink-0 flex-col items-center gap-2 rounded-[1.25rem] bg-surface-container-low px-4 py-4 text-center transition-colors hover:bg-surface-container-high"
              key={entry.category}
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-surface-container-lowest text-primary">
                <Package2 className="size-4" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-foreground">
                {getCategoryLabel(entry.category)}
              </span>
              <span className="text-[10px] italic text-muted-foreground">
                {entry.count} items
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
