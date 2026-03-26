import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthProvider";
import { api, getErrorMessage } from "../../lib/api";
import { clearOfflineCache } from "../../lib/offlineCache";
import { formatDate } from "../../lib/inventory";

export function SettingsPage() {
  const auth = useAuth();
  const exportMutation = useMutation({
    mutationFn: api.exportItems
  });

  return (
    <div className="stack-lg">
      <section className="panel stack-md">
        <p className="eyebrow">세션</p>
        <h2>관리자 접근</h2>
        <p className="muted-text">
          현재 세션은 보안 쿠키 기반으로 유지되며, 만료 예정 시각은{" "}
          {auth.session ? formatDate(auth.session.expiresAt) : "확인 불가"}입니다.
        </p>
        <button
          className="button button--secondary"
          onClick={() => auth.logout()}
          type="button"
        >
          {auth.logoutPending ? "로그아웃 중..." : "로그아웃"}
        </button>
      </section>

      <section className="panel stack-md">
        <p className="eyebrow">오프라인 및 설치</p>
        <h2>PWA 관리</h2>
        <p className="muted-text">
          브라우저 메뉴에서 앱으로 설치할 수 있어요. 최근에 열어본 핵심 화면과 품목
          정보는 오프라인에서도 다시 확인할 수 있습니다.
        </p>
        <button
          className="button button--ghost"
          onClick={() => clearOfflineCache()}
          type="button"
        >
          저장된 오프라인 데이터 비우기
        </button>
      </section>

      <section className="panel stack-md">
        <p className="eyebrow">백업</p>
        <h2>보관함 내보내기</h2>
        <p className="muted-text">
          CSV 파일로 내려받아 백업하거나, 직접 분석하거나, 이후 가져오기에 활용할 수 있습니다.
        </p>
        <button
          className="button button--primary"
          disabled={exportMutation.isPending}
          onClick={() => exportMutation.mutate()}
          type="button"
        >
          {exportMutation.isPending ? "내보내기 준비 중..." : "CSV 다운로드"}
        </button>
        {exportMutation.isError && (
          <div className="inline-alert" role="alert">
            {getErrorMessage(exportMutation.error)}
          </div>
        )}
      </section>
    </div>
  );
}
