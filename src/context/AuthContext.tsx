import { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { LoginResponse } from "../types/auth";
import { cleanupSocketOnLogout } from "../utils/socket";
import {
  AppRole,
  AuthUser,
  clearStoredSession,
  emitAuthLogout,
  getStoredSession,
  onAuthLogout,
  persistSession,
} from "../utils/auth";

interface AuthContextType {
  user: AuthUser | null;
  role: AppRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isReady: boolean;
  driverLogin: (data: LoginResponse) => void;
  ownerLogin: (data: LoginResponse) => void;
  driverLogout: () => void;
  ownerLogout: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const clearAuthState = useCallback((logoutRole: AppRole | null = null) => {
    cleanupSocketOnLogout();
    clearStoredSession();
    setUser(null);
    setRole(null);
    setToken(null);
    emitAuthLogout(logoutRole);
  }, []);

  useEffect(() => {
    const session = getStoredSession();
    setUser(session.user);
    setRole(session.role);
    setToken(session.token);
    setIsReady(true);
  }, []);

  useEffect(() => {
    return onAuthLogout(() => {
      setUser(null);
      setRole(null);
      setToken(null);
    });
  }, []);

  const setSession = useCallback((nextRole: AppRole, data: LoginResponse) => {
    persistSession(nextRole, data);
    const { accessToken, ...rest } = data;
    setUser({ ...rest, role: nextRole });
    setRole(nextRole);
    setToken(accessToken);
  }, []);

  const driverLogin = useCallback((data: LoginResponse) => {
    setSession("driver", data);
  }, [setSession]);

  const ownerLogin = useCallback((data: LoginResponse) => {
    setSession("owner", data);
  }, [setSession]);

  const driverLogout = useCallback(() => {
    clearAuthState("driver");
  }, [clearAuthState]);

  const ownerLogout = useCallback(() => {
    clearAuthState("owner");
  }, [clearAuthState]);

  const logout = useCallback(() => {
    clearAuthState(role);
  }, [clearAuthState, role]);

  const value = useMemo(
    () => ({
      user,
      role,
      token,
      isAuthenticated: Boolean(token && role && user),
      isReady,
      driverLogin,
      ownerLogin,
      driverLogout,
      ownerLogout,
      logout,
    }),
    [driverLogin, driverLogout, isReady, logout, ownerLogin, ownerLogout, role, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
