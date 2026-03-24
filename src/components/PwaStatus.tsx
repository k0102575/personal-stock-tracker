import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

export function PwaStatus() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW();
  const [isOffline, setIsOffline] = useState(() =>
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );

  useEffect(() => {
    function handleOnline() {
      setIsOffline(false);
    }

    function handleOffline() {
      setIsOffline(true);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <>
      {isOffline && (
        <div className="floating-banner" role="status">
          Offline mode: cached screens and recent item data remain available.
        </div>
      )}

      {(offlineReady || needRefresh) && (
        <div className="update-toast" role="status">
          <div>
            <strong>{needRefresh ? "Update available" : "Offline ready"}</strong>
            <p>
              {needRefresh
                ? "A new version is available. Refresh to apply it."
                : "Core screens and recent API data are cached on this device."}
            </p>
          </div>
          <div className="update-toast__actions">
            {needRefresh ? (
              <button className="button button--primary" onClick={() => updateServiceWorker(true)}>
                Refresh
              </button>
            ) : null}
            <button
              className="button button--ghost"
              onClick={() => {
                setOfflineReady(false);
                setNeedRefresh(false);
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </>
  );
}
