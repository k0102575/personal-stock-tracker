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
  getDaysUntil,
  getItemInitials,
  getMinimumLabel,
  getQuantityLabel,
  getStockMeterValue
} from "../../lib/inventory";
import { getCategoryLabel } from "../../shared/labels";

export function DashboardPage() {
  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: api.getDashboardSummary
  });

  if (summaryQuery.isPending) {
    return <Card className="content-card p-4 sm:p-6">대시보드를 불러오는 중입니다...</Card>;
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
    <div className="space-y-3 sm:space-y-4">
      <section className="space-y-0.5 border-b border-outline-variant pb-2">
        <h2 className="font-serif text-[2rem] font-medium uppercase leading-[0.94] tracking-[-0.05em] text-foreground sm:text-[3.1rem]">
          Today&apos;s
          <br />
          stock read.
        </h2>
        <p className="max-w-2xl text-[12px] uppercase tracking-[0.14em] text-muted-foreground/80 sm:text-[13px]">
          재고 흐름과 유통기한 신호를 빠르게 읽어내는 대시보드
        </p>
      </section>

      <section className="grid auto-rows-[7.75rem] grid-cols-2 gap-3 sm:auto-rows-[8.5rem] sm:gap-4 lg:grid-cols-4">
        <Card className="col-span-2 border-[#111111] bg-[#111111] text-white">
          <CardContent className="flex h-full flex-col justify-between pt-3 pb-3 sm:pt-4 sm:pb-4">
            <div className="flex items-start justify-between">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/58">
                Total stock
              </p>
              <Package2 className="size-5 text-white/64" />
            </div>
            <div className="space-y-1.5">
              <strong className="font-serif block text-[2.8rem] font-medium uppercase leading-[0.9] sm:text-[3.8rem]">
                {summary.totalItems}
              </strong>
              <p className="max-w-xs text-[12px] leading-5 text-white/72 sm:text-[13px]">
                지금 서랍장과 보관함에 남아 있는 전체 품목 수입니다.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className={summary.expiringSoonCount > 0 ? "content-card" : "content-card col-span-2 lg:col-span-2"}>
          <CardContent className="flex h-full flex-col justify-between pt-3 pb-3 sm:pt-4 sm:pb-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Low stock
            </p>
            <strong className="font-serif text-[1.9rem] font-medium uppercase text-foreground sm:text-[2.4rem]">
              {String(summary.lowStockCount).padStart(2, "0")}
            </strong>
          </CardContent>
        </Card>

        {summary.expiringSoonCount > 0 && (
          <Card className="content-card bg-surface-container">
            <CardContent className="flex h-full flex-col justify-between pt-3 pb-3 sm:pt-4 sm:pb-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Expiring soon
              </p>
              <strong className="font-serif text-[1.9rem] font-medium uppercase text-foreground sm:text-[2.4rem]">
                {String(summary.expiringSoonCount).padStart(2, "0")}
              </strong>
            </CardContent>
          </Card>
        )}

        {summary.expiredCount > 0 && (
          <Card className="col-span-2 border-[#d30005]/20 bg-error-container/70 lg:col-span-2">
            <CardContent className="flex h-full items-center justify-between gap-4 pt-3 pb-3 sm:pt-4 sm:pb-4">
              <div className="flex items-center gap-4">
                <div className="flex size-10 items-center justify-center rounded-full bg-[#d30005] text-white">
                  <TriangleAlert className="size-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-error-dim/72">
                    Expired
                  </p>
                  <p className="font-serif text-[0.95rem] font-medium uppercase text-error-dim sm:text-base">
                    확인이 필요한 항목 {summary.expiredCount}개
                  </p>
                </div>
              </div>
              <ArrowUpRight className="size-4 text-error-dim/40" />
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h3 className="font-serif text-[1.45rem] font-medium uppercase text-foreground">
            재고부족 품목
          </h3>
          <Button asChild variant="link" size="sm" className="h-auto px-0 text-[11px] uppercase tracking-[0.16em]">
            <Link to="/inventory?restockOnly=true">보관함 보기</Link>
          </Button>
        </div>
        {summary.lowStockItems.length === 0 ? (
          <Card className="content-card">
            <CardContent className="flex flex-col gap-2 p-4 sm:p-5">
              <p className="font-serif text-xl font-medium uppercase text-foreground">
                지금은 재고부족 품목이 없습니다.
              </p>
              <p className="text-sm text-muted-foreground">
                기준 수량 이하로 내려간 품목이 생기면 이곳에서 먼저 보여드릴게요.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="content-card overflow-hidden">
            <CardContent className="divide-y divide-outline-variant p-0">
              {summary.lowStockItems.map((item) => (
                <Link
                  className="group flex items-center justify-between gap-4 px-4 py-4 transition-colors duration-200 hover:bg-surface-container sm:px-5"
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
                        {item.brand || getCategoryLabel(item.category)} • 우선 유통기한{" "}
                        {formatDate(item.expiryDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="space-y-1 text-right">
                      <p className="text-[11px] font-semibold text-error">
                        현재 {getQuantityLabel(item)} / 기준 {getMinimumLabel(item)}
                      </p>
                      <StockMeter
                        activeCount={getStockMeterValue(item)}
                        tone="danger"
                        className="justify-end"
                      />
                      <p className="text-[11px] uppercase tracking-[0.16em] text-error">
                        재고 부족
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h3 className="font-serif text-[1.45rem] font-medium uppercase text-foreground">
            유통기한 임박 품목
          </h3>
          <Button asChild variant="link" size="sm" className="h-auto px-0 text-[11px] uppercase tracking-[0.16em]">
            <Link to="/inventory?expiry=soon">보관함 보기</Link>
          </Button>
        </div>
        {summary.expiringSoonItems.length === 0 ? (
          <Card className="content-card">
            <CardContent className="flex flex-col gap-2 p-4 sm:p-5">
              <p className="font-serif text-xl font-medium uppercase text-foreground">
                곧 만료되는 품목이 없습니다.
              </p>
              <p className="text-sm text-muted-foreground">
                우선 유통기한이 가까운 품목이 생기면 최대 3개까지 먼저 보여드릴게요.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="content-card overflow-hidden">
            <CardContent className="divide-y divide-outline-variant p-0">
              {summary.expiringSoonItems.map((item) => {
                const daysUntil = getDaysUntil(item.expiryDate);

                return (
                  <Link
                    className="group flex items-center justify-between gap-4 px-4 py-4 transition-colors duration-200 hover:bg-surface-container sm:px-5"
                    key={item.id}
                    to={`/items/${item.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-[0.9rem] bg-surface-container-high text-primary/70">
                        <Clock3 className="size-5" />
                      </div>
                      <div className="space-y-1">
                        <strong className="block text-sm font-medium text-foreground sm:text-base">
                          {item.name}
                        </strong>
                        <p className="text-[11px] text-muted-foreground">
                          {item.brand || getCategoryLabel(item.category)} • 현재{" "}
                          {getQuantityLabel(item)}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 space-y-1 text-right">
                      <p className="text-[11px] font-semibold text-foreground">
                        {formatDate(item.expiryDate)}
                      </p>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        {daysUntil === null ? "기한 정보" : `D-${daysUntil}`}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="font-serif text-[1.45rem] font-medium uppercase text-foreground">카테고리</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {summary.categories.map((entry) => (
            <Link
              className="flex min-w-28 shrink-0 flex-col items-center gap-2 rounded-[1.25rem] border border-outline-variant bg-surface-container-lowest px-4 py-4 text-center transition-colors hover:bg-surface-container"
              key={entry.category}
              to={`/inventory?category=${entry.category}`}
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-surface-container-lowest text-primary">
                <Package2 className="size-4" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-foreground">
                {getCategoryLabel(entry.category)}
              </span>
              <span className="text-[10px] italic text-muted-foreground">
                {entry.count}개 품목
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
