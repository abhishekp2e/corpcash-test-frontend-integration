import { Link } from "react-router-dom";
import { useState } from "react";

const TABS = [
  { id: "guide", label: "Guide" },
  { id: "core", label: "Core" },
  { id: "node", label: "Node" },
  { id: "react", label: "React" },
  { id: "store", label: "Store" },
  { id: "stack", label: "This stack" },
];

function Code({ children }) {
  return <pre className="code-block">{children}</pre>;
}

function GuideSection() {
  return (
    <div className="docs-section">
      <h2>Developer integration guide</h2>
      <p className="muted">
        Condensed from <code>BACKEND_FRONTEND_INTEGRATION.md</code>. Package
        READMEs are the <strong>source of truth</strong> for APIs. This UI
        follows the same path: core → node → react → store, then this POC.
      </p>

      <h3>How the four packages fit</h3>
      <Code>{`@corpcash/rbac-core          decisions only (in memory)
        ▲
   ┌────┴────┬────────────────┐
rbac-node  rbac-store    rbac-react
HTTP      persist roles   UX gates`}</Code>

      <div className="table-wrap">
        <table className="policy-table">
          <thead>
            <tr>
              <th>Package</th>
              <th>Does</th>
              <th>Does not</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>rbac-core</code>
              </td>
              <td>subject + action + resource → allow/deny</td>
              <td>HTTP, DB, UI</td>
            </tr>
            <tr>
              <td>
                <code>rbac-node</code>
              </td>
              <td>Express authorize / Nest guard / /rbac</td>
              <td>Persist config</td>
            </tr>
            <tr>
              <td>
                <code>rbac-store</code>
              </td>
              <td>Roles, inherits, assignments</td>
              <td>Store PolicyFn / onDecision</td>
            </tr>
            <tr>
              <td>
                <code>rbac-react</code>
              </td>
              <td>Hide/show from permissions[]</td>
              <td>Enforce security or run policies</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Golden rules</h3>
      <ol className="bullet-list">
        <li>
          <strong>One model</strong> — subject + action + resource (+ context) →
          allow/deny
        </li>
        <li>
          <strong>Backend is the security boundary</strong> — every mutating
          route runs <code>authorize()</code>
        </li>
        <li>
          <strong>Frontend never gets policy source</strong> — only{" "}
          <code>permissions[]</code> and capability results
        </li>
        <li>
          <strong>Persist roles, not policies</strong> — store holds the graph;
          <code>PolicyFn</code> stays in backend code
        </li>
        <li>
          <strong>Default deny</strong> — missing permission or failed policy =
          403
        </li>
        <li>
          <strong>Policies only narrow</strong> — they never add a permission.
          <code>*:*</code> still runs policies
        </li>
      </ol>

      <h3>Evaluation order (core)</h3>
      <Code>{`1. Resolve Subject (id required)
2. Expand roles (inheritance)
3. Match resource:action (wallet:*, *:read, *:*)
4. Run every matching policy — all must pass
5. Default DENY`}</Code>

      <h3>Concepts</h3>
      <div className="table-wrap">
        <table className="policy-table">
          <thead>
            <tr>
              <th>Concept</th>
              <th>Meaning</th>
              <th>This POC</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Subject</strong>
              </td>
              <td>
                <code>{`{ id, roles, attributes? }`}</code>
              </td>
              <td>
                JWT → <code>resolveSubject()</code> (store)
              </td>
            </tr>
            <tr>
              <td>
                <strong>Role</strong>
              </td>
              <td>permissions + optional inherits</td>
              <td>
                Seed <code>rbac.config.js</code> → Postgres
              </td>
            </tr>
            <tr>
              <td>
                <strong>Permission</strong>
              </td>
              <td>
                <code>resource:action</code>
              </td>
              <td>
                <code>permissions[]</code> → <code>useCan</code>
              </td>
            </tr>
            <tr>
              <td>
                <strong>Action</strong>
              </td>
              <td>read, delete, approve…</td>
              <td>Route + button</td>
            </tr>
            <tr>
              <td>
                <strong>Resource</strong>
              </td>
              <td>Type string or instance object</td>
              <td>
                Type A vs <code>/capabilities</code>
              </td>
            </tr>
            <tr>
              <td>
                <strong>Policy</strong>
              </td>
              <td>Check after a permission match</td>
              <td>
                <code>rbac.js</code> only
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Install (^0.3.0 from npm)</h3>
      <Code>{`# Backend
npm install @corpcash/rbac-core@^0.3.0 @corpcash/rbac-node@^0.3.0 @corpcash/rbac-store@^0.3.0 pg

# Frontend
npm install @corpcash/rbac-react@^0.3.0 @corpcash/rbac-core@^0.3.0 react`}</Code>
    </div>
  );
}

