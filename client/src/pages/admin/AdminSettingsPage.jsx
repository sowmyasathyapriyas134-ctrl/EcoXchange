import { Helmet } from "react-helmet-async";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Settings } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <>
      <Helmet>
        <title>Settings | EcoXchange Admin</title>
      </Helmet>
      <div className="space-y-6">
        <PageHeader
          title="System Settings"
          description="Global configuration and features toggles"
        />
        <EmptyState
          icon={Settings}
          title="Settings Unavailable"
          description="System configuration changes are managed via environment variables and Docker configuration. No backend API is currently configured for admin dashboard settings writes."
        />
      </div>
    </>
  );
}
