import { Link } from "react-router-dom";
import { useState } from "react";

const TABS = [
  { id: "guide", label: "Developer guide" },
  { id: "packages", label: "Packages" },
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
                JWT → user → <code>toSubject()</code>
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
                <code>rbac.config.js</code>
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
                Backend <code>rbac.config.js</code>
              </td>
            </tr>
            <tr>
              <td>Policy functions</td>
              <td>Backend only — never expose to client</td>
            </tr>
            <tr>
              <td>Subject identity</td>
              <td>Auth (JWT) → backend load user</td>
            </tr>
            <tr>
              <td>Effective permissions</td>
              <td>Backend computes → frontend</td>
            </tr>
            <tr>
              <td>Generic UI visibility</td>
              <td>
                Frontend <code>can()</code> / <code>&lt;Can&gt;</code>
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
        From the guide §3. Linked locally via <code>file:</code> under{" "}
        <code>corpcash-rback/packages</code>.
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
        <p>Express middleware and NestJS guards. This POC uses Express.</p>
        <ul className="bullet-list">
          <li>
            <code>createRBAC(config)</code>
          </li>
          <li>
            <code>
              createExpressMiddleware({`{ rbac, getSubject }`}) → authorize()
            </code>
          </li>
          <li>401 if no subject · 403 if denied</li>
        </ul>
      </article>

      <article className="docs-card">
        <h3>
          <code>@corpcash/rbac-react</code>
        </h3>
        <p>
          Client adapter: <code>RBACProvider</code>, <code>Can</code>,{" "}
          <code>useCan</code>, <code>RequirePermission</code>,{" "}
          <code>RequireRole</code> from <code>@corpcash/rbac-react</code>.
          <code>RequireRole</code>.
        </p>
        <p className="muted small">
          Uses <strong>permission-only mode</strong> — pass expanded{" "}
          <code>permissions[]</code> from the API, not full role config or
          policies. UX only.
        </p>
      </article>

      <h3>Install</h3>
      <Code>{`# Backend — authoritative packages
npm install @corpcash/rbac-core @corpcash/rbac-node

# Frontend — UX helpers only (pulls core transitively; do not depend on core directly)
npm install @corpcash/rbac-react`}</Code>
    </div>
  );
}

function IntegrationSection() {
  return (
    <div className="docs-section">
      <h2>Integration guide</h2>
      <p className="muted">
        Guide §4–5 adapted to this POC (
        <code>backend-integration</code> + <code>frontend-integration</code>).
        Demo guide uses <code>x-user-id</code>; this app uses{" "}
        <strong>JWT Bearer</strong> auth.
      </p>

      <h3>Repo layout (this stack)</h3>
      <Code>{`feature-poc/
├── corpcash-rback/                 # @corpcash/rbac-* packages
└── rback-check/
    ├── backend-integration/        # Express :3000 (authoritative)
    │   ├── rbac.config.js          # roles, RESOURCES, ACTIONS
    │   ├── auth.js                 # JWT register/login
    │   └── index.js                # authorize + /me/authorization
    └── frontend-integration/       # React :5173 (UX only)
        ├── AuthContext.jsx         # loads /me/authorization
        └── pages/DocsPage.jsx      # this guide`}</Code>

      <h3>1. Backend catalog</h3>
      <p>
        Roles & permissions live only in <code>rbac.config.js</code> (RESOURCES /
        ACTIONS / PERMISSIONS catalog).
      </p>
      <Code>{`roles: {
  viewer:    { permissions: ["wallet:read", "transaction:read", …] },
  developer: { inherits: ["viewer"], permissions: ["wallet:create", …] },
  manager:   { inherits: ["developer"], permissions: ["wallet:delete", …] },
  admin:     { permissions: ["*:*"] },
}`}</Code>

      <h3>2. Subject: JWT → Subject</h3>
      <Code>{`// Production pattern from the guide (this POC implements it)
function resolveUser(req) {
  const claims = verifyJwt(req.headers.authorization);
  return {
    id: claims.sub,
    roles: claims.roles,
    attributes: { /* org, dept, … */ },
  };
}

const { authorize } = createExpressMiddleware({
  rbac,
  getSubject: (req) => req.subject ?? null,
});`}</Code>

      <h3>3. Frontend bootstrap</h3>
      <p>
        After login, <code>AuthProvider</code> calls{" "}
        <code>GET /api/me/authorization</code> (Vite proxy → backend :3000).
      </p>
      <Code>{`AuthProvider → GET /me/authorization (Bearer token)
         ← subject, roles, permissions, capabilities, user
UI gates ← useCan("wallet", "create") via @corpcash/rbac-react`}</Code>

      <h3>4. Two types of frontend authorization</h3>
      <article className="docs-card">
        <h3>Type A — Generic UI (permission-only)</h3>
        <p>
          Not tied to a specific record. Use <code>@corpcash/rbac-react</code>{" "}
          <code>Can</code> / <code>useCan</code> with effective{" "}
          <code>permissions[]</code>.
        </p>
        <Code>{`<Can resource="wallet" action="create">
  <button>Create Wallet</button>
</Can>

const canDeploy = useCan("contract", "deploy");`}</Code>
      </article>

      <article className="docs-card">
        <h3>Type B — Instance-level UI (policy-aware)</h3>
        <p>
          Ownership / org / amount rules. Fetch backend-computed capabilities —
          <strong> do not</strong> reimplement policies in React.
        </p>
        <Code>{`// Guide pattern (full demo)
GET /wallets/:id/capabilities
→ { capabilities: { delete: { allowed, reason, matchedPermission } } }

// This POC today: flat capability map on /me/authorization
// (permission-level). Add per-resource /capabilities when you store instances.`}</Code>
      </article>

      <h3>Local run</h3>
      <Code>{`# Terminal 1 — backend
cd rback-check/backend-integration && npm run dev   # :3000

# Terminal 2 — frontend
cd rback-check/frontend-integration && npm run dev  # :5173`}</Code>
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

      <h3>Node — Express guards</h3>
      <Code>{`import { createRBAC } from "@corpcash/rbac-node";
import { createExpressMiddleware } from "@corpcash/rbac-node/express";

const rbac = createRBAC(rbacConfig);
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
      <Code>{`GET /wallets/wallet_1/capabilities

{
  "resource": { "type": "wallet", "id": "wallet_1", "ownerId": "dev-1" },
  "capabilities": {
    "read":   { "allowed": true,  "reason": "AUTHORIZED", … },
    "delete": { "allowed": false, "reason": "POLICY_DENIED", … }
  }
}`}</Code>

      <h3>Auth endpoints (this POC)</h3>
      <ul className="bullet-list">
        <li>
          <code>POST /auth/register</code> — username, password, role
        </li>
        <li>
          <code>POST /auth/login</code> — returns JWT
        </li>
        <li>
          <code>GET /auth/roles</code> — roles for registration UI
        </li>
        <li>
          <code>GET /me/authorization</code> — permissions + capabilities
        </li>
        <li>
          <code>GET /dashboard</code> —{" "}
          <code>authorize(dashboard, read)</code>
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
          Demo <code>x-user-id</code> → production JWT / session (this POC already
          uses JWT)
        </li>
        <li>Role definitions: backend only (file or DB)</li>
        <li>Policies: backend code only</li>
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
            Aligned with{" "}
            <code>BACKEND_FRONTEND_INTEGRATION.md</code> — packages, six
            concepts, Type A/B UI, APIs, flows, and this POC’s JWT wiring.
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
