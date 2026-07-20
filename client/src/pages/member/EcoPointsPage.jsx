import { Link } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { ApiError } from "@/components/errors/ApiError";
import { DashboardSkeleton } from "@/components/loading/DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useEcoPoints, useRedemptions } from "@/hooks/queries/useMember";

export default function EcoPointsPage() {
  const points = useEcoPoints();
  const redemptions = useRedemptions();

  if (points.isLoading) return <DashboardSkeleton />;
  if (points.isError) return <ApiError onRetry={points.refetch} loading={points.isFetching} />;

  const ecoPoints = points.data?.data?.ecoPoints ?? points.data?.ecoPoints ?? 0;
  const history = redemptions.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="EcoPoints"
        description="Earn points by recycling and redeem rewards"
        actions={
          <Button asChild>
            <Link to="/member/rewards">Browse rewards</Link>
          </Button>
        }
      />
      <StatCard label="Your balance" value={String(ecoPoints)} icon={Sparkles} className="max-w-sm" />
      <Card>
        <CardHeader><CardTitle className="text-base">Redemption history</CardTitle></CardHeader>
        <CardContent>
          {redemptions.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No redemptions yet</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {history.map((r) => (
                <li key={r._id} className="flex justify-between border-b pb-2">
                  <span>{r.reward?.title || "Reward"}</span>
                  <span className="text-muted-foreground">-{r.pointsSpent} pts</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
