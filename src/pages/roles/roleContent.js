/**
 * Copy and highlights for each exact-role workspace page.
 * Keys must match backend ROLES (viewer, developer, manager, admin).
 */
export const ROLE_CONTENT = {
  viewer: {
    title: "Viewer workspace",
    subtitle: "Read-only access (also called “reader” in product language)",
    description:
      "You can view wallets, transactions, and the dashboard. You cannot create, update, deploy, approve, or delete.",
    highlights: [
      "wallet:read — browse wallet data",
      "transaction:read — browse transactions",
      "dashboard:read — open the main dashboard",
    ],
  },
  developer: {
    title: "Developer workspace",
    subtitle: "Build and ship changes on top of viewer access",
    description:
      "You inherit viewer read access and can create/update wallets plus read and deploy contracts.",
    highlights: [
      "wallet:create / wallet:update — mutate wallets",
      "contract:read / contract:deploy — work with contracts",
      "Inherits viewer read permissions",
    ],
  },
  manager: {
    title: "Manager workspace",
    subtitle: "Operational oversight on top of developer access",
    description:
      "You can approve transactions, delete wallets, and read users and reports, in addition to developer capabilities.",
    highlights: [
      "transaction:approve — approve pending transfers",
      "wallet:delete — remove wallets (may still need ownership policy)",
      "user:read / report:read — people and reporting data",
    ],
  },
  admin: {
    title: "Admin workspace",
    subtitle: "Full system access",
    description:
      "Admin is granted *:* — every resource and action. Policies may still apply on the backend for specific instances.",
    highlights: [
      "*:* — wildcard permission covering all resources and actions",
      "Can open every capability-gated control on the dashboard",
      "Still subject to backend policy checks when registered",
    ],
  },
};

export const ROLE_NAV = [
  { role: "viewer", label: "Viewer", path: "/roles/viewer" },
  { role: "developer", label: "Developer", path: "/roles/developer" },
  { role: "manager", label: "Manager", path: "/roles/manager" },
  { role: "admin", label: "Admin", path: "/roles/admin" },
];
