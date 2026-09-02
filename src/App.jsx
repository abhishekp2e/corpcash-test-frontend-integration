import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import { ProtectedRoute } from "./ProtectedRoute";
import { RequireRole } from "./RequireRole";
import DashboardPage from "./pages/DashboardPage";
import DocsPage from "./pages/DocsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RoleWorkspace from "./pages/roles/RoleWorkspace";
import "./App.css";

/** Helper: auth + exact-role gate around a role workspace. */
function RoleRoute({ role }) {
  return (
    <ProtectedRoute>
      <RequireRole requiredRole={role}>
        <RoleWorkspace role={role} />
      </RequireRole>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          {/* Exact-role pages — visit any link; gate decides allow vs Access Denied */}
          <Route path="/roles/viewer" element={<RoleRoute role="viewer" />} />
          <Route path="/roles/developer" element={<RoleRoute role="developer" />} />
          <Route path="/roles/manager" element={<RoleRoute role="manager" />} />
          <Route path="/roles/admin" element={<RoleRoute role="admin" />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
