"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

export type UserRole = "user" | "admin" | null;

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  role: UserRole;
  login: (username: string, password: string) => UserRole;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CREDENTIALS: Record<string, { password: string; role: UserRole }> = {
  user: { password: "password", role: "user" },
  admin: { password: "password", role: "admin" },
};

const AUTH_KEY = "wenav_auth";
const ROLE_KEY = "wenav_role";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedAuth = sessionStorage.getItem(AUTH_KEY);
    const storedRole = sessionStorage.getItem(ROLE_KEY) as UserRole;
    if (storedAuth === "true" && storedRole) {
      setIsLoggedIn(true);
      setRole(storedRole);
    }
    setIsLoading(false);
  }, []);

  const login = (username: string, password: string): UserRole => {
    const cred = CREDENTIALS[username];
    if (cred && cred.password === password) {
      sessionStorage.setItem(AUTH_KEY, "true");
      sessionStorage.setItem(ROLE_KEY, cred.role!);
      setIsLoggedIn(true);
      setRole(cred.role);
      return cred.role;
    }
    return null;
  };

  const logout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    setIsLoggedIn(false);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace("/login");
    }
  }, [isLoggedIn, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-wenav-purple border-t-transparent" />
      </div>
    );
  }

  if (!isLoggedIn) return null;
  return <>{children}</>;
}

export function AdminGuard({ children }: { children: ReactNode }) {
  const { isLoggedIn, isLoading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn) {
        router.replace("/login");
      } else if (role !== "admin") {
        router.replace("/dashboard");
      }
    }
  }, [isLoggedIn, isLoading, role, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-wenav-purple border-t-transparent" />
      </div>
    );
  }

  if (!isLoggedIn || role !== "admin") return null;
  return <>{children}</>;
}
