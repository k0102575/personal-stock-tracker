import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowUpRight, Clock3, Package2, TriangleAlert } from "lucide-react";
import { InventorySignals } from "@/components/InventorySignals";
import { StockMeter } from "@/components/StockMeter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.5fr_0.9fr]">
        <Card className="overflow-hidden bg-[linear-gradient(145deg,rgba(88,98,73,0.98),rgba(76,86,62,0.92))] text-primary-foreground">
          <CardContent className="space-y-8">
            <div className="space-y-3">
              <p className="eyebrow text-primary-foreground/72">오늘의 요약</p>
              <h2 className="max-w-xl text-4xl font-semibold tracking-[-0.05em] text-primary-foreground sm:text-5xl">
                현재 관리 중인 품목 {summary.totalItems}개
              </h2>
              <p className="max-w-xl text-sm leading-7 text-primary-foreground/78">
                다음 쇼핑 전에 먼저 확인해야 할 재고, 우선 유통기한, 최근 움직임을 한
                화면에서 정리해두었습니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary">
                <Link to="/inventory">보관함 보기</Link>
              </Button>
              <Button asChild variant="ghost" className="text-primary-foreground hover:bg-white/10">
                <Link to="/items/new">빠른 등록</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <Card className="bg-surface-container-lowest">
            <CardContent className="space-y-4">
              <Package2 className="size-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">재고 부족</p>
                <strong className="mt-2 block text-4xl font-semibold text-foreground">
                  {summary.lowStockCount}
                </strong>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-tertiary-container/80">
            <CardContent className="space-y-4">
              <Clock3 className="size-5 text-tertiary" />
              <div>
                <p className="text-sm text-tertiary/80">우선 유통기한 임박</p>
                <strong className="mt-2 block text-4xl font-semibold text-tertiary">
                  {summary.expiringSoonCount}
                </strong>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[color:color-mix(in_srgb,var(--error-container)_22%,white)]">
            <CardContent className="space-y-4">
              <TriangleAlert className="size-5 text-error-dim" />
              <div>
                <p className="text-sm text-error-dim/80">우선 유통기한 경과</p>
                <strong className="mt-2 block text-4xl font-semibold text-error-dim">
                  {summary.expiredCount}
                </strong>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1.25fr]">
        <Card className="bg-surface-container-low">
          <CardHeader className="flex-row items-end justify-between">
            <div className="space-y-2">
              <p className="eyebrow">카테고리 분포</p>
              <CardTitle>보관함 결</CardTitle>
              <CardDescription>어떤 영역에 재고가 몰려 있는지 가볍게 훑어보세요.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/inventory">전체 보기</Link>
            </Button>
          </CardHeader>
          <CardContent className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {summary.categories.map((entry) => (
              <div
                className="min-w-36 rounded-[1.5rem] bg-surface-container-lowest px-4 py-4 shadow-[0_10px_24px_rgba(47,52,48,0.03)]"
                key={entry.category}
              >
                <p className="eyebrow">{getCategoryLabel(entry.category)}</p>
                <p className="mt-4 text-3xl font-semibold text-foreground">{entry.count}</p>
                <p className="mt-1 text-sm text-muted-foreground">등록된 품목</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-surface-container-lowest">
          <CardHeader className="flex-row items-end justify-between">
            <div className="space-y-2">
              <p className="eyebrow">최근 업데이트</p>
              <CardTitle>막 손본 품목</CardTitle>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/inventory">품목 관리</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.recentItems.map((item) => {
              const signals = getInventorySignals(item);

              return (
                <Link
                  className="group flex flex-col gap-4 rounded-[1.5rem] bg-surface-container-low px-4 py-4 transition-transform duration-200 hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between"
                  key={item.id}
                  to={`/items/${item.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-[1.25rem] bg-primary-container/70 font-serif text-lg font-semibold text-primary">
                      {getItemInitials(item)}
                    </div>
                    <div className="space-y-1">
                      <strong className="block text-lg font-semibold text-foreground">
                        {item.name}
                      </strong>
                      <p className="text-sm text-muted-foreground">
                        {item.brand || getCategoryLabel(item.category)} / 수정일{" "}
                        {formatDate(item.updatedAt)}
                      </p>
                      <InventorySignals {...signals} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
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
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                      자세히
                      <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
