import { Helmet } from "react-helmet-async";
import { useAdminWasteByType, useAdminMonthlyTrends } from "@/hooks/queries/useAdmin";
import { PageHeader } from "@/components/common/PageHeader";
import { ApiError } from "@/components/errors/ApiError";
import { ProgressBar } from "@/components/common/ProgressBar";
import { BarChart3, TrendingUp } from "lucide-react";

export default function AdminAnalyticsPage() {
  const { data: waste, isLoading: loadWaste, isError: errWaste, refetch: refWaste } = useAdminWasteByType();
  const { data: trends, isLoading: loadTrends, isError: errTrends, refetch: refTrends } = useAdminMonthlyTrends();

  if (loadWaste || loadTrends) {
    return <div className="py-12 text-center text-muted-foreground">Analyzing system metrics…</div>;
  }

  if (errWaste || errTrends) {
    return (
      <div className="space-y-4">
        <ApiError message="Failed to load platform analytics details" onRetry={() => { refWaste(); refTrends(); }} />
      </div>
    );
  }

  const wasteData = waste?.data ?? waste ?? [];
  const trendsData = trends?.data ?? trends ?? [];

  // Calculate percentage of total weight for waste types
  const totalWeight = wasteData.reduce((sum, item) => sum + (item.totalWeight || 0), 0);

  return (
    <>
      <Helmet>
        <title>Analytics Panel | EcoXchange Admin</title>
      </Helmet>
      <div className="space-y-6">
        <PageHeader
          title="System Analytics"
          description="Detailed metrics on waste processing efficiency, recyclables volume and monthly metrics"
        />

        <div className="grid gap-6 md:grid-cols-2">
          {/* Waste type distribution card */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-primary" />
              Waste Collected by Material Type
            </h3>
            {wasteData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No completed waste pickups recorded.</p>
            ) : (
              <div className="space-y-4">
                {wasteData.map((item) => {
                  const pct = totalWeight > 0 ? Math.round((item.totalWeight / totalWeight) * 100) : 0;
                  return (
                    <div key={item._id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize font-medium">{item._id || "Other"}</span>
                        <span className="text-muted-foreground">{item.totalWeight} kg ({pct}%)</span>
                      </div>
                      <ProgressBar value={pct} className="bg-slate-100" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Monthly Trends */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              Monthly Collection Trends
            </h3>
            {trendsData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No monthly historical trend data available.</p>
            ) : (
              <div className="space-y-3">
                {trendsData.map((t, idx) => {
                  const year = t._id?.year ?? "—";
                  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                  const monthIdx = t._id?.month ? t._id.month - 1 : 0;
                  const monthName = monthNames[monthIdx] || "—";
                  return (
                    <div key={idx} className="flex items-center justify-between border-b pb-2 text-sm last:border-0 last:pb-0">
                      <div>
                        <span className="font-semibold">{monthName} {year}</span>
                      </div>
                      <div className="flex gap-4 text-right">
                        <div>
                          <span className="text-xs text-muted-foreground block">Pickups</span>
                          <span className="font-bold">{t.pickups ?? 0}</span>
                        </div>
                        <div>
                          <span className="text-xs text-emerald-600 block">Completed</span>
                          <span className="font-bold text-emerald-600">{t.completedPickups ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
