import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { api, setAccessToken } from '@/lib/api';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl?: string | null;
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan?: string;
  };
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

interface RegisterData {
  companyName: string;
  slug: string;
  email: string;
  password: string;
  fullName: string;
}

interface AuthResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    user: { id: string; email: string; fullName: string; role: string };
    tenant: { id: string; name: string; slug: string };
  };
}

interface MeResponse {
  success: boolean;
  data: User;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const fetchUser = useCallback(async () => {
    try {
      const res = await api<MeResponse>('/auth/me');
      setState({ user: res.data, isLoading: false, isAuthenticated: true });
    } catch {
      setAccessToken(null);
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  // On mount, try to restore session via refresh token (httpOnly cookie)
  useEffect(() => {
    const tryRestore = async () => {
      try {
        const res = await api<{ data: { accessToken: string } }>('/auth/refresh', {
          method: 'POST',
          body: {},
        });
        setAccessToken(res.data.accessToken);
        await fetchUser();
      } catch {
        setState({ user: null, isLoading: false, isAuthenticated: false });
      }
    };
    tryRestore();
  }, [fetchUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    setAccessToken(res.data.accessToken);
    // Store refresh token for logout
    sessionStorage.setItem('refreshToken', res.data.refreshToken);
    setState({
      user: { ...res.data.user, tenant: res.data.tenant },
      isLoading: false,
      isAuthenticated: true,
    });
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const res = await api<AuthResponse>('/auth/register', {
      method: 'POST',
      body: data,
    });
    setAccessToken(res.data.accessToken);
    sessionStorage.setItem('refreshToken', res.data.refreshToken);
    setState({
      user: { ...res.data.user, tenant: res.data.tenant },
      isLoading: false,
      isAuthenticated: true,
    });
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = sessionStorage.getItem('refreshToken');
    try {
      await api('/auth/logout', {
        method: 'POST',
        body: { refreshToken },
      });
    } catch {
      // Ignore logout errors
    }
    setAccessToken(null);
    sessionStorage.removeItem('refreshToken');
    setState({ user: null, isLoading: false, isAuthenticated: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
