"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AuthUser = {
  id: number;
  full_name: string;
  email: string;
  role: "customer" | "owner" | "admin" | string;
  is_active: boolean;
};

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  isOwner: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem("tablekeeper_access_token");
      localStorage.removeItem("tablekeeper_user");
    } catch {
      // Ignore storage errors in restricted contexts
    }
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    try {
      localStorage.setItem("tablekeeper_access_token", newToken);
      localStorage.setItem("tablekeeper_user", JSON.stringify(newUser));
    } catch {
      // Ignore storage errors
    }
    setToken(newToken);
    setUser(newUser);
  }, []);

  const refreshUser = useCallback(async () => {
    const savedToken = typeof window !== "undefined"
      ? localStorage.getItem("tablekeeper_access_token")
      : null;

    if (!savedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      });

      if (response.ok) {
        const freshUser: AuthUser = await response.json();
        setUser(freshUser);
        setToken(savedToken);
        try {
          localStorage.setItem("tablekeeper_user", JSON.stringify(freshUser));
        } catch {}
      } else if (response.status === 401 || response.status === 403) {
        logout();
      }
    } catch (err) {
      // Fallback to cached user if offline
      const cached = localStorage.getItem("tablekeeper_user");
      if (cached) {
        try {
          setUser(JSON.parse(cached));
          setToken(savedToken);
        } catch {}
      }
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const isOwner = useMemo(() => {
    return user?.role === "owner" || user?.role === "admin";
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      token,
      isOwner,
      isAuthenticated: !!token && !!user,
      isLoading,
      login,
      logout,
      refreshUser,
    }),
    [user, token, isOwner, isLoading, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
