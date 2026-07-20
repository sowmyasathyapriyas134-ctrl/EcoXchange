import { useAuthStore } from "@/store/auth.store";
import { getNavForRole } from "@/config/nav";
import { resolveAppRole } from "@/utils/role";
import { DashboardNavProvider } from "@/providers/DashboardNavProvider";
import DashboardShell from "@/layouts/DashboardShell";

export default function RoleLayout() {
  const user = useAuthStore((s) => s.user);
  const navItems = getNavForRole(resolveAppRole(user));

  return (
    <DashboardNavProvider navItems={navItems} variant="default">
      <DashboardShell />
    </DashboardNavProvider>
  );
}
