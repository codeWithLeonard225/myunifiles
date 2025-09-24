// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Stores logged-in user
  const [role, setRole] = useState(null); // "Student", "Admin", "CEO"

  // Optionally persist login using localStorage
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    const savedRole = localStorage.getItem("role");
    if (savedUser && savedRole) {
      setUser(savedUser);
      setRole(savedRole);
    }
  }, []);

  const login = (userData, userRole) => {
    setUser(userData);
    setRole(userRole);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("role", userRole);
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem("user");
    localStorage.removeItem("role");
  };

  return (
    <AuthContext.Provider value={{ user, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
