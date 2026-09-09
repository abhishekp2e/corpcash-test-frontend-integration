import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Can, useCan } from "@corpcash/rbac-react";
import AdminApiPanel from "../components/AdminApiPanel";
import ResourceApiPanel from "../components/ResourceApiPanel";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { runPolicyScenarios } from "../policyExamples";
import { ROLE_NAV } from "./roles/roleContent";

export default function DashboardPage() {
  const { user, permissions, capabilities, subject, logout } = useAuth();
  const displayRoles = subject?.roles ?? user?.roles ?? (user?.role ? [user.role] : []);
  const primaryRole = displayRoles[0];
  const navigate = useNavigate();
  const [message, setMessage] = useState("");

  // Permission checks via @corpcash/rbac-react (UX only).
  const canCreateWallet = useCan("wallet", "create");
  const canApproveTx = useCan("transaction", "approve");
  const canReadWallet = useCan("wallet", "read");

  // Demo policy table — illustrative only; not used for real authorization.
  const policyRows = useMemo(() => runPolicyScenarios(), []);

  useEffect(() => {
    api
      .dashboard()
      .then((d) => setMessage(d.message))
      .catch((e) => setMessage(e.message));
  }, []);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>{user?.username}</h1>
          <p className="muted">
            Roles: <strong>{displayRoles.join(", ") || "—"}</strong>
            {primaryRole === "viewer" ? " (reader)" : null}
            {user?.id != null ? (
              <>
                {" "}
                · subject <code>{String(user.id)}</code>
              </>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            logout();
            navigate("/login", { replace: true });
          }}
        >
          Log out
        </button>
      </header>

      <section className="panel">
        <h2>Permissions (from API)</h2>
        <ul className="perm-list">
          {permissions.map((perm) => (
            <li key={perm}>
              <code>{perm}</code>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>Capabilities (from API)</h2>
        <div className="actions">
          {Object.entries(capabilities).map(([key, allowed]) => (
            <span key={key} className={allowed ? "chip ok" : "chip"}>
              {key}
            </span>
          ))}
        </div>
      </section>

      <ResourceApiPanel />

      <AdminApiPanel userId={user?.id} />

      {/* Always show all role links so you can click and hit RequireRole */}
      <section className="panel">
        <h2>Role pages</h2>
        <p className="muted small">
          Links are always visible. Opening a page uses{" "}
          <code>RequireRole</code> from <code>@corpcash/rbac-react</code> —
          other roles get Access Denied and redirect in 3s.
        </p>
        <nav className="role-nav" aria-label="Role workspaces">
          {ROLE_NAV.map(({ role, label, path }) => (
            <Link
              key={role}
              to={path}
              className={
                displayRoles.includes(role) ? "role-nav-link current" : "role-nav-link"
              }
            >
              {label}
              {displayRoles.includes(role) ? " · yours" : ""}
            </Link>
          ))}
        </nav>
      </section>

      <section className="panel">
        <h2>Session</h2>
        <p>{message || "Loading…"}</p>
      </section>

      {/*
        Capability-gated UI via <Can resource action> from @corpcash/rbac-react.
        UX only — the API still enforces the same permissions.
      */}
      <section className="panel">
        <h2>Role-based UI elements</h2>
        <p className="muted small">
          Type A only (<code>Can</code> / <code>useCan</code>). Live Type B
          calls are in <strong>Resource APIs</strong> above.
        </p>

        <div className="gated-grid">
          <Can resource="wallet" action="read">
            <div className="gated-card">
              <h3>Wallets overview</h3>
              <p className="muted small">Visible with wallet:read (viewer+).</p>
              <button type="button" className="ghost" disabled>
                View wallets
              </button>
            </div>
          </Can>

          <Can resource="transaction" action="read">
            <div className="gated-card">
              <h3>Transactions</h3>
              <p className="muted small">Visible with transaction:read.</p>
              <button type="button" className="ghost" disabled>
                Browse transactions
              </button>
            </div>
          </Can>

          <Can resource="wallet" action="create">
            <div className="gated-card">
              <h3>Create wallet</h3>
              <p className="muted small">Developer+ (wallet:create).</p>
              <button type="button" disabled>
                Create wallet
              </button>
            </div>
          </Can>

          <Can resource="wallet" action="update">
            <div className="gated-card">
              <h3>Update wallet</h3>
              <p className="muted small">Developer+ (wallet:update).</p>
              <button type="button" className="ghost" disabled>
                Edit wallet
              </button>
            </div>
          </Can>

          <Can resource="contract" action="deploy">
            <div className="gated-card">
              <h3>Deploy contract</h3>
              <p className="muted small">Developer+ (contract:deploy).</p>
              <button type="button" disabled>
                Deploy
              </button>
            </div>
          </Can>

          <Can resource="transaction" action="approve">
            <div className="gated-card">
              <h3>Approve transaction</h3>
              <p className="muted small">Manager+ (transaction:approve).</p>
              <button type="button" disabled>
                Approve
              </button>
            </div>
          </Can>

          <Can resource="wallet" action="delete">
            <div className="gated-card">
              <h3>Delete wallet</h3>
              <p className="muted small">
                Manager+ permission; ownership policy may still deny on the API.
              </p>
              <button type="button" className="ghost" disabled>
                Delete
              </button>
            </div>
          </Can>

          <Can resource="report" action="read">
            <div className="gated-card">
              <h3>Reports</h3>
              <p className="muted small">Manager+ (report:read).</p>
              <button type="button" className="ghost" disabled>
                Open reports
              </button>
            </div>
          </Can>

          <Can resource="user" action="read">
            <div className="gated-card">
              <h3>User directory</h3>
              <p className="muted small">Manager+ / admin (user:read).</p>
              <button type="button" className="ghost" disabled>
                Manage users
              </button>
            </div>
          </Can>
        </div>

        {!canCreateWallet && !canApproveTx && canReadWallet ? (
          <p className="muted small" style={{ marginTop: "0.75rem" }}>
            As a viewer you only see read-oriented controls. Register as
            developer/manager/admin to unlock more panels.
          </p>
        ) : null}
      </section>

      <section className="panel">
        <h2>Policy implementation examples</h2>
        <p className="muted small">
          Policies run on the <strong>backend</strong> after a permission match.
          Rows below are educational demos of ownership and org+amount rules —
          not live security checks. The React package never executes policies.
        </p>
        <div className="table-wrap">
          <table className="policy-table">
            <thead>
              <tr>
                <th>Policy</th>
                <th>Scenario</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {policyRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <code>{row.policy}</code>
                  </td>
                  <td>{row.note}</td>
                  <td>
                    <span className={row.allowed ? "chip ok" : "chip deny"}>
                      {row.reason}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <pre className="code-block">{`// Backend-style registration (illustrative)
rbac.registerPolicyFor("wallet", "delete", ({ subject, resource }) =>
  subject.id === resource.ownerId
);

rbac.registerPolicyFor("transaction", "approve", ({ subject, resource }) => {
  if (subject.attributes.organizationId !== resource.organizationId) return false;
  if (resource.amount > 100_000) return subject.roles.includes("admin");
  return true;
});`}</pre>
      </section>
    </div>
  );
}
