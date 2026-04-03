import {
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CalendarClock, NotebookPen, PencilLine, Trash2 } from "lucide-react";
import { InventorySignals } from "@/components/InventorySignals";
import { StockMeter } from "@/components/StockMeter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, getErrorMessage } from "../../lib/api";
import {
  formatDate,
  getDaysUntil,
  getInventorySignals,
  getItemSubtitle,
  getMinimumLabel,
  getQuantityLabel,
  getStockMeterValue
} from "../../lib/inventory";
import { getCategoryLabel, getStatusLabel } from "../../shared/labels";

export function ItemDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const itemQuery = useQuery({
    queryKey: ["item", id],
    queryFn: () => api.getItem(id)
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
    return <Card>품목 정보를 불러오는 중입니다...</Card>;
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

  return (
    <div className="space-y-6">
      <Card className="bg-surface-container-lowest">
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className="eyebrow">{getCategoryLabel(item.category)}</p>
              <h2 className="max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-5xl">
                {item.name}
              </h2>
              <p className="text-base text-muted-foreground">{getItemSubtitle(item)}</p>
              <InventorySignals {...signals} />
            </div>
            <span className="inline-flex w-fit rounded-full bg-surface-container px-4 py-2 text-sm font-semibold text-muted-foreground">
              {getStatusLabel(item.status)}
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[1.75rem] bg-surface-container-low px-5 py-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-2">
                  <p className="eyebrow">현재 재고 감도</p>
                  <h3 className="text-2xl font-semibold">
                    현재 수량 {getQuantityLabel(item)} / 기준 수량 {getMinimumLabel(item)}
                  </h3>
                </div>
                <StockMeter
                  activeCount={getStockMeterValue(item)}
                  tone={signals.expired ? "danger" : signals.lowStock ? "warning" : "primary"}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[1.5rem] bg-tertiary-container/70 px-5 py-4">
                <div className="flex items-start gap-3">
                  <CalendarClock className="mt-0.5 size-5 text-tertiary" />
                  <div className="space-y-1">
                    <p className="eyebrow text-tertiary/70">우선 유통기한</p>
                    <p className="text-lg font-semibold text-tertiary">{formatDate(item.expiryDate)}</p>
                    <p className="text-sm text-tertiary/80">
                      {daysUntilExpiry === null
                        ? "기한 정보가 없습니다."
                        : daysUntilExpiry < 0
                          ? `${Math.abs(daysUntilExpiry)}일 지났습니다.`
                          : `${daysUntilExpiry}일 남았습니다.`}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-[1.5rem] bg-surface-container-low px-5 py-4">
                <div className="space-y-1">
                  <p className="eyebrow">수정일</p>
                  <p className="text-lg font-semibold text-foreground">{formatDate(item.updatedAt)}</p>
                  <p className="text-sm text-muted-foreground">생성일 {formatDate(item.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.5rem] bg-surface-container-low px-5 py-4">
              <dt className="eyebrow">현재 수량</dt>
              <dd className="mt-2 text-2xl font-semibold">{getQuantityLabel(item)}</dd>
            </div>
            <div className="rounded-[1.5rem] bg-surface-container-low px-5 py-4">
              <dt className="eyebrow">기준 수량</dt>
              <dd className="mt-2 text-2xl font-semibold">{getMinimumLabel(item)}</dd>
            </div>
            <div className="rounded-[1.5rem] bg-surface-container-low px-5 py-4">
              <dt className="eyebrow">우선 유통기한</dt>
              <dd className="mt-2 text-base font-semibold">{formatDate(item.expiryDate)}</dd>
            </div>
            <div className="rounded-[1.5rem] bg-surface-container-low px-5 py-4">
              <dt className="eyebrow">생성일</dt>
              <dd className="mt-2 text-base font-semibold">{formatDate(item.createdAt)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card className="bg-surface-container-low">
        <CardHeader className="flex-row items-center gap-3">
          <NotebookPen className="size-5 text-primary" />
          <CardTitle className="text-2xl">메모</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="rounded-[1.5rem] bg-surface-container-lowest px-5 py-5 text-sm leading-7 text-muted-foreground">
            {item.memo || "저장된 메모가 없습니다."}
          </p>
        </CardContent>
      </Card>

      <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] bg-[rgba(250,249,246,0.88)] px-4 py-4 backdrop-blur-xl shadow-[var(--shadow-ambient)]">
        <Button asChild variant="secondary">
          <Link to={`/items/${item.id}/edit`}>
            <PencilLine className="size-4" />
            수정
          </Link>
        </Button>
        <Button
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

      {deleteMutation.isError && (
        <div className="inline-alert" role="alert">
          {getErrorMessage(deleteMutation.error)}
        </div>
      )}
    </div>
  );
}
