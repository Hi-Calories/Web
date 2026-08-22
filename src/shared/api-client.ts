const configuredApiBase = import.meta.env.VITE_API_URL?.trim();
export const API_BASE = (configuredApiBase || (import.meta.env.DEV ? "http://localhost:4000" : "")).replace(/\/$/, "");

if (!API_BASE) throw new Error("Thiếu VITE_API_URL cho bản production.");

const ACCESS_TOKEN_KEY = "hi_calo_admin_access_token";
const REFRESH_TOKEN_KEY = "hi_calo_admin_refresh_token";
const ADMIN_USER_KEY = "hi_calo_admin_user";

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: AdminUser;
}

let authListeners: Array<(user: AdminUser | null) => void> = [];

export function getStoredTokens(): { accessToken: string | null; refreshToken: string | null } {
  return {
    accessToken: sessionStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: sessionStorage.getItem(REFRESH_TOKEN_KEY),
  };
}

export function getStoredAdminUser(): AdminUser | null {
  const raw = sessionStorage.getItem(ADMIN_USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AdminUser>;
    if (!parsed.id || !parsed.email || !parsed.displayName || parsed.role !== "admin") return null;
    return parsed as AdminUser;
  } catch {
    return null;
  }
}

export function saveAuthTokens(tokens: AuthTokens) {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  sessionStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  sessionStorage.setItem(ADMIN_USER_KEY, JSON.stringify(tokens.user));
  notifyAuthChange(tokens.user);
}

export function clearAuthTokens() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_USER_KEY);
  notifyAuthChange(null);
}

export function subscribeAuth(listener: (user: AdminUser | null) => void) {
  authListeners.push(listener);
  return () => {
    authListeners = authListeners.filter((l) => l !== listener);
  };
}

function notifyAuthChange(user: AdminUser | null) {
  for (const listener of authListeners) {
    try {
      listener(user);
    } catch {
      // Ignore listener error
    }
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken } = getStoredTokens();
  if (!refreshToken) {
    clearAuthTokens();
    return null;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        clearAuthTokens();
        return null;
      }

      const data = await res.json();
      if (data.accessToken && data.refreshToken) {
        const currentUser = getStoredAdminUser() || { id: "", email: "", displayName: "Admin", role: "admin" };
        saveAuthTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user ? {
            id: String(data.user.id || data.user._id),
            email: data.user.email,
            displayName: data.user.displayName,
            role: data.user.role || "admin",
          } : currentUser,
        });
        return data.accessToken as string;
      }
      clearAuthTokens();
      return null;
    } catch {
      clearAuthTokens();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { accessToken } = getStoredTokens();
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && !path.startsWith("/auth/")) {
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      headers.set("Authorization", `Bearer ${newAccessToken}`);
      response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
      });
    } else {
      throw new ApiError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", 401);
    }
  }

  if (!response.ok) {
    let errorMessage = `Lỗi ${response.status}: ${response.statusText}`;
    let errorData: unknown = null;
    try {
      errorData = await response.json();
      if (typeof errorData === "object" && errorData !== null && "message" in errorData) {
        errorMessage = String((errorData as { message: unknown }).message);
      }
    } catch {
      // Response body wasn't JSON
    }
    throw new ApiError(errorMessage, response.status, errorData);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
}
