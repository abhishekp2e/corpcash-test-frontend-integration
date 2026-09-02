/**
 * DEMO-ONLY policy helpers for the dashboard “Policy examples” panel.
 *
 * Real authorization policies belong on the backend (registerPolicyFor).
 * The frontend must never be the security boundary — these functions exist
 * so developers can see ownership / org+amount / default-deny patterns.
 */

/**
 * Ownership policy: subject may delete only wallets they own.
 * Mirrors a typical backend `wallet:delete` policy.
 */
export function ownershipDeletePolicy({ subject, resource }) {
  if (!subject?.id || !resource?.ownerId) return false;
  return subject.id === resource.ownerId;
}

/**
 * Org + amount policy: same organization required; amounts over the limit
 * need an admin role. Mirrors a typical `transaction:approve` policy.
 */
export function orgAmountApprovePolicy(
  { subject, resource },
  { amountLimit = 100_000 } = {},
) {
  const subjectOrg = subject?.attributes?.organizationId;
  const resourceOrg = resource?.organizationId;
  if (!subjectOrg || !resourceOrg || subjectOrg !== resourceOrg) return false;

  const amount = Number(resource?.amount ?? 0);
  if (amount > amountLimit) {
    return Boolean(subject?.roles?.includes("admin"));
  }
  return true;
}

/**
 * Sample rows for the educational table on the dashboard.
 * Each row assumes the subject already has the matching permission;
 * the policy then allow/denies the instance.
 */
export const POLICY_SCENARIOS = [
  {
    id: "own-wallet",
    policy: "Ownership (wallet:delete)",
    permissionMatched: true,
    subject: { id: "dev-1", roles: ["developer"], attributes: { organizationId: "org_1" } },
    resource: { type: "wallet", id: "wallet_1", ownerId: "dev-1" },
    evaluate: ownershipDeletePolicy,
    note: "Developer deletes their own wallet → allow",
  },
  {
    id: "other-wallet",
    policy: "Ownership (wallet:delete)",
    permissionMatched: true,
    subject: { id: "dev-1", roles: ["developer"], attributes: { organizationId: "org_1" } },
    resource: { type: "wallet", id: "wallet_2", ownerId: "admin-1" },
    evaluate: ownershipDeletePolicy,
    note: "Permission matches, but owner differs → POLICY_DENIED",
  },
  {
    id: "approve-low",
    policy: "Org + amount (transaction:approve)",
    permissionMatched: true,
    subject: { id: "mgr-1", roles: ["manager"], attributes: { organizationId: "org_1" } },
    resource: { type: "transaction", id: "tx_1", organizationId: "org_1", amount: 50_000 },
    evaluate: orgAmountApprovePolicy,
    note: "Same org, amount under limit → allow",
  },
  {
    id: "approve-high",
    policy: "Org + amount (transaction:approve)",
    permissionMatched: true,
    subject: { id: "mgr-1", roles: ["manager"], attributes: { organizationId: "org_1" } },
    resource: { type: "transaction", id: "tx_2", organizationId: "org_1", amount: 500_000 },
    evaluate: orgAmountApprovePolicy,
    note: "Same org, amount over limit, not admin → deny",
  },
  {
    id: "approve-wrong-org",
    policy: "Org + amount (transaction:approve)",
    permissionMatched: true,
    subject: { id: "mgr-1", roles: ["manager"], attributes: { organizationId: "org_1" } },
    resource: { type: "transaction", id: "tx_3", organizationId: "org_2", amount: 10_000 },
    evaluate: orgAmountApprovePolicy,
    note: "Different organization → deny (default deny after policy fail)",
  },
];

/** Run all demo scenarios and attach allow/deny results. */
export function runPolicyScenarios() {
  return POLICY_SCENARIOS.map((scenario) => {
    const policyAllowed = scenario.evaluate({
      subject: scenario.subject,
      resource: scenario.resource,
    });
    // Permission match is a prerequisite; policy failure still denies.
    const allowed = scenario.permissionMatched && policyAllowed;
    return {
      ...scenario,
      allowed,
      reason: !scenario.permissionMatched
        ? "PERMISSION_DENIED"
        : policyAllowed
          ? "AUTHORIZED"
          : "POLICY_DENIED",
    };
  });
}
