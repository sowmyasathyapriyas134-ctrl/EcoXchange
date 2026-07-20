import { trialNav } from "./nav.trial";
import { memberNav } from "./nav.member";
import { supervisorNav } from "./nav.supervisor";
import { deliveryNav } from "./nav.delivery";
import { recyclerNav } from "./nav.recycler";
import { adminNav } from "./nav.admin";

const NAV_BY_ROLE = {
  trial_member: trialNav,
  member: memberNav,
  supervisor: supervisorNav,
  delivery_agent: deliveryNav,
  recycler: recyclerNav,
  admin: adminNav,
};

/** @param {string | undefined | null} role */
export function getNavForRole(role) {
  if (!role) return [];
  return NAV_BY_ROLE[role] ?? [];
}

export function getAllNavItems() {
  return Object.values(NAV_BY_ROLE).flat();
}

export { trialNav, memberNav, supervisorNav, deliveryNav, recyclerNav, adminNav };
