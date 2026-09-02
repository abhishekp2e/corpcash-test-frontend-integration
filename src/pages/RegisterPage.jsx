import { Link, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../AuthContext";

const FALLBACK_ROLES = ["viewer", "developer", "manager", "admin"];

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("viewer");
  const [roles, setRoles] = useState(FALLBACK_ROLES);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .roles()
      .then((data) => {
        if (Array.isArray(data.roles) && data.roles.length) {
          setRoles(data.roles);
        }
      })
      .catch(() => {});
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(username, password, role);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>Create account</h1>
        <p className="muted">Pick a unique ID, password, and role. No email needed.</p>

        {error ? <p className="error">{error}</p> : null}

        <label>
          Unique ID
          <input
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>

        <label>
          Role
          <select value={role} onChange={(e) => setRole(e.target.value)} required>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create account"}
        </button>

        <p className="footer-link">
          Already registered? <Link to="/login">Sign in</Link>
          {" · "}
          <Link to="/docs">Docs</Link>
        </p>
      </form>
    </div>
  );
}
