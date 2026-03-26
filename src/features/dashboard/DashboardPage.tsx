import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { EmptyState } from "../../components/EmptyState";
import { api, getErrorMessage } from "../../lib/api";
import { formatDate, getInventorySignals } from "../../lib/inventory";
import { getCategoryLabel } from "../../shared/labels";

export function DashboardPage() {
  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: api.getDashboardSummary
  });

  if (summaryQuery.isPending) {
    return <div className="panel">대시보드를 불러오는 중입니다...</div>;
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
        title="첫 품목을 등록하고 재고 관리를 시작해보세요"
        description="쇼핑 전에 이미 가지고 있는 제품과 우선 유통기한, 재구매 필요 여부를 먼저 확인할 수 있어요."
        actionLabel="첫 품목 등록"
        actionTo="/items/new"
      />
    );
  }

  return (
    <div className="stack-lg">
      <section className="hero-card">
        <div>
          <p className="eyebrow">오늘의 요약</p>
          <h2>현재 관리 중인 품목 {summary.totalItems}개</h2>
          <p className="muted-text">
            다음 쇼핑 전에 확인이 필요한 재고와 우선 유통기한을 빠르게 살펴보세요.
          </p>
        </div>
        <div className="hero-actions">
          <Link className="button button--primary" to="/inventory">
            보관함 보기
          </Link>
          <Link className="button button--secondary" to="/items/new">
            빠른 등록
          </Link>
        </div>
      </section>

      <section className="summary-grid">
        <article className="stat-card">
          <span className="stat-card__label">재고 부족</span>
          <strong>{summary.lowStockCount}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">우선 유통기한 임박</span>
          <strong>{summary.expiringSoonCount}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">우선 유통기한 경과</span>
          <strong>{summary.expiredCount}</strong>
        </article>
      </section>

      <section className="panel stack-md">
        <div className="section-heading">
          <h2>카테고리 분포</h2>
          <Link className="text-link" to="/inventory">
            전체 보기
          </Link>
        </div>
        <div className="chip-row">
          {summary.categories.map((entry) => (
            <span className="chip" key={entry.category}>
              {getCategoryLabel(entry.category)} {entry.count}개
            </span>
          ))}
        </div>
      </section>

      <section className="panel stack-md">
        <div className="section-heading">
          <h2>최근 업데이트</h2>
          <Link className="text-link" to="/inventory">
            품목 관리
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
                    {item.brand || getCategoryLabel(item.category)} / 수정일 {formatDate(item.updatedAt)}
                  </p>
                </div>
                <div className="badge-row">
                  {signals.lowStock && <span className="badge badge--warning">재고 부족</span>}
                  {signals.expired && <span className="badge badge--danger">우선 유통기한 경과</span>}
                  {!signals.expired && signals.expiringSoon && (
                    <span className="badge badge--neutral">우선 유통기한 임박</span>
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
