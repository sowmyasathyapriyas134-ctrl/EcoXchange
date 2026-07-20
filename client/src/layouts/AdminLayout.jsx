import { adminNav } from "@/config/nav";
import { DashboardNavProvider } from "@/providers/DashboardNavProvider";
import DashboardShell from "@/layouts/DashboardShell";
import { Helmet } from "react-helmet-async";

export default function AdminLayout() {
  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <DashboardNavProvider navItems={adminNav} variant="admin">
        <DashboardShell />
      </DashboardNavProvider>
    </>
  );
}
