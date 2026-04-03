import {
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CalendarDays, PackagePlus, Save, Undo2 } from "lucide-react";
import { StockMeter } from "@/components/StockMeter";
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
import { Textarea } from "@/components/ui/textarea";
import { api, getErrorMessage } from "../../lib/api";
import { getStockMeterValue, toFormDefaults } from "../../lib/inventory";
import { ITEM_CATEGORIES, ITEM_STATUSES } from "../../shared/constants";
import {
  getCategoryLabel,
  getStatusDescription,
  getStatusLabel
} from "../../shared/labels";
import type { InventoryItemInput } from "../../shared/types";

const EMPTY_FORM: InventoryItemInput = {
  category: "skincare",
  brand: "",
  name: "",
  volumeOrUnit: "",
  currentQuantity: 1,
  minimumQuantity: 1,
  purchaseSource: "",
  purchaseDate: null,
  openedDate: null,
  expiryDate: null,
  status: "active",
  memo: ""
};

export function ItemFormPage({ mode }: { mode: "create" | "edit" }) {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<InventoryItemInput>(EMPTY_FORM);
  const [validationError, setValidationError] = useState<string | null>(null);

  const itemQuery = useQuery({
    queryKey: ["item", id],
    queryFn: () => api.getItem(id),
    enabled: mode === "edit"
  });

  useEffect(() => {
    if (mode === "edit" && itemQuery.data) {
      setForm(toFormDefaults(itemQuery.data));
    }
  }, [itemQuery.data, mode]);

  const mutation = useMutation({
    mutationFn: async () =>
      mode === "create" ? api.createItem(normalizeForm(form)) : api.updateItem(id, normalizeForm(form)),
    onSuccess: async (item) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["items"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["item", item.id] })
      ]);
      navigate(`/items/${item.id}`, { replace: true });
    }
  });

  if (mode === "edit" && itemQuery.isPending) {
    return <Card>품목 정보를 불러오는 중입니다...</Card>;
  }

  if (mode === "edit" && itemQuery.isError) {
    return (
      <div className="inline-alert" role="alert">
        {getErrorMessage(itemQuery.error)}
      </div>
    );
  }

  function updateField<Key extends keyof InventoryItemInput>(
    key: Key,
    value: InventoryItemInput[Key]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  function handleNumberChange(key: "currentQuantity" | "minimumQuantity") {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = Number.parseInt(event.target.value, 10);
      updateField(key, Number.isNaN(nextValue) ? 0 : Math.max(0, nextValue));
    };
  }

  function normalizeForm(value: InventoryItemInput): InventoryItemInput {
    return {
      ...value,
      status: value.currentQuantity === 0 ? "used_up" : value.status
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      setValidationError("품목명을 입력해주세요.");
      return;
    }

    if (form.currentQuantity < 0 || form.minimumQuantity < 0) {
      setValidationError("수량은 0보다 작을 수 없습니다.");
      return;
    }

    setValidationError(null);
    mutation.mutate();
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <Card className="bg-surface-container-lowest">
        <CardHeader className="flex-row flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="eyebrow">{mode === "create" ? "새 기록 시작" : "기존 기록 정리"}</p>
            <CardTitle>{mode === "create" ? "항목 추가" : "항목 수정"}</CardTitle>
            <CardDescription>
              품목의 성격, 수량, 일정, 메모를 부드럽게 한 화면에서 정리할 수 있습니다.
            </CardDescription>
          </div>
          {mode === "edit" ? (
            <Button asChild variant="ghost" size="sm">
              <Link to={`/items/${id}`}>취소</Link>
            </Button>
          ) : null}
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <label className="field-stack block">
                <span className="field-label">카테고리</span>
                <Select
                  value={form.category}
                  onValueChange={(value) =>
                    updateField("category", value as InventoryItemInput["category"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {getCategoryLabel(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="field-stack block">
                <span className="field-label">상태</span>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    updateField("status", value as InventoryItemInput["status"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {getStatusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="field-hint">{getStatusDescription(form.status)}</span>
              </label>

              <label className="field-stack block md:col-span-2">
                <span className="field-label">품목명</span>
                <Input
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="시카 크림, 핸드크림, 향수처럼 입력해보세요"
                />
              </label>

              <label className="field-stack block">
                <span className="field-label">브랜드</span>
                <Input
                  value={form.brand}
                  onChange={(event) => updateField("brand", event.target.value)}
                  placeholder="예: 라로슈포제"
                />
              </label>

              <label className="field-stack block">
                <span className="field-label">용량 / 단위</span>
                <Input
                  value={form.volumeOrUnit}
                  onChange={(event) => updateField("volumeOrUnit", event.target.value)}
                  placeholder="예: 50ml / 1개"
                />
              </label>

              <label className="field-stack block md:col-span-2">
                <span className="field-label">구매처</span>
                <Input
                  value={form.purchaseSource}
                  onChange={(event) => updateField("purchaseSource", event.target.value)}
                  placeholder="예: 올리브영, 백화점, 온라인몰"
                />
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">수량과 일정</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <label className="field-stack block">
                <span className="field-label">현재 수량</span>
                <Input
                  inputMode="numeric"
                  min="0"
                  step="1"
                  type="number"
                  value={form.currentQuantity}
                  onChange={handleNumberChange("currentQuantity")}
                />
                {form.currentQuantity === 0 && form.status !== "used_up" && (
                  <span className="field-hint">
                    수량이 0이면 저장 시 상태가 `사용 완료`로 반영됩니다.
                  </span>
                )}
              </label>

              <label className="field-stack block">
                <span className="field-label">기준 수량</span>
                <Input
                  inputMode="numeric"
                  min="0"
                  step="1"
                  type="number"
                  value={form.minimumQuantity}
                  onChange={handleNumberChange("minimumQuantity")}
                />
              </label>

              <label className="field-stack block">
                <span className="field-label">구매일</span>
                <Input
                  type="date"
                  value={form.purchaseDate ?? ""}
                  onChange={(event) => updateField("purchaseDate", event.target.value || null)}
                />
              </label>

              <label className="field-stack block">
                <span className="field-label">개봉일</span>
                <Input
                  type="date"
                  value={form.openedDate ?? ""}
                  onChange={(event) => updateField("openedDate", event.target.value || null)}
                />
              </label>

              <label className="field-stack block md:col-span-2">
                <span className="field-label">우선 유통기한</span>
                <Input
                  type="date"
                  value={form.expiryDate ?? ""}
                  onChange={(event) => updateField("expiryDate", event.target.value || null)}
                />
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">메모</CardTitle>
            </CardHeader>
            <CardContent>
              <label className="field-stack block">
                <span className="field-label">기록 메모</span>
                <Textarea
                  rows={6}
                  value={form.memo}
                  onChange={(event) => updateField("memo", event.target.value)}
                  placeholder="피부 반응, 계절별 사용감, 보관 위치 등을 기록해보세요"
                />
              </label>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-surface-container-lowest">
            <CardHeader className="flex-row items-start gap-3">
              <PackagePlus className="mt-1 size-5 text-primary" />
              <div>
                <CardTitle className="text-2xl">현재 재고 감도</CardTitle>
                <CardDescription>입력값에 맞춰 재고의 여유를 바로 확인할 수 있어요.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-[1.5rem] bg-surface-container-low px-5 py-5">
                <div className="flex items-end justify-between gap-4">
                  <div className="space-y-1">
                    <p className="eyebrow">현재 기준</p>
                    <p className="text-3xl font-semibold text-foreground">
                      {form.currentQuantity} / {form.minimumQuantity}
                    </p>
                  </div>
                  <StockMeter
                    activeCount={getStockMeterValue({
                      currentQuantity: form.currentQuantity,
                      minimumQuantity: form.minimumQuantity
                    })}
                    tone={form.currentQuantity === 0 ? "danger" : "primary"}
                  />
                </div>
              </div>
              <div className="rounded-[1.5rem] bg-tertiary-container/70 px-5 py-4">
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-1 size-5 text-tertiary" />
                  <div className="space-y-1">
                    <p className="eyebrow text-tertiary/70">우선 유통기한 흐름</p>
                    <p className="text-sm leading-6 text-tertiary/80">
                      입력한 날짜를 기준으로 상세 화면과 대시보드에서 자연스럽게 신호가
                      반영됩니다.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {(validationError || mutation.error) && (
        <div className="inline-alert" role="alert">
          {validationError || getErrorMessage(mutation.error)}
        </div>
      )}

      <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] bg-[rgba(250,249,246,0.88)] px-4 py-4 backdrop-blur-xl shadow-[var(--shadow-ambient)]">
        <Button asChild variant="ghost">
          <Link to={mode === "edit" ? `/items/${id}` : "/inventory"}>
            <Undo2 className="size-4" />
            취소
          </Link>
        </Button>
        <Button disabled={mutation.isPending} type="submit">
          <Save className="size-4" />
          {mutation.isPending
            ? mode === "create"
              ? "저장 중..."
              : "수정 중..."
            : mode === "create"
              ? "항목 저장"
              : "수정 내용 저장"}
        </Button>
      </div>
    </form>
  );
}
