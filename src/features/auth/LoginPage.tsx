import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { getErrorMessage } from "../../lib/api";
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
      setFormError("Enter the admin password.");
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
        <p className="eyebrow">Personal care inventory</p>
        <h1>Know what you already own before you buy again.</h1>
        <p className="muted-text">
          Track skincare, perfumes, ointments, and other essentials with a single
          admin password and offline-ready mobile access.
        </p>

        <form className="stack-md" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">Admin password</span>
            <input
              className="input"
              autoComplete="current-password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
            />
          </label>

          {(formError || auth.loginError) && (
            <div className="inline-alert" role="alert">
              {formError || auth.loginError}
            </div>
          )}

          <button className="button button--primary button--full" disabled={auth.loginPending}>
            {auth.loginPending ? "Unlocking..." : "Unlock inventory"}
          </button>
        </form>
      </div>
    </div>
  );
}
