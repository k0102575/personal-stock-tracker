import {
  keepPreviousData,
  useQuery
} from "@tanstack/react-query";
import { useDeferredValue, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { EmptyState } from "../../components/EmptyState";
import { api, getErrorMessage } from "../../lib/api";
import { getInventorySignals } from "../../lib/inventory";
import { groupInventoryItems } from "../../lib/itemGroups";
import { EXPIRY_FILTERS, ITEM_CATEGORIES, ITEM_SORTS } from "../../shared/constants";
import {
  getCategoryLabel,
  getExpiryFilterLabel,
  getSortLabel
} from "../../shared/labels";
import type { ExpiryFilter, ItemCategory, ItemListFilters } from "../../shared/types";
import { ItemCard } from "./ItemCard";

function getCategoryFromSearchParams(
  searchParams: URLSearchParams
): NonNullable<ItemListFilters["category"]> {
  const categoryParam = searchParams.get("category");

  if (categoryParam && ITEM_CATEGORIES.includes(categoryParam as ItemCategory)) {
    return categoryParam as ItemCategory;
  }

  return "all";
}

function getExpiryFromSearchParams(
  searchParams: URLSearchParams
): NonNullable<ItemListFilters["expiry"]> {
  const expiryParam = searchParams.get("expiry");

  if (expiryParam && EXPIRY_FILTERS.includes(expiryParam as ExpiryFilter)) {
    return expiryParam as ExpiryFilter;
  }

  return "all";
}

function getRestockOnlyFromSearchParams(searchParams: URLSearchParams): boolean {
  return searchParams.get("restockOnly") === "true";
}

export function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<NonNullable<ItemListFilters["category"]>>(() =>
    getCategoryFromSearchParams(searchParams)
  );
  const [expiry, setExpiry] = useState<NonNullable<ItemListFilters["expiry"]>>(() =>
    getExpiryFromSearchParams(searchParams)
  );
  const [sort, setSort] = useState<NonNullable<ItemListFilters["sort"]>>("updated_desc");
  const [restockOnly, setRestockOnly] = useState(() =>
    getRestockOnlyFromSearchParams(searchParams)
  );
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    setCategory(getCategoryFromSearchParams(searchParams));
    setExpiry(getExpiryFromSearchParams(searchParams));
    setRestockOnly(getRestockOnlyFromSearchParams(searchParams));
  }, [searchParams]);

  function updateCategory(nextCategory: NonNullable<ItemListFilters["category"]>) {
    const nextSearchParams = new URLSearchParams(searchParams);

    if (nextCategory === "all") {
      nextSearchParams.delete("category");
    } else {
      nextSearchParams.set("category", nextCategory);
    }

    setCategory(nextCategory);
    setSearchParams(nextSearchParams, { replace: true });
  }

  function updateExpiry(nextExpiry: NonNullable<ItemListFilters["expiry"]>) {
    const nextSearchParams = new URLSearchParams(searchParams);

    if (nextExpiry === "all") {
      nextSearchParams.delete("expiry");
    } else {
      nextSearchParams.set("expiry", nextExpiry);
    }

    setExpiry(nextExpiry);
    setSearchParams(nextSearchParams, { replace: true });
  }

  function updateRestockOnly(nextRestockOnly: boolean) {
    const nextSearchParams = new URLSearchParams(searchParams);

    if (nextRestockOnly) {
      nextSearchParams.set("restockOnly", "true");
    } else {
      nextSearchParams.delete("restockOnly");
    }

    setRestockOnly(nextRestockOnly);
    setSearchParams(nextSearchParams, { replace: true });
  }

  function resetFilters() {
    const nextSearchParams = new URLSearchParams(searchParams);

    nextSearchParams.delete("category");
    nextSearchParams.delete("expiry");
    nextSearchParams.delete("restockOnly");
    setSearch("");
    setCategory("all");
    setExpiry("all");
    setSort("updated_desc");
    setRestockOnly(false);
    setSearchParams(nextSearchParams, { replace: true });
  }

  const filters: ItemListFilters = {
    category,
    sort,
    query: deferredSearch
  };

  const itemsQuery = useQuery({
    queryKey: ["items", filters],
    queryFn: () => api.getItems(filters),
    placeholderData: keepPreviousData
  });
  const itemGroups = groupInventoryItems(itemsQuery.data ?? [], sort).filter((group) => {
    const signals = getInventorySignals(group.item);

    if (restockOnly && !signals.lowStock) {
      return false;
    }

    if (expiry === "expired") {
      return signals.expired;
    }

    if (expiry === "soon") {
      return signals.expiringSoon;
    }

    return true;
  });
  const visibleItemCount = itemGroups.reduce((count, group) => count + group.items.length, 0);

  return (
    <div className="space-y-3 sm:space-y-7">
      <Card className="content-card">
        <CardHeader className="space-y-2 border-b border-outline-variant p-3 sm:space-y-3 sm:p-6">
          <div className="flex items-end justify-between gap-3">
            <div className="space-y-0.5">
              <p className="eyebrow">검색/필터</p>
              <CardTitle className="text-[1.05rem] sm:text-[2.8rem]">Buy Nothing Twice</CardTitle>
              <CardDescription className="hidden sm:block">
                카테고리와 우선 유통기한을 조합해서 필요한 물건만 빠르게 걸러낼 수 있습니다.
              </CardDescription>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-outline-variant bg-white px-4 py-2 text-sm text-muted-foreground sm:inline-flex">
              <SlidersHorizontal className="size-4" />
              <span>필터</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-2.5 p-3 pt-3 sm:space-y-4 sm:p-6 sm:pt-0">
          <label className="field-stack block">
            <span className="field-label">검색</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-11"
                placeholder="브랜드, 품목명, 메모로 검색"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </label>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-2 xl:grid-cols-3">
            <label className="field-stack block">
              <span className="field-label">카테고리</span>
              <Select
                value={category}
                onValueChange={(value) =>
                  updateCategory(value as NonNullable<ItemListFilters["category"]>)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {ITEM_CATEGORIES.map((entry) => (
                    <SelectItem key={entry} value={entry}>
                      {getCategoryLabel(entry)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="field-stack block">
              <span className="field-label">우선 유통기한</span>
              <Select
                value={expiry}
                onValueChange={(value) =>
                  updateExpiry(value as NonNullable<ItemListFilters["expiry"]>)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="우선 유통기한 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{getExpiryFilterLabel("all")}</SelectItem>
                  <SelectItem value="soon">{getExpiryFilterLabel("soon")}</SelectItem>
                  <SelectItem value="expired">{getExpiryFilterLabel("expired")}</SelectItem>
                </SelectContent>
              </Select>
            </label>

            <label className="field-stack block">
              <span className="field-label">정렬</span>
              <Select
                value={sort}
                onValueChange={(value) =>
                  setSort(value as NonNullable<ItemListFilters["sort"]>)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="정렬 선택" />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_SORTS.map((entry) => (
                    <SelectItem key={entry} value={entry}>
                      {getSortLabel(entry)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <Button
              className="w-full sm:w-auto"
              type="button"
              variant={restockOnly ? "default" : "secondary"}
              size="sm"
              onClick={() => updateRestockOnly(!restockOnly)}
            >
              재구매 필요한 항목만 보기
            </Button>
            {(search || category !== "all" || expiry !== "all" || restockOnly) && (
              <Button
                className="w-full sm:w-auto"
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetFilters}
              >
                필터 초기화
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {itemsQuery.isPending ? (
        <Card className="content-card p-4 sm:p-6">보관함을 불러오는 중입니다...</Card>
      ) : itemsQuery.isError ? (
        <div className="inline-alert" role="alert">
          {getErrorMessage(itemsQuery.error)}
        </div>
      ) : itemGroups.length === 0 ? (
        <EmptyState
          title="조건에 맞는 품목이 없습니다"
          description="필터를 조금 완화하거나 새 품목을 등록해서 여기서 관리해보세요."
          actionLabel="새 품목 등록"
          actionTo="/items/new"
        />
      ) : (
        <>
          <div className="flex flex-col gap-0.5 border-b border-outline-variant pb-2 sm:flex-row sm:items-end sm:justify-between sm:pb-4">
            <div>
              <h2 className="font-serif text-[1.1rem] font-medium uppercase tracking-[-0.04em] text-foreground sm:text-[2.8rem]">
                총 {visibleItemCount}개 품목
              </h2>
              <p className="text-[10px] text-muted-foreground sm:mt-2 sm:text-sm">
                {itemGroups.length === visibleItemCount
                  ? "한 번 열어본 항목은 오프라인에서도 다시 확인할 수 있어요."
                  : `${visibleItemCount}개 품목을 ${itemGroups.length}개 카드로 묶어서 보여줍니다.`}
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {itemGroups.map((group) => (
              <ItemCard item={group.item} key={group.key} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
