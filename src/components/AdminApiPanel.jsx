import { useCan } from "@corpcash/rbac-react";
import { useCallback, useState } from "react";
import { api } from "../api";
import { useAuth } from "../AuthContext";

const ENDPOINTS = [
  {
    id: "list-roles",
    label: "GET /rbac/roles",
    method: "GET",
    path: "/rbac/roles",
    needsBody: false,
  },
  {
    id: "create-role",
    label: "POST /rbac/roles",
    method: "POST",
    path: "/rbac/roles",
    needsBody: true,
    mutatesGraph: true,
    sample: {
      name: "auditor",
      permissions: ["wallet:read", "transaction:read"],
      inherits: [],
    },
  },
  {
    id: "get-role",
    label: "GET /rbac/roles/:name",
    method: "GET",
    pathTemplate: (name) => `/rbac/roles/${encodeURIComponent(name || "viewer")}`,
    needsName: true,
    needsBody: false,
  },
  {
    id: "put-role",
    label: "PUT /rbac/roles/:name",
    method: "PUT",
    pathTemplate: (name) => `/rbac/roles/${encodeURIComponent(name || "auditor")}`,
    needsName: true,
    needsBody: true,
    mutatesGraph: true,
    sample: {
      permissions: ["wallet:read"],
      inherits: ["viewer"],
    },
  },
  {
    id: "delete-role",
    label: "DELETE /rbac/roles/:name",
    method: "DELETE",
    pathTemplate: (name) => `/rbac/roles/${encodeURIComponent(name || "auditor")}`,
    needsName: true,
    needsBody: false,
    mutatesGraph: true,
  },
  {
    id: "get-subject-roles",
    label: "GET /rbac/subjects/:id/roles",
    method: "GET",
    pathTemplate: (_n, id) => `/rbac/subjects/${encodeURIComponent(id || "1")}/roles`,
    needsSubjectId: true,
    needsBody: false,
  },
  {
    id: "put-subject-roles",
    label: "PUT /rbac/subjects/:id/roles",
    method: "PUT",
    pathTemplate: (_n, id) => `/rbac/subjects/${encodeURIComponent(id || "1")}/roles`,
    needsSubjectId: true,
    needsBody: true,
    mutatesAssignments: true,
    sample: { roles: ["developer"] },
  },
  {
    id: "post-subject-role",
    label: "POST /rbac/subjects/:id/roles",
    method: "POST",
    pathTemplate: (_n, id) => `/rbac/subjects/${encodeURIComponent(id || "1")}/roles`,
    needsSubjectId: true,
    needsBody: true,
    mutatesAssignments: true,
    sample: { role: "viewer" },
  },
  {
    id: "delete-subject-role",
    label: "DELETE /rbac/subjects/:id/roles/:role",
    method: "DELETE",
    pathTemplate: (name, id) =>
      `/rbac/subjects/${encodeURIComponent(id || "1")}/roles/${encodeURIComponent(name || "viewer")}`,
    needsName: true,
    needsSubjectId: true,
    needsBody: false,
    mutatesAssignments: true,
  },
  {
    id: "get-settings",
    label: "GET /rbac/settings",
    method: "GET",
    path: "/rbac/settings",
    needsBody: false,
  },
  {
    id: "patch-settings",
    label: "PATCH /rbac/settings",
    method: "PATCH",
    path: "/rbac/settings",
    needsBody: true,
    mutatesGraph: true,
    sample: { strictRoles: false },
  },
];

export default function AdminApiPanel({ userId }) {
  const canManage = useCan("rbac", "manage");
  const { refreshAuthorization } = useAuth();
  const [endpointId, setEndpointId] = useState("list-roles");
  const [roleName, setRoleName] = useState("auditor");
  const [subjectId, setSubjectId] = useState(String(userId ?? "1"));
  const [bodyText, setBodyText] = useState(
    JSON.stringify(ENDPOINTS[1].sample, null, 2),
  );
  const [status, setStatus] = useState(null);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const endpoint = ENDPOINTS.find((e) => e.id === endpointId) ?? ENDPOINTS[0];

  const onSelectEndpoint = useCallback((id) => {
    const next = ENDPOINTS.find((e) => e.id === id) ?? ENDPOINTS[0];
    setEndpointId(id);
    if (next.sample) {
      setBodyText(JSON.stringify(next.sample, null, 2));
    }
    setStatus(null);
    setResponse(null);
    setError("");
    setNote("");
  }, []);

  async function run() {
    setBusy(true);
    setError("");
    setNote("");
    setStatus(null);
    setResponse(null);
    try {
      const path = endpoint.pathTemplate
        ? endpoint.pathTemplate(roleName, subjectId)
        : endpoint.path;
      let body;
      if (endpoint.needsBody) {
        body = bodyText.trim() ? JSON.parse(bodyText) : {};
      }
      const result = await api.admin(path, { method: endpoint.method, body });
      setStatus(result.status);
      setResponse(result.data);

      if (endpoint.mutatesGraph || endpoint.mutatesAssignments) {
        await refreshAuthorization();
        setNote(
          endpoint.mutatesGraph
            ? "Role graph updated in Postgres and engine reloaded. Session permissions refreshed."
            : "Subject assignments updated in Postgres. Session permissions refreshed.",
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      if (err.status) setStatus(err.status);
      if (err.data !== undefined) setResponse(err.data);
    } finally {
      setBusy(false);
    }
  }

  if (!canManage) {
    return (
      <section className="panel">
        <h2>Interactive Admin API (@corpcash/rbac-store)</h2>
        <p className="muted small">
          Requires <code>rbac:manage</code> (admins with <code>*:*</code>). Sign
          in as an admin to mutate the Postgres-backed role graph via{" "}
          <code>/rbac/*</code>.
        </p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>Interactive Admin API (@corpcash/rbac-store)</h2>
      <p className="muted small">
        Live calls to <code>createRbacAdminRouter</code>. Roles / assignments
        persist in Postgres (<code>rbac_roles</code>,{" "}
        <code>rbac_assignments</code>). Policies stay in backend code.
      </p>

      <div className="admin-api-form">
        <label>
          Endpoint
          <select
            value={endpointId}
            onChange={(e) => onSelectEndpoint(e.target.value)}
          >
            {ENDPOINTS.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </label>

        {endpoint.needsName ? (
          <label>
            Role name
            <input
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
            />
          </label>
        ) : null}

        {endpoint.needsSubjectId ? (
          <label>
            Subject id
            <input
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            />
          </label>
        ) : null}

        {endpoint.needsBody ? (
          <label>
            JSON body
            <textarea
              className="admin-api-body"
              rows={8}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              spellCheck={false}
            />
          </label>
        ) : null}

        <button type="button" onClick={run} disabled={busy}>
          {busy ? "Calling…" : "Send request"}
        </button>
      </div>

      {error ? <p className="error">{error}</p> : null}
      {note ? <p className="muted small">{note}</p> : null}

      {status != null ? (
        <p className="muted small">
          Status: <strong>{status}</strong>
        </p>
      ) : null}

      {response != null ? (
        <pre className="code-block">
          {typeof response === "string"
            ? response
            : JSON.stringify(response, null, 2)}
        </pre>
      ) : null}
    </section>
  );
}
