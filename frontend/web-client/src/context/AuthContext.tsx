/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getProfile, loginUser } from "../api/authApi";
import type { LoginPayload, LoginResponse, UserProfile } from "../types/auth";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<LoginResponse>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "smart_healthcare_token";
const USER_KEY = "smart_healthcare_user";

function getStoredUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY)
  );
  const [user, setUser] = useState<UserProfile | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState<boolean>(() =>
    !!localStorage.getItem(TOKEN_KEY)
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setIsLoading(false);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) return;

    const profile = await getProfile(token);
    setUser(profile);
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
  }, [token]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      setIsLoading(true);

      try {
        const result = await loginUser({
          email: payload.email.trim(),
          password: payload.password,
        });

        setToken(result.accessToken);
        setUser(result.user);
        localStorage.setItem(TOKEN_KEY, result.accessToken);
        localStorage.setItem(USER_KEY, JSON.stringify(result.user));

        return result;
      } catch (error) {
        logout();
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [logout]
  );

  useEffect(() => {
    let isMounted = true;

    async function bootstrapAuth() {
      if (!token) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      if (isMounted) {
        setIsLoading(true);
      }

      try {
        await refreshProfile();
      } catch {
        if (isMounted) {
          logout();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, [token, refreshProfile, logout]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!token && !!user,
      isLoading,
      login,
      logout,
      refreshProfile,
    }),
    [user, token, isLoading, login, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}