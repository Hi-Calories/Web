import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  clearAuthTokens,
  apiFetch,
  getStoredAdminUser,
  getStoredTokens,
  saveAuthTokens,
  subscribeAuth,
  type AdminUser,
  type AuthTokens,
} from "../shared/api-client";

interface AdminAuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (tokens: AuthTokens) => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(() => getStoredAdminUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { accessToken } = getStoredTokens();
    const currentUser = getStoredAdminUser();
    if (accessToken && currentUser?.role === "admin") {
      void apiFetch("/admin/dashboard")
        .then(() => setUser(currentUser))
        .catch(() => clearAuthTokens())
        .finally(() => setIsLoading(false));
    } else {
      clearAuthTokens();
      setIsLoading(false);
    }

    return subscribeAuth((nextUser) => {
      setUser(nextUser);
    });
  }, []);

  const login = (tokens: AuthTokens) => {
    if (tokens.user.role !== "admin") throw new Error("Tài khoản không có quyền quản trị.");
    saveAuthTokens(tokens);
    setUser(tokens.user);
  };

  const logout = () => {
    const { refreshToken } = getStoredTokens();
    if (refreshToken) {
      void apiFetch("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      }).catch((error: unknown) => {
        console.warn("Server logout failed; local session was still cleared.", error);
      });
    }
    clearAuthTokens();
    setUser(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
