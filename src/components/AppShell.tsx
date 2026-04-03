import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Archive,
  Home,
  LogOut,
  Plus,
  Settings,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const navItems = [
    { to: "/", label: "대시보드", icon: Home },
    { to: "/inventory", label: "보관함", icon: Archive },
    { to: "/settings", label: "설정", icon: Settings }
  ];

  return (
    <div className="page-shell">
      <header className="sticky top-4 z-40">
        <div className="glass-panel rounded-[2rem] px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-full bg-primary-container text-primary">
                  <Sparkles className="size-5" />
                </div>
                <div className="space-y-1">
                  <p className="eyebrow">{APP_NAME}</p>
                  <p className="text-sm text-muted-foreground">차분한 재고 정리 루틴</p>
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-[2.75rem]">
                  {title}
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-[15px]">
                  {description}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {location.pathname === "/inventory" && (
                <Button asChild variant="secondary">
                  <Link to="/items/new">
                    <Plus className="size-4" />
                    항목 추가
                  </Link>
                </Button>
              )}
              <Button
                variant="ghost"
                type="button"
                aria-label="로그아웃"
                onClick={() => auth.logout()}
                disabled={auth.logoutPending}
              >
                <LogOut className="size-4" />
                {auth.logoutPending ? "로그아웃 중..." : "로그아웃"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mt-6">
        <Outlet />
      </main>

      {location.pathname === "/inventory" && (
        <Button
          asChild
          size="icon"
          className="fixed bottom-28 right-5 z-40 size-14 shadow-[var(--shadow-soft)] sm:right-8"
          aria-label="새 항목 추가"
        >
          <Link to="/items/new">
            <Plus className="size-6" />
          </Link>
        </Button>
      )}

      <nav
        className="glass-panel fixed bottom-5 left-1/2 z-40 flex w-[min(calc(100%-1rem),44rem)] -translate-x-1/2 items-center justify-between rounded-full p-2"
        aria-label="주요 메뉴"
      >
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              className={({ isActive }) =>
                [
                  "flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(47,52,48,0.1)]"
                    : "text-muted-foreground hover:bg-surface-container-low"
                ].join(" ")
              }
              to={item.to}
              end={item.to === "/"}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
