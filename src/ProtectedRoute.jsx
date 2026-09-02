import { Navigate } from "react-router-dom";
import { RBACProvider } from "@corpcash/rbac-react";
import { useAuth } from "./AuthContext";

/**
 * Auth gate + RBACProvider bootstrap.
 *
 * Feeds the library permission-only mode with effective permissions from
 * GET /me/authorization. Frontend checks are UX only — the API still enforces.
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, authorization } = useAuth();

  if (loading) {
    return (
      <div className="auth-page">
        <p className="muted">Loading session…</p>
      </div>
    );
  }

  if (!isAuthenticated || !authorization?.subject) {
    return <Navigate to="/login" replace />;
  }

  return (
    <RBACProvider
      subject={authorization.subject}
      permissions={authorization.permissions ?? []}
    >
      {children}
    </RBACProvider>
  );
}
