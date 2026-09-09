import { RequireRole as RbacRequireRole } from "@corpcash/rbac-react";
import { useAuth } from "./AuthContext";
import AccessDeniedPage from "./pages/AccessDeniedPage";

/**
 * Role page gate using @corpcash/rbac-react RequireRole + Access Denied UX.
 *
 * In permission-only mode, useRole checks the subject's own roles (no client-side
 * inheritance graph), so a developer is denied on /roles/manager and /roles/viewer.
 */
export function RequireRole({ requiredRole, children }) {
  const { user, subject } = useAuth();
  const currentRole =
    subject?.roles?.join(", ") || user?.roles?.join(", ") || user?.role;

  return (
    <RbacRequireRole
      role={requiredRole}
      fallback={
        <AccessDeniedPage
          requiredRole={requiredRole}
          currentRole={currentRole}
        />
      }
    >
      {children}
    </RbacRequireRole>
  );
}
