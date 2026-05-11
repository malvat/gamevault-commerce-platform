import React, { createContext, useContext, useMemo, useState } from "react";
import { apiRequest } from "../services/api.js";
import { readStorage, removeStorage, writeStorage } from "../utils/storage.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readStorage("gameStoreUser", null));

  const saveUser = (nextUser) => {
    setUser(nextUser);
    writeStorage("gameStoreUser", nextUser);
  };

  const login = async (credentials) => {
    const nextUser = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials)
    });
    saveUser(nextUser);
  };

  const register = async (payload) => {
    const nextUser = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    saveUser(nextUser);
  };

  const updateProfile = async (payload) => {
    const nextUser = await apiRequest("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    saveUser(nextUser);
  };

  const logout = () => {
    setUser(null);
    removeStorage("gameStoreUser");
  };

  const value = useMemo(() => ({ user, login, register, updateProfile, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
