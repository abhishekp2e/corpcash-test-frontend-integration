import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, clearToken, getToken, setToken } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authorization, setAuthorization] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAuthorization = useCallback(async () => {
    const authz = await api.authorization();
    const roles = authz.subject?.roles ?? authz.roles ?? [];
    setUser({
      ...authz.user,
      role: roles[0] ?? authz.user?.role,
      roles,
    });
    setAuthorization(authz);
    return authz;
  }, []);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setAuthorization(null);
      setLoading(false);
      return;
    }
    try {
      await loadAuthorization();
    } catch {
      clearToken();
      setUser(null);
      setAuthorization(null);
    } finally {
      setLoading(false);
    }
  }, [loadAuthorization]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (username, password) => {
      const data = await api.login({ username, password });
      setToken(data.token);
      await loadAuthorization();
      return data.user;
    },
    [loadAuthorization],
  );

  const register = useCallback(
    async (username, password, role) => {
      const data = await api.register({ username, password, role });
      setToken(data.token);
      await loadAuthorization();
      return data.user;
    },
    [loadAuthorization],
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setAuthorization(null);
  }, []);

  // Permission checks for UI live in @corpcash/rbac-react (useCan / Can / RequireRole)
  // after ProtectedRoute mounts RBACProvider with subject + permissions.

  const value = useMemo(
    () => ({
      user,
      authorization,
      subject: authorization?.subject ?? null,
      capabilities: authorization?.capabilities ?? {},
      permissions: authorization?.permissions ?? [],
      loading,
      isAuthenticated: Boolean(getToken() && user),
      login,
      register,
      logout,
      refreshAuthorization: loadAuthorization,
    }),
    [user, authorization, loading, login, register, logout, loadAuthorization],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
