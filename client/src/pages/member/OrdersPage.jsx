import { Link } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusChip } from "@/components/common/StatusChip";
import { ApiError } from "@/components/errors/ApiError";
import { DashboardSkeleton } from "@/components/loading/DashboardSkeleton";
import { useOrders } from "@/hooks/queries/useMember";

export default function OrdersPage() {
  const { data, isLoading, isError, refetch, isFetching } = useOrders();
  const orders = (data?.data ?? []).map((o) => ({
    ...o,
    id: o._id,
    date: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—",
  }));

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <ApiError onRetry={refetch} loading={isFetching} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Marketplace purchase history" />
      <DataTable
        columns={[
          { key: "date", header: "Date" },
          { key: "total", header: "Total", render: (r) => `₹${r.total}` },
          {
            key: "paymentStatus",
            header: "Payment",
            render: (r) => <StatusChip status={r.paymentStatus} />,
          },
          {
            key: "deliveryStatus",
            header: "Delivery",
            render: (r) => <StatusChip status={r.deliveryStatus} />,
          },
          {
            key: "actions",
            header: "",
            render: (r) => (
              <Link to={`/member/orders/${r._id}`} className="text-primary text-sm hover:underline">
                View
              </Link>
            ),
          },
        ]}
        data={orders}
        emptyMessage="No orders yet"
      />
    </div>
  );
}
