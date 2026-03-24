import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const auth = useAuth();

  if (auth.loading) {
    return (
      <div className="auth-shell">
        <div className="auth-card auth-card--compact">
          <p className="eyebrow">Vanity Stock</p>
          <h1>Checking your session</h1>
          <p className="muted-text">Restoring secure access to your inventory.</p>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
