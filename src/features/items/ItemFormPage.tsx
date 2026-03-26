import {
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, getErrorMessage } from "../../lib/api";
import { toFormDefaults } from "../../lib/inventory";
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
    return <div className="panel">품목 정보를 불러오는 중입니다...</div>;
  }

  if (mode === "edit" && itemQuery.isError) {
    return (
      <div className="panel inline-alert" role="alert">
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
    <form className="stack-lg" onSubmit={handleSubmit}>
      <section className="panel stack-md">
        <div className="section-heading">
          <h2>{mode === "create" ? "항목 추가" : "항목 수정"}</h2>
          {mode === "edit" ? (
            <Link className="text-link" to={`/items/${id}`}>
              취소
            </Link>
          ) : null}
        </div>

        <div className="field-grid">
          <label className="field">
            <span className="field-label">카테고리</span>
            <select
              className="input"
              value={form.category}
              onChange={(event) => updateField("category", event.target.value as InventoryItemInput["category"])}
            >
              {ITEM_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {getCategoryLabel(category)}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field-label">상태</span>
            <select
              className="input"
              value={form.status}
              onChange={(event) => updateField("status", event.target.value as InventoryItemInput["status"])}
            >
              {ITEM_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {getStatusLabel(status)}
                </option>
              ))}
            </select>
            <span className="field-hint">{getStatusDescription(form.status)}</span>
          </label>

          <label className="field field--full">
            <span className="field-label">품목명</span>
            <input
              className="input"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="시카 크림, 핸드크림, 향수처럼 입력해보세요"
            />
          </label>

          <label className="field">
            <span className="field-label">브랜드</span>
            <input
              className="input"
              value={form.brand}
              onChange={(event) => updateField("brand", event.target.value)}
              placeholder="예: 라로슈포제"
            />
          </label>

          <label className="field">
            <span className="field-label">용량 / 단위</span>
            <input
              className="input"
              value={form.volumeOrUnit}
              onChange={(event) => updateField("volumeOrUnit", event.target.value)}
              placeholder="예: 50ml / 1개"
            />
          </label>

          <label className="field">
            <span className="field-label">현재 수량</span>
            <input
              className="input"
              inputMode="numeric"
              min="0"
              step="1"
              type="number"
              value={form.currentQuantity}
              onChange={handleNumberChange("currentQuantity")}
            />
            {form.currentQuantity === 0 && form.status !== "used_up" && (
              <span className="field-hint">수량이 0이면 저장 시 상태가 `사용 완료`로 반영됩니다.</span>
            )}
          </label>

          <label className="field">
            <span className="field-label">기준 수량</span>
            <input
              className="input"
              inputMode="numeric"
              min="0"
              step="1"
              type="number"
              value={form.minimumQuantity}
              onChange={handleNumberChange("minimumQuantity")}
            />
          </label>

          <label className="field field--full">
            <span className="field-label">우선 유통기한</span>
            <input
              className="input"
              type="date"
              value={form.expiryDate ?? ""}
              onChange={(event) => updateField("expiryDate", event.target.value || null)}
            />
          </label>

          <label className="field field--full">
            <span className="field-label">메모</span>
            <textarea
              className="input textarea"
              rows={5}
              value={form.memo}
              onChange={(event) => updateField("memo", event.target.value)}
              placeholder="피부 반응, 계절별 사용감, 보관 위치 등을 기록해보세요"
            />
          </label>
        </div>
      </section>

      {(validationError || mutation.error) && (
        <div className="panel inline-alert" role="alert">
          {validationError || getErrorMessage(mutation.error)}
        </div>
      )}

      <div className="sticky-action-bar">
        <Link className="button button--ghost" to={mode === "edit" ? `/items/${id}` : "/inventory"}>
          취소
        </Link>
        <button className="button button--primary" disabled={mutation.isPending} type="submit">
          {mutation.isPending
            ? mode === "create"
              ? "저장 중..."
              : "수정 중..."
            : mode === "create"
              ? "항목 저장"
              : "수정 내용 저장"}
        </button>
      </div>
    </form>
  );
}