function CoreSection() {
  return (
    <div className="docs-section">
      <h2>@corpcash/rbac-core</h2>
      <p className="muted">
        Source of truth: package README. Framework-agnostic engine. Node,
        store, and React are adapters over this.
      </p>

      <h3>Flow</h3>
      <Code>{`1. new RBAC({ roles }) or new RBAC({ permissions })
2. rbac.registerPolicyFor(...)
3. rbac.authorize({ subject, action, resource, context? })
4. UI list = rbac.getEffectivePermissions(subject)
5. After role-graph change: rbac.reload(nextConfig)`}</Code>

      <p className="muted small">
        Role mode and permission-only mode cannot be combined. Frontend uses
        permission-only. <code>onDecision</code> exceptions are swallowed.
      </p>

      <h3>Construct + decide</h3>
      <Code>{`import { RBAC } from "@corpcash/rbac-core";

const rbac = new RBAC({
  roles: {
    viewer: { permissions: ["wallet:read"] },
    developer: {
      inherits: ["viewer"],
      permissions: ["wallet:create", "wallet:delete"],
    },
    admin: { permissions: ["*:*"] },
  },
  strictRoles: false,
  onDecision: ({ request, result }) => console.warn(result),
});

rbac.registerPolicyFor("wallet", "delete", ({ subject, resource }) => {
  if (typeof resource !== "object" || !resource) return false;
  return subject.id === String(resource.ownerId);
});

rbac.authorize({
  subject: { id: "u1", roles: ["developer"] },
  action: "delete",
  resource: { type: "wallet", id: "w1", ownerId: "u1" },
});
// { allowed, reason, matchedPermission?, ignoredRoles? }
// reason: AUTHORIZED | MISSING_PERMISSION | POLICY_DENIED | NO_SUBJECT`}</Code>

      <h3>Methods</h3>
      <ul className="bullet-list">
        <li>
          <code>authorize</code> / <code>authorizeAsync</code> — HTTP adapters
          use async (await policies)
        </li>
        <li>
          <code>can</code> / <code>canAsync</code> — boolean
        </li>
        <li>
          <code>registerPolicyFor(resource, action, fn)</code> /{" "}
          <code>registerPolicy(key, fn)</code>
        </li>
        <li>
          <code>reload</code> — keeps policies + onDecision; store wraps this
          as <code>reloadFromStore</code>
        </li>
        <li>
          <code>getEffectivePermissions</code> — expands inheritance,{" "}
          <strong>not</strong> policies
        </li>
        <li>
          <code>getEffectiveRoles</code> / <code>hasRole</code> —
          inheritance-aware (backend engine)
        </li>
      </ul>

      <h3>Policy matching</h3>
      <p>
        Keys, most specific first: <code>wallet:delete</code>,{" "}
        <code>wallet:*</code>, <code>*:delete</code>, <code>*:*</code>. Every
        match must return <code>true</code>. Async policy + sync authorize
        throws <code>AsyncPolicyError</code>.
      </p>
    </div>
  );
}

