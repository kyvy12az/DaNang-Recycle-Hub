import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  loginWithGithub: () => void;
  completeGithubLogin: (code: string, callbackState?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_TOKEN_KEY = "admin_auth_token";
const OAUTH_STATE_KEY = "admin_github_oauth_state";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || "";

const getRedirectUri = () => `${window.location.origin}/login`;

const normalizeUser = (admin: Record<string, unknown>): User => ({
  id: String(admin.id),
  name: String(admin.name || "Admin"),
  email: String(admin.email || ""),
  avatar: admin.avatar ? String(admin.avatar) : null,
  role: String(admin.role || "admin"),
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(AUTH_TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = Boolean(token && user);

  useEffect(() => {
    const init = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/auth/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Phiên đăng nhập đã hết hạn");
        }

        const data = await response.json();
        setUser(normalizeUser(data.admin));
      } catch {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [token]);

  const loginWithGithub = useCallback(() => {
    if (!GITHUB_CLIENT_ID) {
      throw new Error("Thiếu VITE_GITHUB_CLIENT_ID trong frontend");
    }

    const state = crypto.randomUUID();
    localStorage.setItem(OAUTH_STATE_KEY, state);

    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: getRedirectUri(),
      scope: "read:user user:email",
      state,
      allow_signup: "false",
    });

    window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
  }, []);


  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(OAUTH_STATE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const completeGithubLogin = useCallback(async (code: string, callbackStateParam?: string) => {
    const storedState = localStorage.getItem(OAUTH_STATE_KEY);
    localStorage.removeItem(OAUTH_STATE_KEY);

    if (!callbackStateParam || callbackStateParam !== storedState) {
      throw new Error("Phiên làm việc đã hết hạn. Vui lòng thử lại.");
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/auth/github`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redirectUri: getRedirectUri() }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Đăng nhập thất bại");

      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(normalizeUser(data.admin));
    } catch (err) {
      logout();
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  const value = useMemo(
    () => ({
      isAuthenticated,
      user,
      isLoading,
      loginWithGithub,
      completeGithubLogin,
      logout,
    }),
    [isAuthenticated, user, isLoading, loginWithGithub, completeGithubLogin, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
