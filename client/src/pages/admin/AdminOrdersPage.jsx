import { Helmet } from "react-helmet-async";
import { useAdminMarketplaceOrders } from "@/hooks/queries/useAdmin";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusChip } from "@/components/common/StatusChip";
import { ApiError } from "@/components/errors/ApiError";
import { EmptyState } from "@/components/common/EmptyState";

export default function AdminOrdersPage() {
  const { data, isLoading, isError, error, refetch } = useAdminMarketplaceOrders();

  const orders = data?.data ?? data ?? [];

  const columns = [
    {
      key: "id",
      header: "Order ID",
      render: (o) => <span className="font-mono text-xs">{o._id}</span>,
    },
    {
      key: "user",
      header: "Citizen",
      render: (o) => <span>{o.user?.name || o.user?.email || "Unknown User"}</span>,
    },
    {
      key: "items",
      header: "Items Count",
      render: (o) => <span>{o.items?.length || 0} items</span>,
    },
    {
      key: "totalAmount",
      header: "Total Amount",
      render: (o) => <span>₹{o.totalAmount}</span>,
    },
    {
      key: "paymentStatus",
      header: "Payment Status",
      render: (o) => <StatusChip status={o.paymentStatus || "pending"} />,
    },
    {
      key: "status",
      header: "Order Status",
      render: (o) => <StatusChip status={o.status || "pending"} />,
    },
    {
      key: "createdAt",
      header: "Date",
      render: (o) => <span>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—"}</span>,
    },
  ];

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Loading orders…</div>;
  if (isError) {
    return (
      <ApiError
        message={error instanceof Error ? error.message : "Failed to load marketplace orders"}
        onRetry={refetch}
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>Marketplace Orders | EcoXchange Admin</title>
      </Helmet>
      <div className="space-y-6">
        <PageHeader
          title="Marketplace Orders"
          description="Monitor and manage all orders placed on the citizen marketplace"
        />
        {orders.length === 0 ? (
          <EmptyState title="No orders placed yet" description="Orders will show up here when citizens buy products." />
        ) : (
          <DataTable columns={columns} data={orders} />
        )}
      </div>
    </>
  );
}
