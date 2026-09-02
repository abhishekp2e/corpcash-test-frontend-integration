import { Link } from "react-router-dom";
import { useCan } from "@corpcash/rbac-react";
import { useAuth } from "../../AuthContext";
import { ROLE_CONTENT } from "./roleContent";

/**
 * Shared body for /roles/:role pages after RequireRole has allowed access.
 */
export default function RoleWorkspace({ role }) {
  const { user, permissions } = useAuth();
  const content = ROLE_CONTENT[role];

  const canDashboard = useCan("dashboard", "read");
  const canCreateWallet = useCan("wallet", "create");
  const canReadUser = useCan("user", "read");

  if (!content) {
    return (
      <div className="dashboard">
        <p className="error">Unknown role page.</p>
        <Link to="/dashboard">Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Role page · access granted</p>
          <h1>{content.title}</h1>
          <p className="muted">{content.subtitle}</p>
        </div>
        <Link className="ghost-link" to="/dashboard">
          ← Dashboard
        </Link>
      </header>

      <section className="panel panel-success">
        <h2>Welcome, {user?.username}</h2>
        <p>
          You are signed in as <strong>{user?.role}</strong>, which matches this
          page. You can view this workspace.
        </p>
        <p className="muted small">{content.description}</p>
      </section>

      <section className="panel">
        <h2>What this role is for</h2>
        <ul className="bullet-list">
          {content.highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>Your effective permissions</h2>
        <ul className="perm-list">
          {permissions.length === 0 ? (
            <li className="muted">None returned from API</li>
          ) : (
            permissions.map((perm) => (
              <li key={perm}>
                <code>{perm}</code>
              </li>
            ))
          )}
        </ul>
        <p className="muted small" style={{ marginTop: "0.75rem" }}>
          Sample <code>useCan</code> checks: dashboard{" "}
          {canDashboard ? "yes" : "no"} · wallet create{" "}
          {canCreateWallet ? "yes" : "no"} · user read{" "}
          {canReadUser ? "yes" : "no"}
        </p>
      </section>
    </div>
  );
}
