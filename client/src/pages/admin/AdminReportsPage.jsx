import { Helmet } from "react-helmet-async";
import { useAdminRevenueSummary, useAdminRevenueAnalytics } from "@/hooks/queries/useAdmin";
import { PageHeader } from "@/components/common/PageHeader";
import { ApiError } from "@/components/errors/ApiError";
import { ProgressBar } from "@/components/common/ProgressBar";
import { FileText, Award } from "lucide-react";

export default function AdminReportsPage() {
  const { data: summary, isLoading: loadSum, isError: errSum, refetch: refSum } = useAdminRevenueSummary();
  const { data: analytics, isLoading: loadAna, isError: errAna, refetch: refAna } = useAdminRevenueAnalytics();

  if (loadSum || loadAna) return <div className="py-12 text-center text-muted-foreground">Generating reports data…</div>;

  if (errSum || errAna) {
    return <ApiError message="Failed to load revenue analytics reports" onRetry={() => { refSum(); refAna(); }} />;
  }

  const analyticsData = analytics?.data ?? analytics ?? [];
  const metrics = summary?.data?.metrics ?? summary?.metrics ?? {};

  // Total sales volume calculation
  const totalSales = analyticsData.reduce((sum, item) => sum + (item.value || 0), 0);

  return (
    <>
      <Helmet>
        <title>Financial Reports | EcoXchange Admin</title>
      </Helmet>
      <div className="space-y-6">
        <PageHeader
          title="Revenue & Performance Reports"
          description="Consolidated sales channels distribution and recycling summaries"
        />

        <div className="grid gap-6 md:grid-cols-2">
          {/* Revenue distribution breakdown */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              Sales Distribution By Source
            </h3>
            {analyticsData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No transaction distribution reports found.</p>
            ) : (
              <div className="space-y-4">
                {analyticsData.map((item, idx) => {
                  const pct = totalSales > 0 ? Math.round((item.value / totalSales) * 100) : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize font-medium">{item.name || "Default Channel"}</span>
                        <span className="text-muted-foreground">₹{item.value} ({pct}%)</span>
                      </div>
                      <ProgressBar value={pct} className="bg-slate-100" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Operational Metrics summary */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-primary" />
              Operational Milestones
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2 text-sm">
                <span className="text-muted-foreground">Recycled Material Processed</span>
                <span className="font-bold">{metrics.totalWasteProcessed ?? 0} kg</span>
              </div>
              <div className="flex items-center justify-between border-b pb-2 text-sm">
                <span className="text-muted-foreground">Recyclers Confirmed Receipts</span>
                <span className="font-bold">{metrics.totalCollections ?? 0} deliveries</span>
              </div>
              <div className="flex items-center justify-between border-b pb-2 text-sm">
                <span className="text-muted-foreground font-semibold text-amber-600">Pending Outgoing Payouts</span>
                <span className="font-bold text-amber-600">₹{metrics.pendingPayouts ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-semibold text-emerald-600">Settled Partner Payments</span>
                <span className="font-bold text-emerald-600">₹{metrics.completedPayouts ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
