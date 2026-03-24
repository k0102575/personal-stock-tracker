import {
  QueryClient,
  QueryClientProvider
} from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { PwaStatus } from "./components/PwaStatus";
import { AuthProvider } from "./features/auth/AuthProvider";
import { LoginPage } from "./features/auth/LoginPage";
import { RequireAuth } from "./features/auth/RequireAuth";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { InventoryPage } from "./features/items/InventoryPage";
import { ItemDetailPage } from "./features/items/ItemDetailPage";
import { ItemFormPage } from "./features/items/ItemFormPage";
import { SettingsPage } from "./features/settings/SettingsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry(failureCount, error) {
        if (typeof error === "object" && error && "status" in error) {
          const status = Number(error.status);
          if (status >= 400 && status < 500 && status !== 408) {
            return false;
          }
        }
        return failureCount < 2;
      }
    }
  }
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <PwaStatus />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <RequireAuth>
                  <AppShell />
                </RequireAuth>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/items/new" element={<ItemFormPage mode="create" />} />
              <Route path="/items/:id" element={<ItemDetailPage />} />
              <Route path="/items/:id/edit" element={<ItemFormPage mode="edit" />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
