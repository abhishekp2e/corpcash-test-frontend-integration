# frontend-integration

Vite + React UI for the Corpcash RBAC POC. Port **5173**. Talks to the backend at `VITE_API_URL` (default `http://localhost:3000`).

**Do not guess the contract.** Follow `../backend-integration/BACKEND_FRONTEND_INTEGRATION.md` (same content as in-app `/docs`). Package READMEs are the API source of truth.

```bash
cp -n .env.example .env
npm install
npm run dev
```

Uses `@corpcash/rbac-react` **^0.3.0** from npm (permission-only `RBACProvider`).
