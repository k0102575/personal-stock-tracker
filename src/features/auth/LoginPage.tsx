import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { getErrorMessage } from "../../lib/api";
import { APP_NAME } from "../../shared/labels";
import { useAuth } from "./AuthProvider";

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  if (auth.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!password.trim()) {
      setFormError("관리자 비밀번호를 입력해주세요.");
      return;
    }

    setFormError(null);

    try {
      await auth.login(password);
      const destination = (location.state as { from?: { pathname?: string } } | null)?.from
        ?.pathname;
      navigate(destination || "/", { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">{APP_NAME}</p>
        <h1>사기 전에, 지금 있는 재고부터 확인하세요.</h1>
        <p className="muted-text">
          생활용품과 소모품 재고를 간단하게 기록하고, 모바일에서도 이어서 확인할 수 있습니다.
        </p>

        <form className="stack-md" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">관리자 비밀번호</span>
            <input
              className="input"
              autoComplete="current-password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호를 입력하세요"
            />
          </label>

          {(formError || auth.loginError) && (
            <div className="inline-alert" role="alert">
              {formError || auth.loginError}
            </div>
          )}

          <button className="button button--primary button--full" disabled={auth.loginPending}>
            {auth.loginPending ? "잠금 해제 중..." : "보관함 열기"}
          </button>
        </form>
      </div>
    </div>
  );
}
