import { Helmet } from "react-helmet-async";
import { useAdminWalletLedger } from "@/hooks/queries/useAdmin";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { ApiError } from "@/components/errors/ApiError";
import { EmptyState } from "@/components/common/EmptyState";

export default function AdminWalletPage() {
  const { data, isLoading, isError, error, refetch } = useAdminWalletLedger();

  const ledger = data?.data ?? data ?? [];

  const columns = [
    {
      key: "id",
      header: "Tx ID",
      render: (t) => <span className="font-mono text-xs">{t._id}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      render: (t) => (
        <span className={t.type === "credit" ? "text-emerald-600 font-semibold" : "text-destructive font-semibold"}>
          {t.type === "credit" ? "+" : "-"}₹{t.amount}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (t) => <span className="capitalize">{t.type}</span>,
    },
    {
      key: "source",
      header: "Source",
      render: (t) => <span>{t.source || "—"}</span>,
    },
    {
      key: "description",
      header: "Description",
      render: (t) => <span>{t.description || "No description"}</span>,
    },
    {
      key: "timestamp",
      header: "Date/Time",
      render: (t) => <span>{t.timestamp ? new Date(t.timestamp).toLocaleString() : "—"}</span>,
    },
  ];

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Loading ledger transactions…</div>;
  if (isError) {
    return (
      <ApiError
        message={error instanceof Error ? error.message : "Failed to load wallet ledger"}
        onRetry={refetch}
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>Wallet Ledger | EcoXchange Admin</title>
      </Helmet>
      <div className="space-y-6">
        <PageHeader
          title="Platform Wallet Ledger"
          description="View financial transactions, credits, and withdrawals audit trails"
        />
        {ledger.length === 0 ? (
          <EmptyState title="No transactions yet" description="Wallet activities will be listed here when credits or debits occur." />
        ) : (
          <DataTable columns={columns} data={ledger} />
        )}
      </div>
    </>
  );
}
