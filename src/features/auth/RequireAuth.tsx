import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { APP_NAME } from "../../shared/labels";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const auth = useAuth();

  if (auth.loading) {
    return (
      <div className="auth-shell">
        <div className="auth-card auth-card--compact">
          <p className="eyebrow">{APP_NAME}</p>
          <h1>세션을 확인하고 있어요</h1>
          <p className="muted-text">안전하게 저장된 로그인 상태를 불러오는 중입니다.</p>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
