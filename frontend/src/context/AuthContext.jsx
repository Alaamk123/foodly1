import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { fetchMe, loginUser, registerUser, TOKEN_KEY } from "../api/client";
import { getWeekStart } from "../utils/date";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(!!localStorage.getItem(TOKEN_KEY));
  // The week shown in the planner and grocery list (shared between both pages)
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart());

  // On page load: if a token is saved, ask the server who we are
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    fetchMe()
      .then((res) => setUser(res.user))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setAuthLoading(false));
  }, []);

  const saveSession = ({ token, user }) => {
    localStorage.setItem(TOKEN_KEY, token);
    setUser(user);
  };

  const login = useCallback(async (email, password) => saveSession(await loginUser({ email, password })), []);
  const register = useCallback(
    async (name, email, password) => saveSession(await registerUser({ name, email, password })),
    []
  );
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, authLoading, login, register, logout, currentWeekStart, setCurrentWeekStart }),
    [user, authLoading, login, register, logout, currentWeekStart]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
