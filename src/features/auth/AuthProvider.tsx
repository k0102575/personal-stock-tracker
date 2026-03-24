import {
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { createContext, useContext } from "react";
import type { SessionInfo } from "../../shared/types";
import { api, ApiError } from "../../lib/api";
import { clearOfflineCache, saveOfflineCache } from "../../lib/offlineCache";

interface AuthContextValue {
  session: SessionInfo | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (password: string) => Promise<SessionInfo>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<SessionInfo | null>;
  loginError: string | null;
  loginPending: boolean;
  logoutPending: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        return await api.getMe();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          return null;
        }
        throw error;
      }
    }
  });

  const loginMutation = useMutation({
    mutationFn: api.login,
    onSuccess: (session) => {
      queryClient.setQueryData(["session"], session);
      saveOfflineCache("session", session);
    }
  });

  const logoutMutation = useMutation({
    mutationFn: api.logout,
    onSuccess: async () => {
      queryClient.setQueryData(["session"], null);
      clearOfflineCache();
      await queryClient.invalidateQueries();
    }
  });

  const value: AuthContextValue = {
    session: sessionQuery.data ?? null,
    loading: sessionQuery.isPending,
    isAuthenticated: Boolean(sessionQuery.data),
    login: async (password) => loginMutation.mutateAsync(password),
    logout: async () => logoutMutation.mutateAsync(),
    refreshSession: async () => {
      const result = await sessionQuery.refetch();
      return result.data ?? null;
    },
    loginError: loginMutation.error ? loginMutation.error.message : null,
    loginPending: loginMutation.isPending,
    logoutPending: logoutMutation.isPending
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
