import {
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, getErrorMessage } from "../../lib/api";
import { formatDate, getInventorySignals, getItemSubtitle, getMinimumLabel, getQuantityLabel } from "../../lib/inventory";

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
    return <div className="panel">Loading item...</div>;
  }

  if (itemQuery.isError) {
    return (
      <div className="panel inline-alert" role="alert">
        {getErrorMessage(itemQuery.error)}
      </div>
    );
  }

  const item = itemQuery.data;
  const signals = getInventorySignals(item);

  return (
    <div className="stack-lg">
      <section className="detail-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{item.category}</p>
            <h2>{item.name}</h2>
            <p className="muted-text">{getItemSubtitle(item)}</p>
          </div>
          <span className="status-pill">{item.status.replace("_", " ")}</span>
        </div>

        <div className="badge-row">
          {signals.lowStock && <span className="badge badge--warning">Low stock</span>}
          {signals.expired && <span className="badge badge--danger">Expired</span>}
          {!signals.expired && signals.expiringSoon && (
            <span className="badge badge--neutral">Expiry soon</span>
          )}
        </div>

        <dl className="meta-grid">
          <div>
            <dt>Current quantity</dt>
            <dd>{getQuantityLabel(item)}</dd>
          </div>
          <div>
            <dt>Minimum quantity</dt>
            <dd>{getMinimumLabel(item)}</dd>
          </div>
          <div>
            <dt>Purchased from</dt>
            <dd>{item.purchaseSource || "Not set"}</dd>
          </div>
          <div>
            <dt>Purchase date</dt>
            <dd>{formatDate(item.purchaseDate)}</dd>
          </div>
          <div>
            <dt>Opened date</dt>
            <dd>{formatDate(item.openedDate)}</dd>
          </div>
          <div>
            <dt>Expiry date</dt>
            <dd>{formatDate(item.expiryDate)}</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{formatDate(item.createdAt)}</dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd>{formatDate(item.updatedAt)}</dd>
          </div>
        </dl>

        <div className="stack-sm">
          <h3>Notes</h3>
          <p className="note-box">{item.memo || "No notes saved."}</p>
        </div>
      </section>

      <div className="sticky-action-bar">
        <Link className="button button--secondary" to={`/items/${item.id}/edit`}>
          Edit
        </Link>
        <button
          className="button button--danger"
          disabled={deleteMutation.isPending}
          onClick={() => {
            if (window.confirm(`Delete "${item.name}" from your inventory?`)) {
              deleteMutation.mutate();
            }
          }}
          type="button"
        >
          {deleteMutation.isPending ? "Deleting..." : "Delete"}
        </button>
      </div>

      {deleteMutation.isError && (
        <div className="panel inline-alert" role="alert">
          {getErrorMessage(deleteMutation.error)}
        </div>
      )}
    </div>
  );
}
