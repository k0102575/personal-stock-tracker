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
      mode === "create" ? api.createItem(form) : api.updateItem(id, form),
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
    return <div className="panel">Loading item...</div>;
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
      updateField(key, Number(event.target.value));
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      setValidationError("Name is required.");
      return;
    }

    if (form.currentQuantity < 0 || form.minimumQuantity < 0) {
      setValidationError("Quantity values must be non-negative.");
      return;
    }

    setValidationError(null);
    mutation.mutate();
  }

  return (
    <form className="stack-lg" onSubmit={handleSubmit}>
      <section className="panel stack-md">
        <div className="section-heading">
          <h2>{mode === "create" ? "Add item" : "Edit item"}</h2>
          {mode === "edit" ? (
            <Link className="text-link" to={`/items/${id}`}>
              Cancel
            </Link>
          ) : null}
        </div>

        <div className="field-grid">
          <label className="field">
            <span className="field-label">Category</span>
            <select
              className="input"
              value={form.category}
              onChange={(event) => updateField("category", event.target.value as InventoryItemInput["category"])}
            >
              {ITEM_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field-label">Status</span>
            <select
              className="input"
              value={form.status}
              onChange={(event) => updateField("status", event.target.value as InventoryItemInput["status"])}
            >
              {ITEM_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>

          <label className="field field--full">
            <span className="field-label">Name</span>
            <input
              className="input"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Cica cream, hand balm, perfume..."
            />
          </label>

          <label className="field">
            <span className="field-label">Brand</span>
            <input
              className="input"
              value={form.brand}
              onChange={(event) => updateField("brand", event.target.value)}
              placeholder="La Roche-Posay"
            />
          </label>

          <label className="field">
            <span className="field-label">Volume / unit</span>
            <input
              className="input"
              value={form.volumeOrUnit}
              onChange={(event) => updateField("volumeOrUnit", event.target.value)}
              placeholder="50 ml / 1 tube"
            />
          </label>

          <label className="field">
            <span className="field-label">Current quantity</span>
            <input
              className="input"
              min="0"
              step="0.1"
              type="number"
              value={form.currentQuantity}
              onChange={handleNumberChange("currentQuantity")}
            />
          </label>

          <label className="field">
            <span className="field-label">Minimum quantity</span>
            <input
              className="input"
              min="0"
              step="0.1"
              type="number"
              value={form.minimumQuantity}
              onChange={handleNumberChange("minimumQuantity")}
            />
          </label>

          <label className="field field--full">
            <span className="field-label">Purchase source</span>
            <input
              className="input"
              value={form.purchaseSource}
              onChange={(event) => updateField("purchaseSource", event.target.value)}
              placeholder="Olive Young, pharmacy, online"
            />
          </label>

          <label className="field">
            <span className="field-label">Purchase date</span>
            <input
              className="input"
              type="date"
              value={form.purchaseDate ?? ""}
              onChange={(event) => updateField("purchaseDate", event.target.value || null)}
            />
          </label>

          <label className="field">
            <span className="field-label">Opened date</span>
            <input
              className="input"
              type="date"
              value={form.openedDate ?? ""}
              onChange={(event) => updateField("openedDate", event.target.value || null)}
            />
          </label>

          <label className="field field--full">
            <span className="field-label">Expiry date</span>
            <input
              className="input"
              type="date"
              value={form.expiryDate ?? ""}
              onChange={(event) => updateField("expiryDate", event.target.value || null)}
            />
          </label>

          <label className="field field--full">
            <span className="field-label">Memo</span>
            <textarea
              className="input textarea"
              rows={5}
              value={form.memo}
              onChange={(event) => updateField("memo", event.target.value)}
              placeholder="Skin reaction notes, seasonal usage, backup location..."
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
          Cancel
        </Link>
        <button className="button button--primary" disabled={mutation.isPending} type="submit">
          {mutation.isPending
            ? mode === "create"
              ? "Saving..."
              : "Updating..."
            : mode === "create"
              ? "Save item"
              : "Update item"}
        </button>
      </div>
    </form>
  );
}
