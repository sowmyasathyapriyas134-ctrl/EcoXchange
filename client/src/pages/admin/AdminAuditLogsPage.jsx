import { Helmet } from "react-helmet-async";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { AlertCircle } from "lucide-react";

export default function AdminAuditLogsPage() {
  return (
    <>
      <Helmet>
        <title>Audit Logs | EcoXchange Admin</title>
      </Helmet>
      <div className="space-y-6">
        <PageHeader
          title="System Audit Logs"
          description="Read-only logging of administrative and high-privilege operations"
        />
        <EmptyState
          icon={AlertCircle}
          title="Feature Coming Soon"
          description="Direct audit logging capabilities are currently not supported by the express backend API. Subscriptions to MongoDB Change Streams are in progress."
        />
      </div>
    </>
  );
}
