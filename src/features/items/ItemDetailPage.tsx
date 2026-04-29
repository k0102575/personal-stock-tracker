import {
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { NotebookPen, PencilLine, Trash2 } from "lucide-react";
import { InventorySignals } from "@/components/InventorySignals";
import { StockMeter } from "@/components/StockMeter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api, getErrorMessage } from "../../lib/api";
import {
  formatDate,
  getDaysUntil,
  getInventorySignals,
  getMinimumLabel,
  getQuantityLabel,
  getStockMeterValue
} from "../../lib/inventory";
import { getGroupItemsForItem } from "../../lib/itemGroups";
import { getCategoryLabel } from "../../shared/labels";

export function ItemDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const itemQuery = useQuery({
    queryKey: ["item", id],
    queryFn: () => api.getItem(id)
  });
  const groupedItemsQuery = useQuery({
    queryKey: ["items", "detail-group"],
    queryFn: () => api.getItems({ sort: "updated_desc" }),
    enabled: itemQuery.isSuccess
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteItem(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["items"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] })
      ]);
      navigate("/inventory", { replace: true });
    }
  });

  if (itemQuery.isPending) {
    return <Card className="content-card p-4 sm:p-6">품목 정보를 불러오는 중입니다...</Card>;
  }

  if (itemQuery.isError) {
    return (
      <div className="inline-alert" role="alert">
        {getErrorMessage(itemQuery.error)}
      </div>
    );
  }

  const item = itemQuery.data;
  const signals = getInventorySignals(item);
  const daysUntilExpiry = getDaysUntil(item.expiryDate);
  const groupedItems = getGroupItemsForItem(groupedItemsQuery.data ?? [], item);

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="content-card">
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex max-w-5xl flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="min-w-0 font-serif text-[1.95rem] font-semibold uppercase leading-none tracking-[-0.05em] text-foreground sm:text-[3rem]">
                  {item.name}
                </h2>
                {item.brand && (
                  <>
                    <span className="text-base font-medium text-muted-foreground/70 sm:text-lg">/</span>
                    <span className="text-sm font-medium text-muted-foreground sm:text-base">{item.brand}</span>
                  </>
                )}
                <span className="text-base font-medium text-muted-foreground/70 sm:text-lg">/</span>
                <span className="eyebrow">{getCategoryLabel(item.category)}</span>
              </div>
              {item.volumeOrUnit && (
                <p className="text-sm text-muted-foreground sm:text-[15px]">{item.volumeOrUnit}</p>
              )}
              <InventorySignals {...signals} />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-y border-outline-variant py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <p className="eyebrow">현재 재고 감도</p>
              <p className="mt-1 truncate text-sm font-semibold text-foreground sm:text-base">
                현재 수량 {getQuantityLabel(item)} / 기준 수량 {getMinimumLabel(item)}
              </p>
            </div>
            <StockMeter
              activeCount={getStockMeterValue(item)}
              tone={signals.expired ? "danger" : signals.lowStock ? "warning" : "primary"}
            />
          </div>

          <dl className="grid border-t border-outline-variant sm:grid-cols-2 xl:grid-cols-4">
            <div className="border-b border-outline-variant py-3 sm:px-3 xl:border-r">
              <dt className="eyebrow">현재 수량</dt>
              <dd className="mt-1.5 text-[1.1rem] font-semibold sm:text-[1.35rem]">{getQuantityLabel(item)}</dd>
            </div>
            <div className="border-b border-outline-variant py-3 sm:px-3 xl:border-r">
              <dt className="eyebrow">기준 수량</dt>
              <dd className="mt-1.5 text-[1.1rem] font-semibold sm:text-[1.35rem]">{getMinimumLabel(item)}</dd>
            </div>
            <div className="border-b border-outline-variant py-3 sm:px-3 xl:border-r">
              <dt className="eyebrow">구매처</dt>
              <dd className="mt-1.5 truncate text-sm font-semibold sm:text-base">{item.purchaseSource || "미입력"}</dd>
            </div>
            <div className="border-b border-outline-variant py-3 sm:px-3">
              <dt className="eyebrow">구매일</dt>
              <dd className="mt-1.5 text-sm font-semibold sm:text-base">{formatDate(item.purchaseDate)}</dd>
            </div>
          </dl>

          <div className="grid border-b border-outline-variant sm:grid-cols-2">
            <div className="flex items-start justify-between gap-3 border-b border-outline-variant py-3 sm:border-b-0 sm:border-r sm:px-3">
              <div>
                <p className="eyebrow">우선 유통기한</p>
                <p className="mt-1 text-sm font-semibold text-foreground sm:text-base">{formatDate(item.expiryDate)}</p>
              </div>
              <p className="shrink-0 text-right text-xs font-medium text-muted-foreground sm:text-sm">
                {daysUntilExpiry === null
                  ? "기한 정보 없음"
                  : daysUntilExpiry < 0
                    ? `${Math.abs(daysUntilExpiry)}일 지남`
                    : `${daysUntilExpiry}일 남음`}
              </p>
            </div>
            <div className="py-3 sm:px-3">
              <p className="eyebrow">수정일</p>
              <p className="mt-1 text-sm font-semibold text-foreground sm:text-base">{formatDate(item.updatedAt)}</p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">생성일 {formatDate(item.createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {groupedItems.length > 1 && (
        <Card className="content-card">
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
              <div>
                <p className="eyebrow">보관함 묶음</p>
                <h3 className="font-serif text-2xl font-medium uppercase tracking-[-0.03em] text-foreground">
                  같이 표시되는 품목
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                보관함에서는 품목명과 브랜드가 같은 {groupedItems.length}개 항목이 하나로 보입니다.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {groupedItems.map((groupedItem) => {
                const isCurrentItem = groupedItem.id === item.id;

                return (
                  <Link
                    className="flex items-center justify-between gap-3 border border-outline-variant bg-surface-container-lowest px-3 py-3 transition-colors hover:bg-surface-container"
                    key={groupedItem.id}
                    to={`/items/${groupedItem.id}`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {groupedItem.volumeOrUnit || "용량 미입력"}
                        {isCurrentItem && (
                          <span className="ml-2 text-xs font-medium text-muted-foreground">
                            현재 상세
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        현재 {getQuantityLabel(groupedItem)} / 기준 {getMinimumLabel(groupedItem)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="eyebrow">우선 유통기한</p>
                      <p className="mt-1 text-xs font-semibold text-foreground">
                        {formatDate(groupedItem.expiryDate)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="content-card">
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <NotebookPen className="size-5 text-primary" />
            <h3 className="font-serif text-2xl font-medium uppercase tracking-[-0.03em] text-foreground">메모</h3>
          </div>
          <p className="text-sm leading-7 text-muted-foreground">
            {item.memo || "저장된 메모가 없습니다."}
          </p>
        </CardContent>
      </Card>

      <Card className="content-card sm:sticky sm:bottom-4 sm:z-20">
        <div className="flex flex-col gap-2.5 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:p-4">
          <Button asChild variant="secondary" className="w-full sm:w-auto">
            <Link to={`/items/${item.id}/edit`}>
              <PencilLine className="size-4" />
              수정
            </Link>
          </Button>
          <Button
            className="w-full sm:w-auto"
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={() => {
              if (window.confirm(`"${item.name}" 항목을 보관함에서 삭제할까요?`)) {
                deleteMutation.mutate();
              }
            }}
            type="button"
          >
            <Trash2 className="size-4" />
            {deleteMutation.isPending ? "삭제 중..." : "삭제"}
          </Button>
        </div>
      </Card>

      {deleteMutation.isError && (
        <div className="inline-alert" role="alert">
          {getErrorMessage(deleteMutation.error)}
        </div>
      )}
    </div>
  );
}
