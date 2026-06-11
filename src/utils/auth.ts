import { LoginResponse } from "../types/auth";

export type AppRole = "owner" | "driver";

export interface AuthUser extends Omit<LoginResponse, "accessToken" | "role"> {
  role: AppRole;
}

export interface StoredSession {
  role: AppRole | null;
  token: string | null;
  user: AuthUser | null;
}

const STORAGE_KEYS = {
  ownerToken: "ownerToken",
  driverToken: "driverToken",
  user: "user",
} as const;

const LOGOUT_EVENT = "fleetwise:auth-logout";

function isRole(value: unknown): value is AppRole {
  return value === "owner" || value === "driver";
}

export function getTokenStorageKey(role: AppRole) {
  return role === "owner" ? STORAGE_KEYS.ownerToken : STORAGE_KEYS.driverToken;
}

export function getStoredToken(role?: AppRole | null) {
  if (typeof window === "undefined") return null;

  if (role) {
    return localStorage.getItem(getTokenStorageKey(role));
  }

  return (
    localStorage.getItem(STORAGE_KEYS.ownerToken) ??
    localStorage.getItem(STORAGE_KEYS.driverToken)
  );
}

export function persistSession(role: AppRole, data: LoginResponse) {
  if (typeof window === "undefined") return;

  const { accessToken, ...rest } = data;
  const user: AuthUser = {
    ...rest,
    role,
  };

  localStorage.removeItem(STORAGE_KEYS.ownerToken);
  localStorage.removeItem(STORAGE_KEYS.driverToken);
  localStorage.setItem(getTokenStorageKey(role), accessToken);
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

export function clearStoredSession() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(STORAGE_KEYS.ownerToken);
  localStorage.removeItem(STORAGE_KEYS.driverToken);
  localStorage.removeItem(STORAGE_KEYS.user);
}

export function getStoredSession(): StoredSession {
  if (typeof window === "undefined") {
    return { role: null, token: null, user: null };
  }

  try {
    const token =
      localStorage.getItem(STORAGE_KEYS.ownerToken) ??
      localStorage.getItem(STORAGE_KEYS.driverToken);
    const role = localStorage.getItem(STORAGE_KEYS.ownerToken)
      ? "owner"
      : localStorage.getItem(STORAGE_KEYS.driverToken)
        ? "driver"
        : null;
    const rawUser = localStorage.getItem(STORAGE_KEYS.user);

    if (!token || !role || !rawUser) {
      return { role: null, token: null, user: null };
    }

    const user = JSON.parse(rawUser);
    if (!user || !isRole(user.role)) {
      clearStoredSession();
      return { role: null, token: null, user: null };
    }

    return { role, token, user };
  } catch {
    clearStoredSession();
    return { role: null, token: null, user: null };
  }
}

export function getLoginPath(role: AppRole | null) {
  return role === "owner" ? "/owner-login" : "/driver-login";
}

export function getHomePath(role: AppRole | null) {
  return role === "owner" ? "/owner-home" : role === "driver" ? "/driver-home" : "/";
}

export function emitAuthLogout(role: AppRole | null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(LOGOUT_EVENT, { detail: { role } }));
}

export function onAuthLogout(listener: (role: AppRole | null) => void) {
  if (typeof window === "undefined") return () => undefined;

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<{ role: AppRole | null }>;
    listener(customEvent.detail?.role ?? null);
  };

  window.addEventListener(LOGOUT_EVENT, handler);
  return () => window.removeEventListener(LOGOUT_EVENT, handler);
}
