import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

export function PwaStatus() {
  useRegisterSW();
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
          오프라인 상태예요. 최근에 본 화면과 품목 정보는 계속 확인할 수 있습니다.
        </div>
      )}
    </>
  );
}
