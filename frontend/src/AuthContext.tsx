import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { AuthUser, LoginCredentials, AuthState } from './types';

// ── Storage keys ──────────────────────────────────────────────────────────────
const TOKEN_KEY = 'meditrack_token';
const USER_KEY  = 'meditrack_user';

// ── Context shape ─────────────────────────────────────────────────────────────
interface AuthCtx extends AuthState {
  login:  (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({
  token:         null,
  user:          null,
  isAuthenticated: false,
  isLoading:     true,
  login:  async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token,     setToken]     = useState<string | null>(null);
  const [user,      setUser]      = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate session from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser  = localStorage.getItem(USER_KEY);
      if (storedToken && storedUser) {
        // Basic expiry check by decoding the JWT payload (no crypto verification)
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        if (payload.exp && payload.exp * 1000 > Date.now()) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } else {
          // Token expired — clear storage
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async ({ email, password }: LoginCredentials) => {
    const res = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed. Please try again.');
    }

    const { token: newToken, user: newUser } = data as { token: string; user: AuthUser };
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY,  JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    // Best-effort server-side logout (fire-and-forget)
    if (token) {
      fetch('/api/auth/logout', {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, [token]);

  const value: AuthCtx = {
    token,
    user,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
