import { Helmet } from "react-helmet-async";
import { useAdminDashboard } from "@/hooks/queries/useDashboard";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { ApiError } from "@/components/errors/ApiError";
import { DashboardSkeleton } from "@/components/loading/DashboardSkeleton";
import { Users, Package, ShoppingBag } from "lucide-react";

export default function AdminDashboardPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useAdminDashboard();

  if (isLoading) return <DashboardSkeleton />;
  if (isError) {
    return (
      <ApiError
        message={error instanceof Error ? error.message : "Failed to load dashboard"}
        onRetry={refetch}
        loading={isFetching}
      />
    );
  }

  const stats = data?.data ?? {};

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="space-y-6">
        <PageHeader title="Admin Dashboard" description="Platform overview" />
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Users" value={String(stats.totalUsers ?? "—")} icon={Users} />
          <StatCard label="Orders" value={String(stats.totalOrders ?? "—")} icon={ShoppingBag} />
          <StatCard label="Products" value={String(stats.totalProducts ?? "—")} icon={Package} />
        </div>
      </div>
    </>
  );
}
