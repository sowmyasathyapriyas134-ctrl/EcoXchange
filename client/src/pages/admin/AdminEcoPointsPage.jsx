import { Helmet } from "react-helmet-async";
import { useAdminRewardsLeaderboard } from "@/hooks/queries/useAdmin";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { ApiError } from "@/components/errors/ApiError";
import { EmptyState } from "@/components/common/EmptyState";
import { Award, AlertTriangle } from "lucide-react";

export default function AdminEcoPointsPage() {
  const { data: leaderboard, isLoading, isError, error, refetch } = useAdminRewardsLeaderboard();

  const leaderboardData = leaderboard?.data ?? leaderboard ?? [];

  const columns = [
    {
      key: "rank",
      header: "Rank",
      render: (_, i) => <span className="font-bold">#{i + 1}</span>,
    },
    {
      key: "name",
      header: "Citizen",
      render: (u) => <span>{u.name || u.email || "Unnamed User"}</span>,
    },
    {
      key: "ecoPoints",
      header: "EcoPoints Balance",
      render: (u) => <span className="font-semibold text-emerald-600">{u.ecoPoints ?? 0} pts</span>,
    },
  ];

  return (
    <>
      <Helmet>
        <title>EcoPoints Management | EcoXchange Admin</title>
      </Helmet>
      <div className="space-y-6">
        <PageHeader
          title="EcoPoints Ledger"
          description="View active citizen balances and high score leaderboards"
        />

        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/30 p-4 text-amber-900 dark:text-amber-200 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Manual adjustments not supported by the backend</h4>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
              EcoPoints are automatically calculated and issued by the supervisor approval microservice. Direct database write actions are locked for ledger integrity.
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-primary" />
            Top Citizen Earners
          </h3>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading leaderboard…</div>
          ) : isError ? (
            <ApiError message={error?.message || "Failed to load leaderboard"} onRetry={refetch} />
          ) : leaderboardData.length === 0 ? (
            <EmptyState title="No point transactions yet" description="Leaderboard is empty." />
          ) : (
            <DataTable columns={columns} data={leaderboardData} />
          )}
        </div>
      </div>
    </>
  );
}
