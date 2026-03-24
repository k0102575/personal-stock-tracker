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
        <p className="eyebrow">Session</p>
        <h2>Admin access</h2>
        <p className="muted-text">
          Auth uses one Worker secret and a secure cookie-backed session. Current session
          expires on {auth.session ? formatDate(auth.session.expiresAt) : "unknown"}.
        </p>
        <button
          className="button button--secondary"
          onClick={() => auth.logout()}
          type="button"
        >
          {auth.logoutPending ? "Logging out..." : "Log out"}
        </button>
      </section>

      <section className="panel stack-md">
        <p className="eyebrow">Offline & install</p>
        <h2>PWA controls</h2>
        <p className="muted-text">
          Install the app from your browser menu. Core screens are cached, and recent item
          responses remain available offline when they were viewed before.
        </p>
        <button
          className="button button--ghost"
          onClick={() => clearOfflineCache()}
          type="button"
        >
          Clear saved offline data
        </button>
      </section>

      <section className="panel stack-md">
        <p className="eyebrow">Backup</p>
        <h2>Export inventory</h2>
        <p className="muted-text">
          Download a CSV snapshot for backup, manual analysis, or future imports.
        </p>
        <button
          className="button button--primary"
          disabled={exportMutation.isPending}
          onClick={() => exportMutation.mutate()}
          type="button"
        >
          {exportMutation.isPending ? "Preparing export..." : "Download CSV export"}
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
