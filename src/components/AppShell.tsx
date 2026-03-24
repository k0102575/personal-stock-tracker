import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";

const titleMap: Record<string, string> = {
  "/": "Dashboard",
  "/inventory": "Inventory",
  "/settings": "Settings"
};

export function AppShell() {
  const location = useLocation();
  const auth = useAuth();
  const title =
    titleMap[location.pathname] ??
    (location.pathname.endsWith("/edit")
      ? "Edit item"
      : location.pathname === "/items/new"
        ? "Add item"
        : location.pathname.startsWith("/items/")
          ? "Item detail"
          : "Vanity Stock");

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Vanity Stock</p>
          <h1>{title}</h1>
        </div>
        <div className="topbar-actions">
          {location.pathname === "/inventory" && (
            <Link className="button button--secondary" to="/items/new">
              Add item
            </Link>
          )}
          <button
            className="icon-button"
            type="button"
            aria-label="Log out"
            onClick={() => auth.logout()}
            disabled={auth.logoutPending}
          >
            Out
          </button>
        </div>
      </header>

      <main className="shell-content">
        <Outlet />
      </main>

      {location.pathname === "/inventory" && (
        <Link aria-label="Add item" className="fab" to="/items/new">
          +
        </Link>
      )}

      <nav className="bottom-nav" aria-label="Primary navigation">
        <NavLink className="bottom-nav__link" to="/" end>
          <span>Home</span>
        </NavLink>
        <NavLink className="bottom-nav__link" to="/inventory">
          <span>Inventory</span>
        </NavLink>
        <NavLink className="bottom-nav__link" to="/settings">
          <span>Settings</span>
        </NavLink>
      </nav>
    </div>
  );
}
