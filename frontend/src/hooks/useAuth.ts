import { useState, useEffect } from "react";
import type { User } from "../types";

const AUTH_STORAGE_KEY = "vibe_demo_authenticated";
const USER_EMAIL_KEY = "vibe_demo_user_email";

const demoEmail =
  (import.meta.env.VITE_DEMO_EMAIL as string | undefined)?.toLowerCase().trim() ||
  "demo@example.com";
const demoPassword =
  (import.meta.env.VITE_DEMO_PASSWORD as string | undefined) || "demo";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const authStatus = localStorage.getItem(AUTH_STORAGE_KEY) === "true";
      const userEmail = localStorage.getItem(USER_EMAIL_KEY);

      if (authStatus && userEmail) {
        setUser({ id: 1, email: userEmail });
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = (email: string, password: string): boolean => {
    const normalizedEmail = email.toLowerCase().trim();
    if (
      normalizedEmail === demoEmail &&
      password === demoPassword
    ) {
      localStorage.setItem(AUTH_STORAGE_KEY, "true");
      localStorage.setItem(USER_EMAIL_KEY, normalizedEmail);
      setUser({ id: 1, email: normalizedEmail });
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(USER_EMAIL_KEY);
    setUser(null);
    setIsAuthenticated(false);
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
};