function NodeSection() {
  return (
    <div className="docs-section">
      <h2>@corpcash/rbac-node</h2>
      <p className="muted">
        Source of truth: package README. Express middleware, NestJS guards,
        admin router. This POC is Express only.
      </p>

      <h3>Flow</h3>
      <Code>{`1. createRBAC({ roles })  or  createRBACFromStore(store)
2. rbac.registerPolicyFor(...)
3. authorize() on every mutating route
4. GET /me/authorization
5. Optional: mount /rbac (needs rbac:manage)

request → getSubject → authorizeAsync
        → 401 if no subject
        → 403 if denied (reason in body)
        → next() if allowed`}</Code>

      <h3>Express</h3>
      <Code>{`import { createExpressMiddleware } from "@corpcash/rbac-node/express";

const { authorize } = createExpressMiddleware({
  rbac,
  getSubject: (req) => req.subject ?? null,
});

app.get("/wallets", authorize("wallet", "read"), listWallets);

app.delete(
  "/wallets/:id",
  authorize({
    resource: "wallet",
    action: "delete",
    getResource: (req) => ({
      type: "wallet",
      id: req.wallet.id,
      ownerId: req.wallet.ownerId,
    }),
  }),
  deleteWallet,
);`}</Code>

      <ul className="bullet-list">
        <li>
          <code>authorize("wallet", "read")</code> — type-level
        </li>
        <li>
          <code>getResource</code> — instance for policies; route{" "}
          <code>resource</code> always wins
        </li>
        <li>
          Default 403:{" "}
          <code>{`{ statusCode: 403, error: "Forbidden", reason }`}</code>
        </li>
      </ul>

      <h3>Admin mount</h3>
      <Code>{`import { createRbacAdminRouter } from "@corpcash/rbac-node/express";

app.use("/rbac", requireAuth, loadUser, createRbacAdminRouter({
  store, rbac, getSubject: (req) => req.subject,
}));`}</Code>
      <p className="muted small">
        If <code>getSubject</code> is omitted, the library reads{" "}
        <code>x-user-id</code>. This POC always passes the JWT subject. Route
        table + curls: store README.
      </p>

      <h3>NestJS</h3>
      <p className="muted small">
        Not used here. See node README: <code>RbacModule.forRoot</code> /{" "}
        <code>forRootAsync</code>,{" "}
        <code>{`{ provide: APP_GUARD, useExisting: RbacGuard }`}</code>,{" "}
        <code>@RequirePermission</code>, <code>@PublicRoute</code>,{" "}
        <code>RbacAdminModule.register()</code>.
      </p>
    </div>
  );
}

