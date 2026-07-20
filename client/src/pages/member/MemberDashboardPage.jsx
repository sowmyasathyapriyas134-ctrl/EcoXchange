import { Link } from "react-router-dom";
import { Flame, Package, ShoppingBag, Sparkles, Truck } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { AnalyticsCard } from "@/components/common/AnalyticsCard";
import { ApiError } from "@/components/errors/ApiError";
import { DashboardSkeleton } from "@/components/loading/DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { useMemberAnalytics, useMemberDashboard } from "@/hooks/queries/useMember";
import { useAuthStore } from "@/store/auth.store";

export default function MemberDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const dash = useMemberDashboard();
  const analytics = useMemberAnalytics();

  if (dash.isLoading) return <DashboardSkeleton />;
  if (dash.isError) return <ApiError onRetry={dash.refetch} loading={dash.isFetching} />;

  const stats = dash.data?.data ?? {};
  const overview = analytics.data?.data ?? {};

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.name || "Member"}`}
        description="Your sustainability hub"
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/member/pickups/new">Schedule pickup</Link>
            </Button>
            <Button asChild>
              <Link to="/member/marketplace">Shop marketplace</Link>
            </Button>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Eco points" value={String(stats.ecoPoints ?? user?.ecoPoints ?? 0)} icon={Sparkles} />
        <StatCard label="Streak" value={String(stats.streak ?? user?.streak ?? 0)} icon={Flame} />
        <StatCard label="Submissions" value={String(stats.totalSubmissions ?? overview.totalPickups ?? 0)} icon={Package} />
        <StatCard label="Orders" value={String(stats.totalOrders ?? 0)} icon={ShoppingBag} />
      </div>
      {!analytics.isError && (
        <div className="grid gap-4 md:grid-cols-2">
          <AnalyticsCard title="Impact" description="Your recycling contribution">
            <ul className="text-sm space-y-2">
              <li>Recycled: {overview.totalRecycledKg ?? 0} kg</li>
              <li>Carbon saved: {overview.carbonSavedKg ?? 0} kg CO₂</li>
              <li>Trees saved: {overview.treesSaved ?? 0}</li>
            </ul>
          </AnalyticsCard>
          <AnalyticsCard title="Membership" description={stats.membershipStatus || user?.membershipStatus}>
            <p className="text-sm text-muted-foreground mb-3">
              Plan: {overview.currentMembership ?? user?.membershipPlan ?? "—"}
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/member/membership">Manage membership</Link>
            </Button>
          </AnalyticsCard>
        </div>
      )}
      <AnalyticsCard title="Quick actions">
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" size="sm"><Link to="/member/wallet">Wallet</Link></Button>
          <Button asChild variant="secondary" size="sm"><Link to="/member/tracking">Track pickups</Link></Button>
          <Button asChild variant="secondary" size="sm"><Link to="/member/rewards">Rewards</Link></Button>
          <Button asChild variant="secondary" size="sm"><Link to="/member/calendar"><Truck className="h-3 w-3 mr-1 inline" />Calendar</Link></Button>
        </div>
      </AnalyticsCard>
    </div>
  );
}
