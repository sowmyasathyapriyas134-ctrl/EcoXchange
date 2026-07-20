export { hasPermission, PERMISSIONS } from "@/config/permissions";

export function canAccessRoute(user, allowedRoles) {
  if (!user?.role) return false;
  return allowedRoles.includes(user.role);
}
