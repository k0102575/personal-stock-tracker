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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ITEM_CATEGORIES } from "../../shared/constants";
import { getCategoryLabel } from "../../shared/labels";
import type { InventoryItem, InventoryItemInput } from "../../shared/types";

type QuantityField = "currentQuantity" | "minimumQuantity";
type NameSuggestion = Pick<InventoryItem, "id" | "brand" | "category" | "name">;

function RequiredMark() {
  return <span className="ml-1 text-[1.05rem] font-bold leading-none text-red-600 sm:text-[1.15rem]">*</span>;
}

const EMPTY_FORM: InventoryItemInput = {
  category: "skincare",
  brand: "",
  name: "",
  volumeOrUnit: "",
  currentQuantity: 1,
  minimumQuantity: 1,
  purchaseSource: "",
  purchaseDate: null,
  expiryDate: null,
  memo: ""
};

const EMPTY_QUANTITY_DRAFTS: Record<QuantityField, string> = {
  currentQuantity: String(EMPTY_FORM.currentQuantity),
  minimumQuantity: String(EMPTY_FORM.minimumQuantity)
};

function getNameSuggestions(items: InventoryItem[], query: string): NameSuggestion[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  const seen = new Set<string>();

  return items
    .filter((item) => item.name.toLowerCase().includes(normalizedQuery))
    .filter((item) => {
      const key = [
        item.name.trim().toLowerCase(),
        item.brand.trim().toLowerCase(),
        item.category
      ].join("|");
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, 6)
    .map((item) => ({
      id: item.id,
      brand: item.brand,
      category: item.category,
      name: item.name
    }));
}

export function ItemFormPage({ mode }: { mode: "create" | "edit" }) {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<InventoryItemInput>(EMPTY_FORM);
  const [quantityDrafts, setQuantityDrafts] =
    useState<Record<QuantityField, string>>(EMPTY_QUANTITY_DRAFTS);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [hasEditedQuantity, setHasEditedQuantity] = useState(mode === "edit");
  const [isNameSuggestionOpen, setIsNameSuggestionOpen] = useState(false);

  const itemQuery = useQuery({
    queryKey: ["item", id],
    queryFn: () => api.getItem(id),
    enabled: mode === "edit"
  });

  const autocompleteQuery = useQuery({
    queryKey: ["items", "name-autocomplete"],
    queryFn: () => api.getItems({ sort: "updated_desc" }),
    enabled: mode === "create"
  });

  useEffect(() => {
    if (mode === "edit" && itemQuery.data) {
      const defaults = toFormDefaults(itemQuery.data);
      setForm(defaults);
      setQuantityDrafts({
        currentQuantity: String(defaults.currentQuantity),
        minimumQuantity: String(defaults.minimumQuantity)
      });
    }
  }, [itemQuery.data, mode]);

  const mutation = useMutation({
    mutationFn: async (payload: InventoryItemInput) =>
      mode === "create" ? api.createItem(payload) : api.updateItem(id, payload),
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
    return <Card className="content-card p-4 sm:p-6">품목 정보를 불러오는 중입니다...</Card>;
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
      const nextValue = event.target.value;
      setHasEditedQuantity(true);
      setQuantityDrafts((current) => ({
        ...current,
        [key]: nextValue
      }));

      const parsedValue = parseQuantityDraft(nextValue);
      if (parsedValue !== null) {
        updateField(key, parsedValue);
      }
    };
  }

  function applyNameSuggestion(suggestion: NameSuggestion) {
    setForm((current) => ({
      ...current,
      name: suggestion.name,
      brand: suggestion.brand,
      category: suggestion.category
    }));
    setIsNameSuggestionOpen(false);
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

    const currentQuantity = parseQuantityDraft(quantityDrafts.currentQuantity);
    const minimumQuantity = parseQuantityDraft(quantityDrafts.minimumQuantity);

    if (currentQuantity === null || minimumQuantity === null) {
      setValidationError("현재 수량과 기준 수량을 모두 입력해주세요.");
      return;
    }

    setValidationError(null);
    mutation.mutate({
      ...form,
      currentQuantity,
      minimumQuantity
    });
  }

  const showQuantityPreview = mode === "edit" || hasEditedQuantity;
  const previewCurrentQuantity = parseQuantityDraft(quantityDrafts.currentQuantity);
  const previewMinimumQuantity = parseQuantityDraft(quantityDrafts.minimumQuantity);
  const stockMeterTone = previewCurrentQuantity === 0 ? "danger" : "primary";
  const nameSuggestions = getNameSuggestions(autocompleteQuery.data ?? [], form.name);
  const showNameSuggestions =
    mode === "create" && isNameSuggestionOpen && nameSuggestions.length > 0;

  return (
    <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
      <Card className="content-card">
        <CardContent className="flex flex-col gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-2.5 sm:gap-3">
            <PackagePlus className="mt-1 size-5 text-primary" />
            <div className="space-y-2">
              <div className="space-y-1">
                <p className="eyebrow">현재 재고 감도</p>
                <div className="flex flex-wrap items-end gap-3 sm:gap-4">
                  <p className="text-[1.55rem] font-semibold text-foreground sm:text-[2.1rem]">
                    {showQuantityPreview
                      ? `${quantityDrafts.currentQuantity || "-"} / ${quantityDrafts.minimumQuantity || "-"}`
                      : "수량 입력 전"}
                  </p>
                  <StockMeter
                    activeCount={
                      showQuantityPreview
                      && previewCurrentQuantity !== null
                      && previewMinimumQuantity !== null
                        ? getStockMeterValue({
                            currentQuantity: previewCurrentQuantity,
                            minimumQuantity: previewMinimumQuantity
                          })
                        : 0
                    }
                    tone={stockMeterTone}
                  />
                </div>
              </div>
              <p className="text-sm leading-5 text-muted-foreground sm:leading-6">
                {showQuantityPreview
                  ? "입력한 현재 수량과 기준 수량을 바탕으로 재고 여유를 바로 확인할 수 있어요."
                  : "처음 등록할 때는 현재 보유 수량과 보충 기준 수량을 입력하면 감도가 계산됩니다."}
              </p>
            </div>
          </div>

          <div className="hidden rounded-[1.5rem] bg-tertiary-container/70 px-5 py-4 sm:block lg:max-w-sm">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-1 size-5 text-tertiary" />
              <div className="space-y-1">
                <p className="eyebrow text-tertiary/70">우선 유통기한 흐름</p>
                <p className="text-sm leading-6 text-tertiary/80">
                  입력한 날짜를 기준으로 상세 화면과 대시보드에서 자연스럽게 신호가 반영됩니다.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4 sm:space-y-6">
        <Card className="content-card">
          <CardHeader>
            <CardTitle className="text-2xl">기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <div className="field-stack block md:col-span-2">
              <label className="field-label" htmlFor="item-name">
                품목명<RequiredMark />
              </label>
              <div className="relative">
                <Input
                  id="item-name"
                  value={form.name}
                  onBlur={() => setIsNameSuggestionOpen(false)}
                  onChange={(event) => {
                    updateField("name", event.target.value);
                    setIsNameSuggestionOpen(true);
                  }}
                  onFocus={() => setIsNameSuggestionOpen(true)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setIsNameSuggestionOpen(false);
                    }
                  }}
                  placeholder="시카 크림, 핸드크림, 향수처럼 입력해보세요"
                />
                {showNameSuggestions && (
                  <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-[1rem] border border-outline-variant bg-surface-container-lowest shadow-[0_18px_45px_rgba(0,0,0,0.12)]">
                    <p className="border-b border-outline-variant px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      기존 품목에서 자동완성
                    </p>
                    <div className="max-h-64 overflow-y-auto">
                      {nameSuggestions.map((suggestion) => (
                        <button
                          key={`${suggestion.id}-${suggestion.name}-${suggestion.brand}-${suggestion.category}`}
                          className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-container focus-visible:bg-surface-container focus-visible:outline-none"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            applyNameSuggestion(suggestion);
                          }}
                          type="button"
                        >
                          <span className="min-w-0 truncate text-sm font-semibold text-foreground">
                            {suggestion.name}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {suggestion.brand || "브랜드 미입력"} / {getCategoryLabel(suggestion.category)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <label className="field-stack block">
              <span className="field-label">카테고리<RequiredMark /></span>
              <Select
                key={`category-${form.category}`}
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

            <label className="field-stack block">
              <span className="field-label">구매처</span>
              <Input
                value={form.purchaseSource}
                onChange={(event) => updateField("purchaseSource", event.target.value)}
                placeholder="예: 올리브영, 백화점, 온라인몰"
              />
            </label>
          </CardContent>
        </Card>

        <Card className="content-card">
          <CardHeader>
            <CardTitle className="text-2xl">수량과 일정</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <label className="field-stack block">
              <span className="field-label">현재 수량<RequiredMark /></span>
              <Input
                inputMode="numeric"
                min="0"
                step="1"
                type="number"
                value={quantityDrafts.currentQuantity}
                onChange={handleNumberChange("currentQuantity")}
              />
              <span className="field-hint">
                {mode === "create"
                  ? "처음 등록하는 시점의 실제 보유 수량을 적어주세요."
                  : "지금 남아 있는 수량을 기준으로 입력해주세요."}
              </span>
            </label>

            <label className="field-stack block">
              <span className="field-label">기준 수량<RequiredMark /></span>
              <Input
                inputMode="numeric"
                min="0"
                step="1"
                type="number"
                value={quantityDrafts.minimumQuantity}
                onChange={handleNumberChange("minimumQuantity")}
              />
              <span className="field-hint">
                이 수량 이하로 내려가면 재고 부족 신호가 표시됩니다.
              </span>
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
              <span className="field-label">우선 유통기한</span>
              <Input
                type="date"
                value={form.expiryDate ?? ""}
                onChange={(event) => updateField("expiryDate", event.target.value || null)}
              />
            </label>
          </CardContent>
        </Card>

        <Card className="content-card">
          <CardHeader>
            <CardTitle className="text-2xl">메모</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="field-stack block">
              <span className="field-label">기록 메모</span>
              <Textarea
                rows={4}
                value={form.memo}
                onChange={(event) => updateField("memo", event.target.value)}
                placeholder="피부 반응, 계절별 사용감, 보관 위치 등을 기록해보세요"
              />
            </label>
          </CardContent>
        </Card>
      </div>

      {(validationError || mutation.error) && (
        <div className="inline-alert" role="alert">
          {validationError || getErrorMessage(mutation.error)}
        </div>
      )}

      <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link to={mode === "edit" ? `/items/${id}` : "/inventory"}>
            <Undo2 className="size-4" />
            취소
          </Link>
        </Button>
        <Button className="w-full sm:w-auto" disabled={mutation.isPending} type="submit">
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

function parseQuantityDraft(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return Math.max(0, parsed);
}