function ReactPkgSection() {
  return (
    <div className="docs-section">
      <h2>@corpcash/rbac-react</h2>
      <p className="muted">
        Source of truth: package README. Frontend RBAC is <strong>UX only</strong>
        . The API still authorizes every request.
      </p>

      <h3>Flow</h3>
      <Code>{`Login → GET /me/authorization → { subject, roles, permissions }
     → <RBACProvider subject permissions>
           ├── useCan / Can / RequirePermission   generic (Type A)
           └── GET /wallets/:id/capabilities      instance (Type B)`}</Code>

      <p>
        Pass <code>permissions</code>, not the role graph. Inheritance is
        expanded on the server. Policies are <strong>not</strong> applied.
        Treat the list as an upper bound.
      </p>

      <h3>Bootstrap (this app)</h3>
      <Code>{`import { RBACProvider, Can, useCan, RequireRole } from "@corpcash/rbac-react";

// ProtectedRoute after AuthContext loads /me/authorization
<RBACProvider subject={subject} permissions={permissions}>
  <Can resource="wallet" action="create">
    <CreateButton />
  </Can>
  <RequireRole role="developer" fallback={<AccessDeniedPage />}>
    <DeveloperWorkspace />
  </RequireRole>
</RBACProvider>

const canDeploy = useCan("contract", "deploy");`}</Code>

      <h3>Generic vs instance</h3>
      <div className="table-wrap">
        <table className="policy-table">
          <thead>
            <tr>
              <th></th>
              <th>Type A — generic</th>
              <th>Type B — instance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>When</td>
              <td>Not tied to one record</td>
              <td>Ownership / org / amount</td>
            </tr>
            <tr>
              <td>Data</td>
              <td>
                <code>permissions[]</code>
              </td>
              <td>
                <code>GET /…/capabilities</code>
              </td>
            </tr>
            <tr>
              <td>Hook</td>
              <td>
                <code>useCan("wallet", "delete")</code>
              </td>
              <td>
                <code>caps.delete.allowed</code>
              </td>
            </tr>
            <tr>
              <td>Policy</td>
              <td>Not evaluated</td>
              <td>Evaluated on the backend</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Exports</h3>
      <ul className="bullet-list">
        <li>
          <code>RBACProvider</code> — must wrap hooks; prefers{" "}
          <code>permissions</code> over <code>roles</code>
        </li>
        <li>
          <code>useRBAC()</code> — <code>can</code>, <code>subject</code>,{" "}
          <code>invalidPermissions</code>
        </li>
        <li>
          <code>useCan(resource, action, instance?)</code> — in
          permission-only mode the instance still does not run policies
        </li>
        <li>
          <code>useRole</code> / <code>RequireRole</code> — permission-only:
          checks <code>subject.roles</code> only (no client inheritance)
        </li>
        <li>
          <code>Can</code> / <code>RequirePermission</code>
        </li>
      </ul>
    </div>
  );
}

function StoreSection() {
  return (
    <div className="docs-section">
      <h2>@corpcash/rbac-store</h2>
      <p className="muted">
        Source of truth: package README. Persists the serializable graph. The
        engine stays in memory.
      </p>

      <h3>What lives where</h3>
      <div className="table-wrap">
        <table className="policy-table">
          <thead>
            <tr>
              <th>In the database</th>
              <th>Stays in code</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Role names, permissions, inherits</td>
              <td>
                <code>PolicyFn</code>
              </td>
            </tr>
            <tr>
              <td>
                <code>strictRoles</code>
              </td>
              <td>
                <code>onDecision</code>
              </td>
            </tr>
            <tr>
              <td>Subject id → role names</td>
              <td>
                JWT, <code>getSubject</code>, <code>getResource</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Flow</h3>
      <Code>{`1. postgresStore({ pool | connectionString })
2. await store.migrate()     // tables only
3. optional store.seed(...)  // no-op if any role exists
4. createRBACFromStore(store)
5. registerPolicyFor(...)
6. Writes: store methods  OR  POST /rbac/roles (same tables)`}</Code>

      <p className="muted small">
        Role-graph writes need <code>reloadFromStore</code> (admin router does
        this). Assignment writes do not — next <code>getRolesForSubject</code>{" "}
        sees them.
      </p>

      <h3>This POC boot</h3>
      <Code>{`const store = postgresStore({ pool });
await store.migrate();
await store.seed({ roles: rbacConfig.roles });
const rbac = await createRBACFromStore(store, { onDecision });
rbac.registerPolicyFor("wallet", "delete", ownershipPolicy);
// register: store.setRolesForSubject(userId, [role])`}</Code>

      <h3>Tables (prefix rbac_)</h3>
      <ul className="bullet-list">
        <li>
          <code>rbac_roles</code> — name, permissions, inherits
        </li>
        <li>
          <code>rbac_assignments</code> — subject_id ↔ role_name
        </li>
        <li>
          <code>rbac_settings</code> — strictRoles
        </li>
      </ul>

      <h3>Store methods (reload after *)</h3>
      <ul className="bullet-list">
        <li>
          <code>upsertRole*</code> / <code>deleteRole*</code> /{" "}
          <code>updateSettings*</code> / <code>seed</code> (if it inserted)
        </li>
        <li>
          <code>setRolesForSubject</code> / <code>assignRole</code> /{" "}
          <code>revokeRole</code> — no reload
        </li>
      </ul>

      <h3>Admin API (rbac:manage or *:*) </h3>
      <div className="table-wrap">
        <table className="policy-table">
          <thead>
            <tr>
              <th>Method</th>
              <th>Path</th>
              <th>Reloads</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>GET / POST</td>
              <td>
                <code>/rbac/roles</code>
              </td>
              <td>POST yes</td>
            </tr>
            <tr>
              <td>GET / PUT / DELETE</td>
              <td>
                <code>/rbac/roles/:name</code>
              </td>
              <td>PUT/DELETE yes</td>
            </tr>
            <tr>
              <td>GET / PUT / POST</td>
              <td>
                <code>/rbac/subjects/:id/roles</code>
              </td>
              <td>no</td>
            </tr>
            <tr>
              <td>DELETE</td>
              <td>
                <code>/rbac/subjects/:id/roles/:role</code>
              </td>
              <td>no</td>
            </tr>
            <tr>
              <td>GET / PATCH</td>
              <td>
                <code>/rbac/settings</code>
              </td>
              <td>PATCH yes</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="muted small">
        After assignment writes, refresh <code>GET /me/authorization</code>.
        Use the dashboard Interactive Admin API (admin users).
      </p>
    </div>
  );
}

