import { Helmet } from "react-helmet-async";
import { useAdminPickups } from "@/hooks/queries/useAdmin";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusChip } from "@/components/common/StatusChip";
import { ApiError } from "@/components/errors/ApiError";
import { EmptyState } from "@/components/common/EmptyState";

export default function AdminPickupsPage() {
  const { data, isLoading, isError, error, refetch } = useAdminPickups();

  const pickups = data?.data ?? data ?? [];

  const columns = [
    {
      key: "id",
      header: "Pickup ID",
      render: (p) => <span className="font-mono text-xs">{p._id}</span>,
    },
    {
      key: "user",
      header: "Member",
      render: (p) => <span>{p.user?.name || "—"}</span>,
    },
    {
      key: "wasteType",
      header: "Waste Type",
      render: (p) => <span className="capitalize">{p.wasteType}</span>,
    },
    {
      key: "weight",
      header: "Estimated Weight",
      render: (p) => <span>{p.weight || p.actualWeight || 0} kg</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (p) => <StatusChip status={p.status || "pending"} />,
    },
    {
      key: "agent",
      header: "Assigned Agent",
      render: (p) => <span>{p.deliveryAgent?.name || "Unassigned"}</span>,
    },
    {
      key: "createdAt",
      header: "Requested Date",
      render: (p) => <span>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}</span>,
    },
  ];

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Loading pickups…</div>;
  if (isError) {
    return (
      <ApiError
        message={error instanceof Error ? error.message : "Failed to load waste pickups"}
        onRetry={refetch}
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>Manage Waste Pickups | EcoXchange Admin</title>
      </Helmet>
      <div className="space-y-6">
        <PageHeader
          title="Waste Pickups"
          description="Monitor and audit waste collection requests and delivery agents status"
        />
        {pickups.length === 0 ? (
          <EmptyState title="No pickups found" description="Pickups will be listed here once citizens submit collection requests." />
        ) : (
          <DataTable columns={columns} data={pickups} />
        )}
      </div>
    </>
  );
}
