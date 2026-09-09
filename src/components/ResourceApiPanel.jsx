import { useState } from "react";
import { api } from "../api";

const ENDPOINTS = [
  { id: "list-wallets", label: "GET /wallets", run: () => api.wallets() },
  { id: "create-wallet", label: "POST /wallets", run: () => api.createWallet() },
  {
    id: "wallet-caps",
    label: "GET /wallets/:id/capabilities",
    needsId: true,
    idLabel: "Wallet id",
    defaultId: "wallet_1",
    run: (id) => api.walletCapabilities(id),
  },
  {
    id: "delete-wallet",
    label: "DELETE /wallets/:id",
    needsId: true,
    idLabel: "Wallet id",
    defaultId: "wallet_1",
    run: (id) => api.deleteWallet(id),
  },
  {
    id: "list-tx",
    label: "GET /transactions",
    run: () => api.transactions(),
  },
  {
    id: "tx-caps",
    label: "GET /transactions/:id/capabilities",
    needsId: true,
    idLabel: "Transaction id",
    defaultId: "tx_1",
    run: (id) => api.transactionCapabilities(id),
  },
  {
    id: "approve-tx",
    label: "POST /transactions/:id/approve",
    needsId: true,
    idLabel: "Transaction id",
    defaultId: "tx_1",
    run: (id) => api.approveTransaction(id),
  },
  {
    id: "deploy",
    label: "POST /contracts/deploy",
    run: () => api.deployContract("demo-contract"),
  },
  {
    id: "authorize",
    label: "POST /rbac/authorize",
    needsBody: true,
    sample: {
      action: "delete",
      resource: { type: "wallet", id: "wallet_1", ownerId: "1" },
    },
    run: (_id, body) => api.authorizeDebug(body),
  },
];

export default function ResourceApiPanel() {
  const [endpointId, setEndpointId] = useState("list-wallets");
  const [resourceId, setResourceId] = useState("wallet_1");
  const [bodyText, setBodyText] = useState(
    JSON.stringify(ENDPOINTS.find((e) => e.id === "authorize").sample, null, 2),
  );
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const endpoint = ENDPOINTS.find((e) => e.id === endpointId) ?? ENDPOINTS[0];

  function onSelect(id) {
    const next = ENDPOINTS.find((e) => e.id === id) ?? ENDPOINTS[0];
    setEndpointId(id);
    if (next.defaultId) setResourceId(next.defaultId);
    if (next.sample) setBodyText(JSON.stringify(next.sample, null, 2));
    setResponse(null);
    setError("");
  }

  async function run() {
    setBusy(true);
    setError("");
    setResponse(null);
    try {
      let body;
      if (endpoint.needsBody) {
        body = bodyText.trim() ? JSON.parse(bodyText) : {};
      }
      const data = await endpoint.run(resourceId, body);
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <h2>Resource APIs (permission + policy)</h2>
      <p className="muted small">
        Live calls with your Bearer token. Instance{" "}
        <code>/capabilities</code> and <code>POST /rbac/authorize</code> run
        policies (ownership, org, amount). Seed:{" "}
        <code>wallet_1.ownerId = &quot;1&quot;</code>,{" "}
        <code>wallet_2.ownerId = &quot;2&quot;</code>, txs in{" "}
        <code>org_1</code> / <code>org_2</code>.
      </p>

      <div className="admin-api-form">
        <label>
          Endpoint
          <select
            value={endpointId}
            onChange={(e) => onSelect(e.target.value)}
          >
            {ENDPOINTS.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </label>

        {endpoint.needsId ? (
          <label>
            {endpoint.idLabel}
            <input
              value={resourceId}
              onChange={(e) => setResourceId(e.target.value)}
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
      {response != null ? (
        <pre className="code-block">{JSON.stringify(response, null, 2)}</pre>
      ) : null}
    </section>
  );
}
