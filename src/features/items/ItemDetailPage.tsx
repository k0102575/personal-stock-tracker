import {
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, getErrorMessage } from "../../lib/api";
import { formatDate, getInventorySignals, getItemSubtitle, getMinimumLabel, getQuantityLabel } from "../../lib/inventory";
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
    return <div className="panel">품목 정보를 불러오는 중입니다...</div>;
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
            <p className="eyebrow">{getCategoryLabel(item.category)}</p>
            <h2>{item.name}</h2>
            <p className="muted-text">{getItemSubtitle(item)}</p>
          </div>
          <span className="status-pill">{getStatusLabel(item.status)}</span>
        </div>

        <div className="badge-row">
          {signals.lowStock && <span className="badge badge--warning">재고 부족</span>}
          {signals.expired && <span className="badge badge--danger">우선 유통기한 경과</span>}
          {!signals.expired && signals.expiringSoon && (
            <span className="badge badge--neutral">우선 유통기한 임박</span>
          )}
        </div>

        <dl className="meta-grid">
          <div>
            <dt>현재 수량</dt>
            <dd>{getQuantityLabel(item)}</dd>
          </div>
          <div>
            <dt>기준 수량</dt>
            <dd>{getMinimumLabel(item)}</dd>
          </div>
          <div>
            <dt>우선 유통기한</dt>
            <dd>{formatDate(item.expiryDate)}</dd>
          </div>
          <div>
            <dt>생성일</dt>
            <dd>{formatDate(item.createdAt)}</dd>
          </div>
          <div>
            <dt>수정일</dt>
            <dd>{formatDate(item.updatedAt)}</dd>
          </div>
        </dl>

        <div className="stack-sm">
          <h3>메모</h3>
          <p className="note-box">{item.memo || "저장된 메모가 없습니다."}</p>
        </div>
      </section>

      <div className="sticky-action-bar">
        <Link className="button button--secondary" to={`/items/${item.id}/edit`}>
          수정
        </Link>
        <button
          className="button button--danger"
          disabled={deleteMutation.isPending}
          onClick={() => {
            if (window.confirm(`"${item.name}" 항목을 보관함에서 삭제할까요?`)) {
              deleteMutation.mutate();
            }
          }}
          type="button"
        >
          {deleteMutation.isPending ? "삭제 중..." : "삭제"}
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
