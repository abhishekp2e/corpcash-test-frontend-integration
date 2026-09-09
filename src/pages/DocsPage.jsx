import { Link } from "react-router-dom";
import { useState } from "react";

const TABS = [
  { id: "guide", label: "Developer guide" },
  { id: "packages", label: "Packages" },
  { id: "store", label: "RBAC Store" },
  { id: "integration", label: "Integration" },
  { id: "examples", label: "Examples" },
  { id: "reference", label: "API & flows" },
];

function Code({ children }) {
  return <pre className="code-block">{children}</pre>;
}

function GuideSection() {
  return (
    <div className="docs-section">
      <h2>Developer guide</h2>
      <p className="muted">
        Condensed from{" "}
        <code>BACKEND_FRONTEND_INTEGRATION.md</code>. Corpcash RBAC answers:{" "}
        <strong>can this subject perform this action on this resource?</strong>
      </p>

      <h3>Architecture (golden rules)</h3>
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
          <strong>Frontend never gets policy source</strong> — only effective
          permissions and capability results
        </li>
        <li>
          <strong>Roles/permissions defined once</strong> on the backend —
          frontend consumes computed output
        </li>
        <li>
          <strong>Default deny</strong> — missing permission or failed policy =
          403
        </li>
        <li>
          <strong>Persist roles, not policies</strong> —{" "}
          <code>@corpcash/rbac-store</code> holds the role graph + subject
          assignments in Postgres; <code>PolicyFn</code> /{" "}
          <code>onDecision</code> stay in backend code
        </li>
      </ol>

      <h3>The six RBAC concepts</h3>
      <div className="table-wrap">
        <table className="policy-table">
          <thead>
            <tr>
              <th>Concept</th>
              <th>Question</th>
              <th>Backend</th>
              <th>Frontend</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Subject</strong>
              </td>
              <td>Who?</td>
              <td>
                JWT → user → <code>resolveSubject()</code> (store)
              </td>
              <td>
                From <code>GET /me/authorization</code>
              </td>
            </tr>
            <tr>
              <td>
                <strong>Role</strong>
              </td>
              <td>Access profile?</td>
              <td>
                <code>rbac.config.js</code> seed →{" "}
                <code>@corpcash/rbac-store</code> (Postgres)
              </td>
              <td>Displayed; drives permissions</td>
            </tr>
            <tr>
              <td>
                <strong>Permission</strong>
              </td>
              <td>Allowed in general?</td>
              <td>
                <code>resource:action</code> in roles
              </td>
              <td>
                <code>permissions[]</code> / <code>can()</code>
              </td>
            </tr>
            <tr>
              <td>
                <strong>Action</strong>
              </td>
              <td>What operation?</td>
              <td>
                Route handlers (<code>read</code>, <code>approve</code>…)
              </td>
              <td>Buttons, API calls</td>
            </tr>
            <tr>
              <td>
                <strong>Resource</strong>
              </td>
              <td>On what?</td>
              <td>
                Type <code>&quot;wallet&quot;</code> or instance{" "}
                <code>{`{ type, id, ownerId }`}</code>
              </td>
              <td>Capabilities API</td>
            </tr>
            <tr>
              <td>
                <strong>Policy</strong>
              </td>
              <td>Extra conditions?</td>
              <td>
                <code>registerPolicyFor</code> (backend only)
              </td>
              <td>
                Never in browser — use <code>/capabilities</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Evaluation order</h3>
      <Code>{`1. Resolve Subject (from auth)
2. Resolve Roles → Permissions (with inheritance)
3. Match permission (wildcards: wallet:*, *:read, *:*)
4. Evaluate Policy (if registered for that permission)
5. Default DENY`}</Code>

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
              <td>Role definitions</td>
              <td>
                Postgres via <code>@corpcash/rbac-store</code> (seeded from{" "}
                <code>rbac.config.js</code>)
              </td>
            </tr>
            <tr>
              <td>Policy functions</td>
              <td>Backend only — never expose to client</td>
            </tr>
            <tr>
              <td>Subject identity</td>
              <td>JWT <code>sub</code> → <code>users.id</code></td>
            </tr>
            <tr>
              <td>Subject → roles</td>
              <td>
                Postgres <code>rbac_assignments</code> via{" "}
                <code>resolveSubject</code>
              </td>
            </tr>
            <tr>
              <td>Effective permissions</td>
              <td>Backend computes → frontend</td>
            </tr>
            <tr>
              <td>Generic UI visibility</td>
              <td>
                Frontend <code>useCan</code> / <code>&lt;Can&gt;</code>
              </td>
            </tr>
            <tr>
              <td>Instance UI visibility</td>
              <td>
                Backend <code>/…/capabilities</code> (policy-aware)
              </td>
            </tr>
            <tr>
              <td>Security enforcement</td>
              <td>
                Backend <code>authorize()</code> on every route
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PackagesSection() {
  return (
    <div className="docs-section">
      <h2>Library packages</h2>
      <p className="muted">
        Installed from npm at <code>^0.3.0</code>:{' '}
        <code>@corpcash/rbac-core</code>, <code>rbac-node</code>,{' '}
        <code>rbac-store</code>, <code>rbac-react</code>.
      </p>

      <article className="docs-card">
        <h3>
          <code>@corpcash/rbac-core</code>
        </h3>
        <p>
          Framework-agnostic engine. Used on the <strong>backend</strong>;
          indirectly on the frontend via <code>rbac-react</code> (permission-only
          mode).
        </p>
        <ul className="bullet-list">
          <li>
            <code>new RBAC(config)</code> / role inheritance
          </li>
          <li>
            <code>authorize()</code> / <code>can()</code>
          </li>
          <li>
            <code>registerPolicyFor(resource, action, fn)</code>
          </li>
          <li>
            <code>getEffectivePermissions(subject)</code> for UI bootstrap
          </li>
        </ul>
      </article>

      <article className="docs-card">
        <h3>
          <code>@corpcash/rbac-node</code>
        </h3>
        <p>Express middleware, NestJS guards, and the admin router.</p>
        <ul className="bullet-list">
          <li>
            <code>createRBAC(config)</code> or store-backed engine
          </li>
          <li>
            <code>
              createExpressMiddleware({`{ rbac, getSubject }`}) → authorize()
            </code>
          </li>
          <li>
            <code>createRbacAdminRouter({`{ store, rbac }`}) → /rbac/*</code>{" "}
            (requires <code>rbac:manage</code>)
          </li>
          <li>401 if no subject · 403 if denied</li>
        </ul>
      </article>

      <article className="docs-card">
        <h3>
          <code>@corpcash/rbac-store</code>
        </h3>
        <p>
          Persists the <strong>serializable</strong> role graph (roles,
          inheritance, <code>strictRoles</code>, subject → roles) in Postgres /
          MySQL / Mongo. The decision engine stays in memory.
        </p>
        <ul className="bullet-list">
          <li>
            <code>postgresStore({`{ pool | connectionString }`})</code>
          </li>
          <li>
            <code>migrate()</code> / <code>seed(config)</code>
          </li>
          <li>
            <code>createRBACFromStore(store)</code> →{" "}
            <code>@corpcash/rbac-core</code> engine
          </li>
          <li>
            Admin writes call <code>reloadFromStore</code> automatically
          </li>
        </ul>
        <p className="muted small">
          Policies are <strong>not</strong> stored — register them in code after
          loading the engine.
        </p>
      </article>

      <article className="docs-card">
        <h3>
          <code>@corpcash/rbac-react</code>
        </h3>
        <p>
          Client adapter: <code>RBACProvider</code>, <code>Can</code>,{" "}
          <code>useCan</code>, <code>RequirePermission</code>,{" "}
          <code>RequireRole</code>.
        </p>
        <p className="muted small">
          Uses <strong>permission-only mode</strong> — pass expanded{" "}
          <code>permissions[]</code> from the API, not full role config or
          policies. UX only.
        </p>
      </article>

      <h3>Install</h3>
      <Code>{`# Backend
npm install @corpcash/rbac-core@^0.3.0 @corpcash/rbac-node@^0.3.0 @corpcash/rbac-store@^0.3.0 pg

# Frontend — UX helpers only (do not depend on core/store directly)
npm install @corpcash/rbac-react@^0.3.0`}</Code>
    </div>
  );
}

function StoreSection() {
  return (
    <div className="docs-section">
      <h2>@corpcash/rbac-store flow</h2>
      <p className="muted">
        Guide §3 store package + this POC’s Postgres wiring (
        <code>DATABASE_URL</code>).
      </p>

      <h3>What lives where</h3>
      <div className="table-wrap">
        <table className="policy-table">
          <thead>
            <tr>
              <th>In the database</th>
              <th>Stays in application code</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Role names, permissions, inherits</td>
              <td>
                <code>PolicyFn</code> (<code>registerPolicyFor</code>)
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
                JWT auth, <code>getSubject</code>, <code>getResource</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Boot sequence (this POC)</h3>
      <Code>{`1. postgresStore({ pool })           // share app DATABASE_URL pool
2. store.migrate()                   // rbac_roles, rbac_assignments, rbac_settings
3. store.seed({ roles })             // from rbac.config.js (no-op if roles exist)
4. createRBACFromStore(store)        // in-memory @corpcash/rbac-core engine
5. registerPolicyFor(...)            // policies stay in code
6. createRbacAdminRouter(...)        // mount at /rbac
7. On register: store.setRolesForSubject(userId, [role])`}</Code>

      <h3>Postgres tables</h3>
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

      <h3>Admin API (requires rbac:manage)</h3>
      <div className="table-wrap">
        <table className="policy-table">
          <thead>
            <tr>
              <th>Method</th>
              <th>Path</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>GET / POST</td>
              <td>
                <code>/rbac/roles</code>
              </td>
            </tr>
            <tr>
              <td>GET / PUT / DELETE</td>
              <td>
                <code>/rbac/roles/:name</code>
              </td>
            </tr>
            <tr>
              <td>GET / PUT / POST</td>
              <td>
                <code>/rbac/subjects/:id/roles</code>
              </td>
            </tr>
            <tr>
              <td>DELETE</td>
              <td>
                <code>/rbac/subjects/:id/roles/:role</code>
              </td>
            </tr>
            <tr>
              <td>GET / PATCH</td>
              <td>
                <code>/rbac/settings</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="muted small">
        After a role-graph write, the admin router calls{" "}
        <code>reloadFromStore(rbac, store)</code>. Assignment changes apply on
        the next request without a reload. Use the dashboard{" "}
        <strong>Interactive Admin API</strong> panel (admin users) to try these
        live.
      </p>

      <h3>Frontend after store edits</h3>
      <ol className="bullet-list">
        <li>
          Admin mutates roles via <code>/rbac/*</code>
        </li>
        <li>
          Affected users call <code>GET /me/authorization</code> again (Refresh
          session)
        </li>
        <li>
          <code>RBACProvider</code> receives new <code>permissions[]</code> —
          UI gates update
        </li>
      </ol>
    </div>
  );
}

function IntegrationSection() {
  return (
    <div className="docs-section">
      <h2>Integration guide</h2>
      <p className="muted">
        Guide §4–5 adapted to this POC. Auth is <strong>JWT Bearer</strong>;
        roles persist via <code>@corpcash/rbac-store</code> + Postgres.
      </p>

      <h3>Repo layout (this stack)</h3>
      <Code>{`rback-check/
├── backend-integration/     # Express :3000  (@corpcash/rbac-core/node/store ^0.3.0)
│   ├── rbac.config.js       # seed catalog (RESOURCES, ACTIONS, roles)
│   ├── rbac.js              # store migrate/seed + policies + admin router
│   ├── auth.js              # JWT register/login
│   ├── db.js                # DATABASE_URL pool
│   └── index.js             # routes + /rbac mount
└── frontend-integration/    # React :5173  (@corpcash/rbac-react ^0.3.0)
    ├── AuthContext.jsx      # GET /me/authorization
    ├── components/AdminApiPanel.jsx
    └── pages/DocsPage.jsx`}</Code>

      <h3>1. Seed catalog → store</h3>
      <p>
        <code>rbac.config.js</code> defines the initial graph. On boot it is
        seeded into Postgres (idempotent). Live edits go through{" "}
        <code>/rbac</code>, not the file.
      </p>
      <Code>{`const store = postgresStore({ pool });
await store.migrate();
await store.seed({ roles: rbacConfig.roles }); // no-op if roles exist
const rbac = await createRBACFromStore(store, { onDecision });
rbac.registerPolicyFor("wallet", "delete", ownershipPolicy);`}</Code>

      <h3>2. Subject: JWT → store roles</h3>
      <Code>{`// loadUser after JWT verify
const user = await findUserById(claims.sub);
req.subject = await resolveSubject(user);
// → { id, roles: store.getRolesForSubject(id), attributes }

app.use("/rbac", requireAuth, loadUser, createRbacAdminRouter({
  store, rbac, getSubject: (req) => req.subject,
}));`}</Code>

      <h3>3. Frontend bootstrap</h3>
      <Code>{`AuthProvider → GET /me/authorization (Bearer)
         ← subject, roles, permissions, capabilities
ProtectedRoute → RBACProvider(subject, permissions)
UI ← useCan / Can / RequireRole  (+ AdminApiPanel for /rbac)`}</Code>

      <h3>4. Two types of frontend authorization</h3>
      <article className="docs-card">
        <h3>Type A — Generic UI (permission-only)</h3>
        <Code>{`<Can resource="wallet" action="create">
  <button>Create Wallet</button>
</Can>
const canDeploy = useCan("contract", "deploy");`}</Code>
      </article>

      <article className="docs-card">
        <h3>Type B — Instance-level UI (policy-aware)</h3>
        <p>
          Use backend <code>/…/capabilities</code> for ownership/org/amount —
          never reimplement policies in React.
        </p>
      </article>

      <h3>Local run</h3>
      <Code>{`# Terminal 1
cd rback-check/backend-integration
cp -n .env.example .env   # DATABASE_URL=postgresql://postgres:root@localhost:5432/postgres
npm install && npm run dev   # :3000

# Terminal 2
cd rback-check/frontend-integration
cp -n .env.example .env   # VITE_API_URL=http://localhost:3000
npm install && npm run dev   # :5173

# UI calls VITE_API_URL directly (CORS). Vite /api proxy is unused.`}</Code>
    </div>
  );
}

function ExamplesSection() {
  return (
    <div className="docs-section">
      <h2>Sample code & examples</h2>
      <p className="muted">From the guide §3–5 and this POC.</p>

      <h3>Core — authorize + ownership policy</h3>
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
});

rbac.registerPolicyFor("wallet", "delete", ({ subject, resource }) => {
  return typeof resource === "object" && subject.id === resource.ownerId;
});

rbac.authorize({
  subject: { id: "dev-1", roles: ["developer"] },
  action: "delete",
  resource: { type: "wallet", id: "wallet_1", ownerId: "dev-1" },
});
// → { allowed: true, reason: "AUTHORIZED", matchedPermission: "wallet:delete" }`}</Code>

      <h3>Store — Postgres persist + admin router</h3>
      <Code>{`import { createRBACFromStore } from "@corpcash/rbac-store";
import { postgresStore } from "@corpcash/rbac-store/postgres";
import { createRbacAdminRouter } from "@corpcash/rbac-node/express";

const store = postgresStore({ pool }); // or { connectionString: DATABASE_URL }
await store.migrate();
await store.seed({ roles: rbacConfig.roles });

const rbac = await createRBACFromStore(store, { onDecision });
rbac.registerPolicyFor("wallet", "delete", ownershipPolicy);

app.use("/rbac", requireAuth, loadUser, createRbacAdminRouter({
  store,
  rbac,
  getSubject: (req) => req.subject,
}));`}</Code>

      <h3>Node — Express route guards</h3>
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
      id: req.params.id,
      ownerId: req.wallet.ownerId,
    }),
  }),
  deleteWallet,
);`}</Code>

      <h3>React — RBACProvider (permission-only)</h3>
      <Code>{`import { RBACProvider, Can, useCan } from "@corpcash/rbac-react";

// permissions from GET /me/authorization — not full role config
<RBACProvider subject={subject} permissions={permissions}>
  <Can resource="wallet" action="create">
    <CreateButton />
  </Can>
</RBACProvider>

const canDeploy = useCan("contract", "deploy");`}</Code>

      <h3>This POC — @corpcash/rbac-react</h3>
      <Code>{`// ProtectedRoute mounts RBACProvider after /me/authorization loads
<RBACProvider subject={subject} permissions={permissions}>
  <Can resource="wallet" action="create">
    <CreateWalletPanel />
  </Can>
  <RequireRole role="developer" fallback={<AccessDeniedPage />}>
    <DeveloperWorkspace />
  </RequireRole>
</RBACProvider>

const canDeploy = useCan("contract", "deploy");`}</Code>

      <h3>Transaction approve policy (guide)</h3>
      <Code>{`rbac.registerPolicyFor("transaction", "approve", ({ subject, resource }) => {
  if (subject.attributes.organizationId !== resource.organizationId) return false;
  if (resource.amount > 100_000) return subject.roles.includes("admin");
  return true;
});`}</Code>
    </div>
  );
}

function ReferenceSection() {
  return (
    <div className="docs-section">
      <h2>API & end-to-end flows</h2>
      <p className="muted">Guide §4.6 and §6, plus this POC’s auth endpoints.</p>

      <h3>GET /me/authorization</h3>
      <p>Primary frontend bootstrap contract.</p>
      <Code>{`// This POC (Bearer JWT)
Authorization: Bearer <token>

{
  "subject": { "id": "2", "roles": ["developer"], "attributes": { … } },
  "roles": ["developer"],
  "permissions": ["wallet:create", "wallet:read", …],
  "capabilities": {
    "wallet:create": true,
    "wallet:delete": false,
    "dashboard:read": true
  },
  "user": { "id": 2, "username": "demo", "role": "developer" }
}`}</Code>

      <h3>Instance capabilities (guide pattern)</h3>
      <Code>{`GET /wallets/wallet_2/capabilities   # ownerId is "2"
Authorization: Bearer <jwt>

{
  "resource": { "type": "wallet", "id": "wallet_2", "ownerId": "2" },
  "capabilities": {
    "read":   { "allowed": true,  "reason": "AUTHORIZED", "matchedPermission": "wallet:read" },
    "delete": { "allowed": false, "reason": "POLICY_DENIED", "matchedPermission": "wallet:delete" }
  }
}`}</Code>

      <h3>Auth + resource + admin endpoints (this POC, :3000)</h3>
      <ul className="bullet-list">
        <li>
          <code>POST /auth/register</code> / <code>POST /auth/login</code> —
          Bearer JWT; roles written/read from the store
        </li>
        <li>
          <code>GET /auth/roles</code> — <code>store.listRoles()</code>
        </li>
        <li>
          <code>GET /me/authorization</code> — Type A capabilities
        </li>
        <li>
          <code>GET /dashboard</code> —{" "}
          <code>authorize(dashboard, read)</code>
        </li>
        <li>
          <code>GET/POST /wallets</code>,{" "}
          <code>DELETE /wallets/:id</code>,{" "}
          <code>GET /wallets/:id/capabilities</code>
        </li>
        <li>
          <code>GET /transactions</code>,{" "}
          <code>POST /transactions/:id/approve</code>,{" "}
          <code>GET /transactions/:id/capabilities</code>
        </li>
        <li>
          <code>POST /contracts/deploy</code>
        </li>
        <li>
          <code>POST /rbac/authorize</code> — debug (any authenticated user)
        </li>
        <li>
          <code>/rbac/*</code> — store admin API (<code>rbac:manage</code>)
        </li>
      </ul>

      <h3>Flow A — permission only</h3>
      <Code>{`GET /wallets  +  authorize(wallet, read)
→ ALLOW if subject has wallet:read
→ 403 if missing permission`}</Code>

      <h3>Flow B — permission + policy</h3>
      <Code>{`DELETE /wallets/wallet_1
1. Permission wallet:delete ✓
2. Policy ownerId === subject.id ?
   → ALLOW or 403 POLICY_DENIED

Even if the UI shows Delete, the API re-checks — never trust the client.`}</Code>

      <h3>Flow D — delete button visibility</h3>
      <ol className="bullet-list">
        <li>Permission check → show delete UI (Type A)</li>
        <li>
          Per row: <code>GET /wallets/:id/capabilities</code> →{" "}
          <code>delete.allowed</code> (Type B)
        </li>
        <li>
          Click Delete → <code>DELETE /wallets/:id</code> → backend re-authorizes
        </li>
      </ol>

      <h3>Production checklist (guide §7)</h3>
      <ul className="bullet-list">
        <li>
          Auth is already JWT Bearer; keep roles in the store, not in the token
        </li>
        <li>
          Role definitions: <code>@corpcash/rbac-store</code> (Postgres) —
          seeded from <code>rbac.config.js</code>
        </li>
        <li>Policies: backend code only — never persist</li>
        <li>
          Live role edits: <code>/rbac</code> then refresh{" "}
          <code>/me/authorization</code>
        </li>
        <li>
          Frontend: <code>/me/authorization</code> after login
        </li>
        <li>
          Instance UI: <code>/resource/:id/capabilities</code>
        </li>
        <li>Treat all frontend checks as UX hints</li>
      </ul>
    </div>
  );
}

const SECTIONS = {
  guide: GuideSection,
  packages: PackagesSection,
  store: StoreSection,
  integration: IntegrationSection,
  examples: ExamplesSection,
  reference: ReferenceSection,
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
            Aligned with <code>BACKEND_FRONTEND_INTEGRATION.md</code> — including{" "}
            <code>@corpcash/rbac-store</code> Postgres persistence and the{" "}
            <code>/rbac</code> admin API.
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
