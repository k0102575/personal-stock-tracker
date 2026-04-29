import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Archive, Home, LogOut, Plus, Settings, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../features/auth/AuthProvider';
import { APP_NAME } from '../shared/labels';

export function AppShell() {
  const location = useLocation();
  const auth = useAuth();
  const navItems = [
    { to: '/', label: '대시보드', icon: Home },
    { to: '/inventory', label: '보관함', icon: Archive },
    { to: '/settings', label: '설정', icon: Settings },
  ];

  return (
    <div className="page-shell">
      <header className="sticky top-0 z-30 -mx-4 border-b border-outline-variant bg-white sm:-mx-6 lg:-mx-12">
        <div className="px-3 py-1.5 sm:hidden">
          <div className="flex flex-col gap-1.5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-full bg-[#111111] text-white">
                  <Sparkles className="size-3.5" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {APP_NAME}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-1 self-end">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                aria-label="로그아웃"
                onClick={() => auth.logout()}
                disabled={auth.logoutPending}
                className="px-2.5"
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="hidden h-[60px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-6 sm:grid lg:px-12">
          <Link
            className="flex min-w-0 items-center gap-3 justify-self-start text-[16px] font-medium text-foreground transition-colors hover:text-muted-foreground"
            to="/"
          >
            <Sparkles className="size-6" />
            <span className="truncate">{APP_NAME}</span>
          </Link>

          <nav className="flex items-center gap-8 justify-self-center" aria-label="데스크톱 주요 메뉴">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                className={({ isActive }) =>
                  [
                    'text-[16px] font-medium transition-colors hover:text-muted-foreground',
                    isActive ? 'text-foreground' : 'text-muted-foreground',
                  ].join(' ')
                }
                to={item.to}
                end={item.to === '/'}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex min-w-0 items-center justify-end gap-2 justify-self-end">
            <div className="flex w-[6.75rem] justify-end">
              {location.pathname === '/inventory' && (
                <Button asChild size="sm" className="w-full justify-center">
                  <Link to="/items/new">
                    <Plus className="size-4" />
                    항목 추가
                  </Link>
                </Button>
              )}
            </div>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              aria-label="로그아웃"
              onClick={() => auth.logout()}
              disabled={auth.logoutPending}
              className="min-w-[7.5rem] justify-center"
            >
              <LogOut className="size-4" />
              {auth.logoutPending ? '로그아웃 중...' : '로그아웃'}
            </Button>
          </div>
        </div>
      </header>

      <main className="mt-4 sm:mt-8">
        <Outlet />
      </main>

      {location.pathname === '/inventory' && (
        <Button
          asChild
          size="icon"
          className="fixed bottom-24 right-4 z-40 size-12 border border-white bg-[#111111] text-white sm:bottom-28 sm:right-8 sm:size-14"
          aria-label="새 항목 추가"
        >
          <Link to="/items/new">
            <Plus className="size-5 sm:size-6" />
          </Link>
        </Button>
      )}

      <nav
        className="glass-panel fixed bottom-4 left-1/2 z-40 flex w-[min(calc(100%-0.75rem),44rem)] -translate-x-1/2 items-center justify-between rounded-full border border-outline-variant bg-white p-1.5 sm:hidden"
        aria-label="주요 메뉴"
      >
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              className={({ isActive }) =>
                [
                  'flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-[13px] font-semibold transition-colors sm:gap-2 sm:px-4 sm:py-3 sm:text-sm',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-surface-container',
                ].join(' ')
              }
              to={item.to}
              end={item.to === '/'}
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
