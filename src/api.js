const TOKEN_KEY = "rbac_token";

/** Backend origin from env — e.g. http://localhost:3000 */
const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `Request failed (${res.status})`);
  return data;
}

/** Raw admin call — returns status + body (including error payloads). */
async function adminRequest(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const err = new Error(
      (data && data.message) ||
        (data && data.error) ||
        `Request failed (${res.status})`,
    );
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return { status: res.status, data };
}

export const api = {
  register: (body) => request("/auth/register", { method: "POST", body }),
  login: (body) => request("/auth/login", { method: "POST", body }),
  roles: () => request("/auth/roles"),
  /** Backend-computed subject, permissions, and capabilities */
  authorization: () => request("/me/authorization"),
  dashboard: () => request("/dashboard"),
  admin: (path, options) => adminRequest(path, options),
  wallets: () => request("/wallets"),
  createWallet: () => request("/wallets", { method: "POST" }),
  walletCapabilities: (id) => request(`/wallets/${encodeURIComponent(id)}/capabilities`),
  deleteWallet: (id) =>
    request(`/wallets/${encodeURIComponent(id)}`, { method: "DELETE" }),
  transactions: () => request("/transactions"),
  transactionCapabilities: (id) =>
    request(`/transactions/${encodeURIComponent(id)}/capabilities`),
  approveTransaction: (id) =>
    request(`/transactions/${encodeURIComponent(id)}/approve`, { method: "POST" }),
  deployContract: (name) =>
    request("/contracts/deploy", { method: "POST", body: { name } }),
  authorizeDebug: (body) =>
    request("/rbac/authorize", { method: "POST", body }),
};
