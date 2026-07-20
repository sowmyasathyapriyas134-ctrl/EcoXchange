import { Helmet } from "react-helmet-async";
import { useAdminAnalyticsOverview } from "@/hooks/queries/useAdmin";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { ApiError } from "@/components/errors/ApiError";
import { DashboardSkeleton } from "@/components/loading/DashboardSkeleton";
import { Users, Trash2, ShieldAlert, Award, IndianRupee, BarChart3 } from "lucide-react";

export default function AdminDashboardPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useAdminAnalyticsOverview();

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

  const stats = data ?? {};

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | EcoXchange</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="space-y-6">
        <PageHeader 
          title="Admin Dashboard" 
          description="Real-time performance and system overview" 
        />
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            label="Total Users" 
            value={String(stats.totalUsers ?? 0)} 
            hint={`Members: ${stats.totalMembers ?? 0} | Trial: ${stats.totalTrialMembers ?? 0}`}
            icon={Users} 
          />
          <StatCard 
            label="Waste Collected" 
            value={`${stats.totalWasteCollected ?? 0} kg`} 
            hint={`Completed Pickups: ${stats.completedPickups ?? 0}`}
            icon={Trash2} 
          />
          <StatCard 
            label="EcoPoints Awarded" 
            value={String(stats.totalEcoPointsAwarded ?? 0)} 
            hint="Redeemed via rewards page"
            icon={Award} 
          />
          <StatCard 
            label="Total Revenue" 
            value={`₹${stats.totalRevenue ?? 0}`} 
            hint="From platform marketplace sales"
            icon={IndianRupee} 
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
              <ShieldAlert className="h-5 w-5 text-primary" />
              Role Distribution
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2 text-sm">
                <span className="text-muted-foreground">Members</span>
                <span className="font-bold">{stats.totalMembers ?? 0}</span>
              </div>
              <div className="flex justify-between border-b pb-2 text-sm">
                <span className="text-muted-foreground">Trial Members</span>
                <span className="font-bold">{stats.totalTrialMembers ?? 0}</span>
              </div>
              <div className="flex justify-between border-b pb-2 text-sm">
                <span className="text-muted-foreground">Supervisors</span>
                <span className="font-bold">{stats.totalSupervisors ?? 0}</span>
              </div>
              <div className="flex justify-between border-b pb-2 text-sm">
                <span className="text-muted-foreground">Delivery Agents</span>
                <span className="font-bold">{stats.totalAgents ?? 0}</span>
              </div>
              <div className="flex justify-between pb-2 text-sm">
                <span className="text-muted-foreground">Recyclers</span>
                <span className="font-bold">{stats.totalRecyclers ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-primary" />
              Pickup Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2 text-sm">
                <span className="text-muted-foreground">Total Requests</span>
                <span className="font-bold">{stats.totalPickups ?? 0}</span>
              </div>
              <div className="flex justify-between border-b pb-2 text-sm">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-bold">{stats.completedPickups ?? 0}</span>
              </div>
              <div className="flex justify-between pb-2 text-sm">
                <span className="text-muted-foreground">Pending Action</span>
                <span className="font-bold">{stats.pendingPickups ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
