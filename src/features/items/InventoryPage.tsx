import {
  keepPreviousData,
  useQuery
} from "@tanstack/react-query";
import { useDeferredValue, useState } from "react";
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
    <div className="space-y-6">
      <Card className="sticky top-[7.75rem] z-20 bg-[rgba(250,249,246,0.86)] backdrop-blur-xl">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-2">
              <p className="eyebrow">보관함 둘러보기</p>
              <CardTitle>다시 사기 전에 먼저 검색해보세요</CardTitle>
              <CardDescription>
                카테고리, 상태, 우선 유통기한을 조합해서 필요한 물건만 빠르게 걸러낼 수
                있습니다.
              </CardDescription>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-2 text-sm text-muted-foreground shadow-[0_8px_20px_rgba(47,52,48,0.03)]">
              <SlidersHorizontal className="size-4" />
              <span>필터</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
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

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="field-stack block">
              <span className="field-label">카테고리</span>
              <Select
                value={category}
                onValueChange={(value) =>
                  setCategory(value as NonNullable<ItemListFilters["category"]>)
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
              <span className="field-label">상태</span>
              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(value as NonNullable<ItemListFilters["status"]>)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {ITEM_STATUSES.map((entry) => (
                    <SelectItem key={entry} value={entry}>
                      {getStatusLabel(entry)}
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
                  setExpiry(value as NonNullable<ItemListFilters["expiry"]>)
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

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant={restockOnly ? "default" : "secondary"}
              size="sm"
              onClick={() => setRestockOnly((current) => !current)}
            >
              재구매 필요한 항목만 보기
            </Button>
            {(search || category !== "all" || status !== "all" || expiry !== "all" || restockOnly) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                  setStatus("all");
                  setExpiry("all");
                  setSort("updated_desc");
                  setRestockOnly(false);
                }}
              >
                필터 초기화
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {itemsQuery.isPending ? (
        <Card>보관함을 불러오는 중입니다...</Card>
      ) : itemsQuery.isError ? (
        <div className="inline-alert" role="alert">
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-foreground">
                총 {itemsQuery.data.length}개 품목
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                한 번 열어본 항목은 오프라인에서도 다시 확인할 수 있어요.
              </p>
            </div>
          </div>
          <div className="grid gap-4">
            {itemsQuery.data.map((item) => (
              <ItemCard item={item} key={item.id} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
