import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { roleAllowed } from "@/utils/role";

export function RoleRoute({ allowedRoles }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (!roleAllowed(user, allowedRoles)) {
    return <Navigate to="/forbidden" replace />;
  }
  return <Outlet />;
}
