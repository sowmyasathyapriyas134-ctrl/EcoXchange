import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { ChartCard } from "@/components/common/ChartCard";
import { ApiError } from "@/components/errors/ApiError";
import { DashboardSkeleton } from "@/components/loading/DashboardSkeleton";
import { useRevenueSummary, useRevenueHistory, useRecyclerReport } from "@/hooks/queries/useRecycler";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { TrendingUp, ShieldAlert, Heart } from "lucide-react";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function AnalyticsPage() {
  const revenueSummary = useRevenueSummary();
  const revenueHistory = useRevenueHistory();
  const recyclerReport = useRecyclerReport();

  const isLoading = revenueSummary.isLoading || revenueHistory.isLoading || recyclerReport.isLoading;
  const isError = revenueSummary.isError || revenueHistory.isError || recyclerReport.isError;
  const refetch = () => {
    revenueSummary.refetch();
    revenueHistory.refetch();
    recyclerReport.refetch();
  };
  const isFetching = revenueSummary.isFetching || revenueHistory.isFetching || recyclerReport.isFetching;

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <ApiError onRetry={refetch} loading={isFetching} />;

  const history = revenueHistory.data?.data ?? [];
  const report = recyclerReport.data?.data ?? {};

  // Formulate data for monthly/weekly chart from revenue history
  const monthlyRevenueData = history.slice(0, 10).map((h, index) => ({
    name: h.timestamp ? new Date(h.timestamp).toLocaleDateString() : `Day ${index + 1}`,
    revenue: h.amount ?? 0,
  })).reverse();

  // Pie chart material distributions
  const materialData = [
    { name: "Plastic", value: 350 },
    { name: "Paper", value: 200 },
    { name: "Metal", value: 150 },
    { name: "Glass", value: 100 },
    { name: "Organic", value: 50 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics Center"
        description="Detailed breakdowns of material recycling rates, revenue histories, and environmental impact"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Carbon Offset Saved"
          value={`${((report.totalRecycledWeight || 0) * 1.6).toFixed(1)} kg CO2`}
          icon={Heart}
          hint="estimated footprint offset"
          className="border-emerald-200 dark:border-emerald-800"
        />
        <StatCard
          label="Recycling Efficiency"
          value="94.2%"
          icon={TrendingUp}
          hint="processed weight / total incoming"
        />
        <StatCard
          label="Active Facilities"
          value="1 Node"
          icon={ShieldAlert}
          hint="recycling partner center"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ChartCard title="Revenue Stream History" description="Trend analysis of credits and incoming payments">
          <AreaChart data={monthlyRevenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#d1fae5" />
          </AreaChart>
        </ChartCard>

        <ChartCard title="Recycled Materials Composition" description="Weight distribution across waste categories">
          <PieChart>
            <Pie
              data={materialData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {materialData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ChartCard>
      </div>

      <ChartCard title="Weekly Material Output" description="Comparative quantity recycled per week (in kg)">
        <BarChart data={materialData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" name="Weight (kg)" fill="#3b82f6" />
        </BarChart>
      </ChartCard>
    </div>
  );
}
