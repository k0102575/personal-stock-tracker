import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import { APP_NAME } from "../shared/labels";

const titleMap: Record<string, string> = {
  "/": "대시보드",
  "/inventory": "보관함",
  "/settings": "설정"
};

const descriptionMap: Record<string, string> = {
  "/": "지금 확인이 필요한 생활용품과 소모품을 한눈에 살펴보세요.",
  "/inventory": "카테고리와 상태별로 재고를 빠르게 찾을 수 있어요.",
  "/settings": "백업, 오프라인 데이터, 세션 상태를 관리합니다."
};

export function AppShell() {
  const location = useLocation();
  const auth = useAuth();
  const title =
    titleMap[location.pathname] ??
    (location.pathname.endsWith("/edit")
      ? "항목 수정"
      : location.pathname === "/items/new"
        ? "항목 추가"
        : location.pathname.startsWith("/items/")
          ? "항목 상세"
          : APP_NAME);
  const description =
    descriptionMap[location.pathname] ??
    (location.pathname.endsWith("/edit")
      ? "기록을 업데이트해서 최신 재고 상태를 반영하세요."
        : location.pathname === "/items/new"
          ? "새 제품 정보를 입력하고 재고 추적을 시작하세요."
        : location.pathname.startsWith("/items/")
          ? "수량, 기한, 메모를 자세히 확인할 수 있어요."
          : "자주 쓰는 물건과 소모품 재고를 한곳에서 정돈해서 관리하세요.");

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-copy">
          <p className="eyebrow">{APP_NAME}</p>
          <h1>{title}</h1>
          <p className="page-description">{description}</p>
        </div>
        <div className="topbar-actions">
          {location.pathname === "/inventory" && (
            <Link className="button button--secondary" to="/items/new">
              항목 추가
            </Link>
          )}
          <button
            className="button button--ghost"
            type="button"
            aria-label="로그아웃"
            onClick={() => auth.logout()}
            disabled={auth.logoutPending}
          >
            {auth.logoutPending ? "로그아웃 중..." : "로그아웃"}
          </button>
        </div>
      </header>

      <main className="shell-content">
        <Outlet />
      </main>

      {location.pathname === "/inventory" && (
        <Link aria-label="새 항목 추가" className="fab" to="/items/new">
          +
        </Link>
      )}

      <nav className="bottom-nav" aria-label="주요 메뉴">
        <NavLink className="bottom-nav__link" to="/" end>
          <span>대시보드</span>
        </NavLink>
        <NavLink className="bottom-nav__link" to="/inventory">
          <span>보관함</span>
        </NavLink>
        <NavLink className="bottom-nav__link" to="/settings">
          <span>설정</span>
        </NavLink>
      </nav>
    </div>
  );
}
