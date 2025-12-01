import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

// Use Vite's env variable or default to localhost
const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export const AuthProvider = ({ children }) => {
  // Initialize from localStorage to persist login across refreshes
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });

  const login = (jwtToken, userData) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", jwtToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const refreshUser = async () => {
    if (!token) return null;
    try {
      const res = await fetch(`${BACKEND}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.error("refreshUser failed", res.status);
        return null;
      }
      const data = await res.json();
      setUser(data);
      localStorage.setItem("user", JSON.stringify(data));
      return data;
    } catch (err) {
      console.error("Error refreshing user:", err);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, setUser, setToken, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);