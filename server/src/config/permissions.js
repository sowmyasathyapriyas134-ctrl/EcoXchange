/**
 * Central permission map — backend source of truth.
 * Frontend mirrors these keys in client/src/config/permissions.ts
 */

const PERMISSIONS = {
  trial_member: [
    "marketplace.buy",
    "pickup.create",
    "trial.submit",
    "rewards.preview",
    "referral.limited",
    "membership.upgrade",
  ],
  member: [
    "marketplace.buy",
    "marketplace.sell",
    "pickup.create",
    "wallet.view",
    "wallet.withdraw",
    "rewards.full",
    "referral.full",
    "refill.redeem",
  ],
  supervisor: [
    "assignTask",
    "verifyWaste",
    "approveMarketplace",
    "viewAgents",
    "viewMembers",
    "reports.view",
  ],
  delivery_agent: [
    "scanQR",
    "uploadProof",
    "updateLocation",
    "viewTasks",
    "completeTask",
  ],
  recycler: [
    "shipments.view",
    "shipments.manage",
    "payments.create",
    "schedules.manage",
    "inventory.manage",
  ],
  admin: ["*"],
};

function hasPermission(role, permission) {
  if (!role) return false;
  const list = PERMISSIONS[role];
  if (!list) return false;
  if (list.includes("*")) return true;
  return list.includes(permission);
}

module.exports = { PERMISSIONS, hasPermission };