function StackSection() {
  return (
    <div className="docs-section">
      <h2>This stack (POC contract)</h2>
      <p className="muted">
        Express <strong>:3000</strong> · React <strong>:5173</strong> · Bearer
        JWT · Postgres store. Do not invent x-user-id or port 4000.
      </p>

      <h3>Local run</h3>
      <Code>{`# Terminal 1
cd backend-integration
cp -n .env.example .env
# DATABASE_URL=postgresql://postgres:root@localhost:5432/postgres
npm install && npm run dev   # :3000

# Terminal 2
cd frontend-integration
cp -n .env.example .env      # VITE_API_URL=http://localhost:3000
npm install && npm run dev   # :5173

# UI calls VITE_API_URL directly (CORS). Vite /api proxy is unused.`}</Code>

      <h3>Subject resolution</h3>
      <Code>{`Bearer JWT { sub, username }
  → users row
  → store.getRolesForSubject(id)
  → fallback users.role if empty
  → { id, roles, attributes: { username, organizationId: "org_1" } }`}</Code>
      <p className="muted small">
        JWT is identity only. <code>users.role</code> is a registration
        snapshot — UI and authorize use <code>subject.roles</code>.
      </p>

      <h3>Seeded roles</h3>
      <div className="table-wrap">
        <table className="policy-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Direct permissions</th>
              <th>Inherits</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>viewer</td>
              <td>wallet:read, transaction:read, dashboard:read</td>
              <td>—</td>
            </tr>
            <tr>
              <td>developer</td>
              <td>wallet create/update, contract read/deploy</td>
              <td>viewer</td>
            </tr>
            <tr>
              <td>manager</td>
              <td>transaction:approve, wallet:delete, user:read, report:read</td>
              <td>developer</td>
            </tr>
            <tr>
              <td>admin</td>
              <td>
                <code>*:*</code>
              </td>
              <td>—</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Policies (this POC)</h3>
      <ul className="bullet-list">
        <li>
          <code>wallet:delete</code> — ownerId === subject.id when resource is
          an object; type-string resource returns true (Type A)
        </li>
        <li>
          <code>transaction:approve</code> — org must match; amount &gt; 100000
          requires admin. <code>tx_3</code> (org_2) denied for everyone
        </li>
      </ul>

      <h3>GET /me/authorization</h3>
      <Code>{`Authorization: Bearer <token>

{
  "subject": { "id": "1", "roles": ["manager"], "attributes": { "organizationId": "org_1" } },
  "roles": ["manager"],
  "permissions": ["wallet:read", "transaction:approve", …],
  "capabilities": { "wallet:delete": true, "rbac:manage": false },
  "user": { "id": 1, "username": "alice", "role": "manager", "roles": ["manager"] }
}`}</Code>

      <h3>Endpoints (:3000)</h3>
      <ul className="bullet-list">
        <li>
          <code>POST /auth/register</code> · <code>POST /auth/login</code> ·{" "}
          <code>GET /auth/roles</code>
        </li>
        <li>
          <code>GET /me/authorization</code> · <code>GET /dashboard</code>
        </li>
        <li>
          <code>GET/POST /wallets</code> · <code>DELETE /wallets/:id</code> ·{" "}
          <code>GET /wallets/:id/capabilities</code>
        </li>
        <li>
          <code>GET /transactions</code> ·{" "}
          <code>POST /transactions/:id/approve</code> ·{" "}
          <code>GET /transactions/:id/capabilities</code>
        </li>
        <li>
          <code>POST /contracts/deploy</code>
        </li>
        <li>
          <code>POST /rbac/authorize</code> — debug, any authenticated user
          (mounted before the admin router)
        </li>
        <li>
          <code>/rbac/*</code> — store admin API
        </li>
      </ul>

      <p className="muted small">
        Seed: <code>wallet_1.ownerId = &quot;1&quot;</code>,{" "}
        <code>wallet_2.ownerId = &quot;2&quot;</code>. tx_1 50k org_1 · tx_2
        500k org_1 (admin only) · tx_3 org_2 (nobody).
      </p>

      <h3>Flow — permission + policy</h3>
      <Code>{`DELETE /wallets/wallet_1
1. Permission wallet:delete
2. Policy ownerId === subject.id
   → ALLOW or 403 POLICY_DENIED

Type A may show Delete; Type B /capabilities tells the truth.
The mutating route always re-checks.`}</Code>

      <h3>Who owns what</h3>
      <div className="table-wrap">
        <table className="policy-table">
          <thead>
            <tr>
              <th>Data / logic</th>
              <th>Owner</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Engine / HTTP / UI / persist APIs</td>
              <td>core / node / react / store READMEs</td>
            </tr>
            <tr>
              <td>Role rows</td>
              <td>Postgres rbac_roles</td>
            </tr>
            <tr>
              <td>Subject → roles</td>
              <td>Postgres rbac_assignments</td>
            </tr>
            <tr>
              <td>Policies</td>
              <td>
                <code>rbac.js</code>
              </td>
            </tr>
            <tr>
              <td>Generic UI</td>
              <td>
                <code>useCan</code> / <code>&lt;Can&gt;</code>
              </td>
            </tr>
            <tr>
              <td>Instance UI</td>
              <td>
                <code>/…/capabilities</code>
              </td>
            </tr>
            <tr>
              <td>Security</td>
              <td>
                Backend <code>authorize()</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

const SECTIONS = {
  guide: GuideSection,
  core: CoreSection,
  node: NodeSection,
  react: ReactPkgSection,
  store: StoreSection,
  stack: StackSection,
};

export default function DocsPage() {
  const [tab, setTab] = useState("guide");
  const Section = SECTIONS[tab];

  return (
    <div className="docs-page">
      <header className="docs-header">
        <div>
          <p className="eyebrow">Corpcash RBAC</p>
          <h1>Documentation</h1>
          <p className="muted">
            Same path as <code>BACKEND_FRONTEND_INTEGRATION.md</code>: core →
            node → react → store. Package READMEs are the API source of truth.
          </p>
        </div>
        <Link to="/login" className="ghost-link">
          ← Back to sign in
        </Link>
      </header>

      <nav className="docs-tabs" aria-label="Documentation sections">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={tab === id ? "docs-tab active" : "docs-tab"}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="docs-body panel">
        <Section />
      </div>
    </div>
  );
}
