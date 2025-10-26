"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadToken = useCallback(async () => {
    try {
      const token = Cookies.get("adminToken");
      const role = Cookies.get("adminRole");

      if (token && role) {
        setUserToken(token);
        setUserRole(role);
      }
    } catch (error) {
      console.error("Error loading token:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadToken();
  }, [loadToken]);

  const login = useCallback(async (token, role) => {
    try {
      // Set cookies with secure options
      Cookies.set("adminToken", token, {
        expires: 7, // 7 days
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      Cookies.set("adminRole", role, {
        expires: 7, // 7 days
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      setUserToken(token);
      setUserRole(role);
    } catch (error) {
      console.error("Error storing credentials:", error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      Cookies.remove("adminToken");
      Cookies.remove("adminRole");
      setUserToken(null);
      setUserRole(null);
      router.push("/login");
    } catch (error) {
      console.error("Error clearing credentials:", error);
    }
  }, [router]);

  const value = {
    userToken,
    userRole,
    login,
    logout,
    isLoading,
    isAuthenticated: !!userToken && userRole === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
