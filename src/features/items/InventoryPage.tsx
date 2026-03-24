import {
  keepPreviousData,
  useQuery
} from "@tanstack/react-query";
import { useDeferredValue, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { api, getErrorMessage } from "../../lib/api";
import { ITEM_CATEGORIES, ITEM_SORTS, ITEM_STATUSES } from "../../shared/constants";
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
          <h2>Browse your stash</h2>
          <span className="muted-text">Search before you buy again.</span>
        </div>

        <div className="stack-sm">
          <label className="field">
            <span className="field-label">Search</span>
            <input
              className="input"
              placeholder="Brand, item name, or note"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <div className="field-grid">
            <label className="field">
              <span className="field-label">Category</span>
              <select
                className="input"
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value as NonNullable<ItemListFilters["category"]>
                  )
                }
              >
                <option value="all">All</option>
                {ITEM_CATEGORIES.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field-label">Status</span>
              <select
                className="input"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as NonNullable<ItemListFilters["status"]>)
                }
              >
                <option value="all">All</option>
                {ITEM_STATUSES.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry.replace("_", " ")}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field-label">Expiry</span>
              <select
                className="input"
                value={expiry}
                onChange={(event) =>
                  setExpiry(event.target.value as NonNullable<ItemListFilters["expiry"]>)
                }
              >
                <option value="all">All</option>
                <option value="soon">Soon</option>
                <option value="expired">Expired</option>
              </select>
            </label>

            <label className="field">
              <span className="field-label">Sort</span>
              <select
                className="input"
                value={sort}
                onChange={(event) =>
                  setSort(event.target.value as NonNullable<ItemListFilters["sort"]>)
                }
              >
                {ITEM_SORTS.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry === "updated_desc"
                      ? "Recently updated"
                      : entry === "expiry_asc"
                        ? "Expiry soonest"
                        : "Name"}
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
            <span>Restock needed only</span>
          </label>
        </div>
      </section>

      {itemsQuery.isPending ? (
        <div className="panel">Loading inventory...</div>
      ) : itemsQuery.isError ? (
        <div className="panel inline-alert" role="alert">
          {getErrorMessage(itemsQuery.error)}
        </div>
      ) : itemsQuery.data.length === 0 ? (
        <EmptyState
          title="No items match these filters"
          description="Try clearing a filter or add a new product to track it here."
          actionLabel="Add new item"
          actionTo="/items/new"
        />
      ) : (
        <>
          <div className="section-heading">
            <h2>{itemsQuery.data.length} items</h2>
            <span className="muted-text">
              Cached for offline access after you open them once.
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
