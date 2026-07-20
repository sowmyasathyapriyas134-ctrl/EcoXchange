export function resolveAppRole(user) {
  if (!user?.role) return null;
  if (user.role === "citizen") {
    return user.membershipStatus === "member" ? "member" : "trial_member";
  }
  if (user.role === "delivery") return "delivery_agent";
  return user.role;
}

export function roleAllowed(user, allowedRoles) {
  const appRole = resolveAppRole(user);
  return appRole ? allowedRoles.includes(appRole) : false;
}

export const BACKEND_TO_PUBLIC = {
  trial_member: "trial",
  member: "member",
  supervisor: "supervisor",
  delivery_agent: "delivery",
  recycler: "recycler",
  admin: null,
};

export function toPublicRole(role) {
  return BACKEND_TO_PUBLIC[role] ?? null;
}

export function homePathForRole(role) {
  const appRole = role === "citizen" ? "trial_member" : role;
  const pub = toPublicRole(appRole === "citizen" ? "trial_member" : appRole);
  if (role === "citizen") {
    // fallback; prefer resolveAppRole with full user
    return "/trial/dashboard";
  }
  if (!pub) return "/admin-sowmya/dashboard";
  return `/${pub}/dashboard`;
}

export function homePathForUser(user) {
  const appRole = resolveAppRole(user);
  if (!appRole) return "/login";
  const pub = toPublicRole(appRole);
  if (!pub) return "/admin-sowmya/dashboard";
  return `/${pub}/dashboard`;
}

export function normalizePhone(input) {
  const digits = input.replace(/\D/g, "");
  if (!digits) return "";
  if (input.trim().startsWith("+")) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}
