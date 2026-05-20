"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// Shape of the authenticated employee we care about
export interface AuthUser {
  id: number;
  employee_code?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role_id?: number;
  role_name?: string;
  role_description?: string;
  [key: string]: any;
}

type AuthContextValue = {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  refreshFromStorage: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  const readUserFromStorage = () => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed || null);
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    // Initial load
    readUserFromStorage();

    // Sync across tabs
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "user" || event.key === "token") {
        readUserFromStorage();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorage);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorage);
      }
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      refreshFromStorage: readUserFromStorage,
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


