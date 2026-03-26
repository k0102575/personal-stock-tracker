import {
  keepPreviousData,
  useQuery
} from "@tanstack/react-query";
import { useDeferredValue, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { api, getErrorMessage } from "../../lib/api";
import { ITEM_CATEGORIES, ITEM_SORTS, ITEM_STATUSES } from "../../shared/constants";
import {
  getCategoryLabel,
  getExpiryFilterLabel,
  getSortLabel,
  getStatusLabel
} from "../../shared/labels";
import type { ItemListFilters } from "../../shared/types";
import { ItemCard } from "./ItemCard";

export function InventoryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<NonNullable<ItemListFilters["category"]>>("all");
  const [status, setStatus] = useState<NonNullable<ItemListFilters["status"]>>("all");
  const [expiry, setExpiry] = useState<NonNullable<ItemListFilters["expiry"]>>("all");
  const [sort, setSort] = useState<NonNullable<ItemListFilters["sort"]>>("updated_desc");
  const [restockOnly, setRestockOnly] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const filters: ItemListFilters = {
    category,
    status,
    expiry,
    sort,
    query: deferredSearch,
    restockOnly
  };

  const itemsQuery = useQuery({
    queryKey: ["items", filters],
    queryFn: () => api.getItems(filters),
    placeholderData: keepPreviousData
  });

  return (
    <div className="stack-lg">
      <section className="panel stack-md">
        <div className="section-heading">
          <h2>보관함 둘러보기</h2>
          <span className="muted-text">다시 사기 전에 먼저 검색해보세요.</span>
        </div>

        <div className="stack-sm">
          <label className="field">
            <span className="field-label">검색</span>
            <input
              className="input"
              placeholder="브랜드, 품목명, 메모로 검색"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <div className="field-grid">
            <label className="field">
              <span className="field-label">카테고리</span>
              <select
                className="input"
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value as NonNullable<ItemListFilters["category"]>
                  )
                }
              >
                <option value="all">전체</option>
                {ITEM_CATEGORIES.map((entry) => (
                  <option key={entry} value={entry}>
                    {getCategoryLabel(entry)}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field-label">상태</span>
              <select
                className="input"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as NonNullable<ItemListFilters["status"]>)
                }
              >
                <option value="all">전체</option>
                {ITEM_STATUSES.map((entry) => (
                  <option key={entry} value={entry}>
                    {getStatusLabel(entry)}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field-label">우선 유통기한</span>
              <select
                className="input"
                value={expiry}
                onChange={(event) =>
                  setExpiry(event.target.value as NonNullable<ItemListFilters["expiry"]>)
                }
              >
                <option value="all">{getExpiryFilterLabel("all")}</option>
                <option value="soon">{getExpiryFilterLabel("soon")}</option>
                <option value="expired">{getExpiryFilterLabel("expired")}</option>
              </select>
            </label>

            <label className="field">
              <span className="field-label">정렬</span>
              <select
                className="input"
                value={sort}
                onChange={(event) =>
                  setSort(event.target.value as NonNullable<ItemListFilters["sort"]>)
                }
              >
                {ITEM_SORTS.map((entry) => (
                  <option key={entry} value={entry}>
                    {getSortLabel(entry)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="toggle">
            <input
              checked={restockOnly}
              onChange={(event) => setRestockOnly(event.target.checked)}
              type="checkbox"
            />
            <span>재구매 필요한 항목만 보기</span>
          </label>
        </div>
      </section>

      {itemsQuery.isPending ? (
        <div className="panel">보관함을 불러오는 중입니다...</div>
      ) : itemsQuery.isError ? (
        <div className="panel inline-alert" role="alert">
          {getErrorMessage(itemsQuery.error)}
        </div>
      ) : itemsQuery.data.length === 0 ? (
        <EmptyState
          title="조건에 맞는 품목이 없습니다"
          description="필터를 조금 완화하거나 새 품목을 등록해서 여기서 관리해보세요."
          actionLabel="새 품목 등록"
          actionTo="/items/new"
        />
      ) : (
        <>
          <div className="section-heading">
            <h2>총 {itemsQuery.data.length}개 품목</h2>
            <span className="muted-text">
              한 번 열어본 항목은 오프라인에서도 다시 확인할 수 있어요.
            </span>
          </div>
          <div className="inventory-list">
            {itemsQuery.data.map((item) => (
              <ItemCard item={item} key={item.id} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
