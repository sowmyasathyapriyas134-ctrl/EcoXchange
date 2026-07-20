import { Helmet } from "react-helmet-async";
import { useAdminRevenueSummary, useAdminRevenueHistory } from "@/hooks/queries/useAdmin";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { DataTable } from "@/components/common/DataTable";
import { ApiError } from "@/components/errors/ApiError";
import { EmptyState } from "@/components/common/EmptyState";
import { IndianRupee, CreditCard, Clock, Activity } from "lucide-react";

export default function AdminPaymentsPage() {
  const { data: summary, isLoading: loadSummary, isError: errSummary, error: errorSummary, refetch: refSummary } = useAdminRevenueSummary();
  const { data: history, isLoading: loadHistory } = useAdminRevenueHistory();

  if (loadSummary || loadHistory) return <div className="py-12 text-center text-muted-foreground">Loading payment details…</div>;
  
  if (errSummary) {
    return <ApiError message={errorSummary?.message || "Failed to load revenue summary"} onRetry={refSummary} />;
  }

  const earnings = summary?.earnings ?? {};
  const metrics = summary?.metrics ?? {};
  const historyData = history?.data ?? history ?? [];

  const columns = [
    {
      key: "id",
      header: "Transaction ID",
      render: (t) => <span className="font-mono text-xs">{t._id}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      render: (t) => <span className="font-semibold text-emerald-600">₹{t.amount}</span>,
    },
    {
      key: "source",
      header: "Channel",
      render: (t) => <span className="capitalize">{t.source || "System"}</span>,
    },
    {
      key: "type",
      header: "Type",
      render: (t) => <span className="capitalize">{t.type}</span>,
    },
    {
      key: "timestamp",
      header: "Timestamp",
      render: (t) => <span>{t.timestamp ? new Date(t.timestamp).toLocaleString() : "—"}</span>,
    },
  ];

  return (
    <>
      <Helmet>
        <title>Payments & Payouts | EcoXchange Admin</title>
      </Helmet>
      <div className="space-y-6">
        <PageHeader
          title="Payments & Revenue"
          description="View platform marketplace transaction earnings and recycler payouts status"
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Today's Earnings"
            value={`₹${earnings.today ?? 0}`}
            icon={IndianRupee}
          />
          <StatCard
            label="Monthly Revenue"
            value={`₹${earnings.monthly ?? 0}`}
            icon={CreditCard}
          />
          <StatCard
            label="Pending Payouts"
            value={`₹${metrics.pendingPayouts ?? 0}`}
            icon={Clock}
          />
          <StatCard
            label="Completed Payouts"
            value={`₹${metrics.completedPayouts ?? 0}`}
            icon={Activity}
          />
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-lg mb-4">Transaction History</h3>
          {historyData.length === 0 ? (
            <EmptyState title="No transactions" description="Platform transaction histories will show up here." />
          ) : (
            <DataTable columns={columns} data={historyData} />
          )}
        </div>
      </div>
    </>
  );
}
