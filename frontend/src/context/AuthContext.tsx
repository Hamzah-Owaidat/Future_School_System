"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AccountType } from "@/lib/permissions";

export interface AuthEmployee {
  id: number;
  employee_code?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role_id?: number;
  role_slug?: string;
  role_name?: string;
  role_description?: string;
  [key: string]: unknown;
}

export interface AuthStudent {
  id: number;
  student_code?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  class_id?: number | null;
  class_name?: string;
  class_code?: string;
  grade_level?: number;
  [key: string]: unknown;
}

export interface AuthSession {
  accountType: AccountType;
  permissions: string[];
  employee?: AuthEmployee;
  student?: AuthStudent;
}

const STORAGE_SESSION = "auth_session";
const STORAGE_USER_LEGACY = "user";
const STORAGE_PERMISSIONS = "permissions";

type AuthContextValue = {
  session: AuthSession | null;
  /** @deprecated Use session.employee or session.student */
  user: AuthEmployee | null;
  setSession: (session: AuthSession | null) => void;
  refreshFromStorage: () => void;
  clearSession: () => void;
  isReady: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function parseStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(STORAGE_SESSION);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as AuthSession;
      if (parsed?.accountType) {
        parsed.permissions = Array.isArray(parsed.permissions) ? parsed.permissions : [];
        return parsed;
      }
    } catch {
      /* fall through */
    }
  }

  const legacyUser = localStorage.getItem(STORAGE_USER_LEGACY);
  if (legacyUser) {
    try {
      const employee = JSON.parse(legacyUser) as AuthEmployee;
      const permsRaw = localStorage.getItem(STORAGE_PERMISSIONS);
      const permissions = permsRaw ? (JSON.parse(permsRaw) as string[]) : [];
      return {
        accountType: "employee",
        permissions: Array.isArray(permissions) ? permissions : [],
        employee,
      };
    } catch {
      return null;
    }
  }

  return null;
}

function persistSession(session: AuthSession | null) {
  if (typeof window === "undefined") return;

  if (!session) {
    localStorage.removeItem(STORAGE_SESSION);
    localStorage.removeItem(STORAGE_USER_LEGACY);
    localStorage.removeItem(STORAGE_PERMISSIONS);
    localStorage.removeItem("token");
    return;
  }

  localStorage.setItem(STORAGE_SESSION, JSON.stringify(session));
  localStorage.setItem(STORAGE_PERMISSIONS, JSON.stringify(session.permissions));

  if (session.accountType === "employee" && session.employee) {
    localStorage.setItem(STORAGE_USER_LEGACY, JSON.stringify(session.employee));
  } else {
    localStorage.removeItem(STORAGE_USER_LEGACY);
  }
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  const setSession = useCallback((next: AuthSession | null) => {
    setSessionState(next);
    persistSession(next);
  }, []);

  const refreshFromStorage = useCallback(() => {
    setSessionState(parseStoredSession());
  }, []);

  const clearSession = useCallback(() => {
    setSession(null);
  }, [setSession]);

  useEffect(() => {
    setSessionState(parseStoredSession());
    setIsReady(true);

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === STORAGE_SESSION ||
        event.key === STORAGE_USER_LEGACY ||
        event.key === "token"
      ) {
        refreshFromStorage();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [refreshFromStorage]);

  const value = useMemo(
    () => ({
      session,
      user: session?.employee ?? null,
      setSession,
      refreshFromStorage,
      clearSession,
      isReady,
    }),
    [session, setSession, refreshFromStorage, clearSession, isReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/** Build session object from login API response */
export function buildSessionFromLoginPayload(data: {
  account_type?: string;
  employee?: AuthEmployee;
  student?: AuthStudent;
  permissions?: string[];
}): AuthSession | null {
  const accountType = data.account_type as AccountType | undefined;
  if (accountType === "employee" && data.employee) {
    return {
      accountType: "employee",
      employee: data.employee,
      permissions: data.permissions ?? [],
    };
  }
  if (accountType === "student" && data.student) {
    return {
      accountType: "student",
      student: data.student,
      permissions: [],
    };
  }
  return null;
}

export function buildSessionFromMePayload(data: {
  account_type?: string;
  employee?: AuthEmployee;
  student?: AuthStudent;
  permissions?: string[];
}): AuthSession | null {
  return buildSessionFromLoginPayload(data);
}
