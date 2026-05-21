"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Initialize user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("pms_token");
    const storedUser = localStorage.getItem("pms_user");
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("pms_token");
        localStorage.removeItem("pms_user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    const { token, user: userData } = response.data;
    localStorage.setItem("pms_token", token);
    localStorage.setItem("pms_user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem("pms_token");
    localStorage.removeItem("pms_user");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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
