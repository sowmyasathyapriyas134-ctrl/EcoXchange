import { useMemo } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSupervisorAnalytics } from "@/hooks/queries/useSupervisor";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  CheckCircle2,
  XCircle,
  Leaf,
  Users,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const PIE_COLORS = ["#22c55e", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4"];

const WASTE_LABELS = {
  plastic: "Plastic",
  paper: "Paper",
  metal: "Metal",
  glass: "Glass",
  organic: "Organic",
  ewaste: "E-Waste",
};

function formatDate({ month, day }) {
  return `${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`;
}

export default function SupervisorAnalyticsPage() {
  const { data, isLoading, refetch } = useSupervisorAnalytics();
  const analytics = data?.data ?? {};

  const wasteByType = useMemo(
    () =>
      (analytics.wasteByType ?? []).map((w) => ({
        name: WASTE_LABELS[w._id] ?? w._id,
        count: w.count,
        weight: Math.round(w.totalWeight * 10) / 10,
      })),
    [analytics.wasteByType]
  );

  const verificationData = useMemo(() => {
    const stats = analytics.verificationStats ?? [];
    return stats.map((s) => ({
      name:
        s._id === "verified"
          ? "Verified"
          : s._id === "rejected"
          ? "Rejected"
          : "Pending",
      value: s.count,
    }));
  }, [analytics.verificationStats]);

  const agentPerformance = useMemo(
    () =>
      (analytics.agentPerformance ?? []).map((a) => ({
        name: a.agent?.name ?? "Unknown",
        tasks: a.completedTasks,
        weight: Math.round(a.totalWeight * 10) / 10,
        points: a.totalPoints,
      })),
    [analytics.agentPerformance]
  );

  const dailyTrend = useMemo(
    () =>
      (analytics.dailyTrend ?? []).map((d) => ({
        date: formatDate(d._id),
        total: d.total,
        completed: d.completed,
      })),
    [analytics.dailyTrend]
  );

  const totalVerified = verificationData.find((d) => d.name === "Verified")?.value ?? 0;
  const totalRejected = verificationData.find((d) => d.name === "Rejected")?.value ?? 0;
  const totalWaste = wasteByType.reduce((s, w) => s + w.weight, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Collection rates, verification stats, and agent performance"
        actions={
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
        }
      />

      {/* Summary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Waste Collected"
          value={isLoading ? "—" : `${Math.round(totalWaste)} kg`}
          icon={Leaf}
          hint="all time"
        />
        <StatCard
          label="Verified Collections"
          value={isLoading ? "—" : String(totalVerified)}
          icon={CheckCircle2}
          className="border-green-200"
        />
        <StatCard
          label="Rejected Verifications"
          value={isLoading ? "—" : String(totalRejected)}
          icon={XCircle}
          className={totalRejected > 0 ? "border-red-200" : ""}
        />
        <StatCard
          label="Top Agent Tasks"
          value={isLoading ? "—" : String(agentPerformance[0]?.tasks ?? 0)}
          icon={Users}
          hint={agentPerformance[0]?.name ?? ""}
        />
      </div>

      {/* Row 1: Daily Trend + Waste by Type */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Trend (30 days) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Daily Collection Trend
            </CardTitle>
            <CardDescription>Pickups created vs completed (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-52 bg-muted rounded-lg animate-pulse" />
            ) : dailyTrend.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend iconSize={10} />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Created"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    name="Completed"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Waste by Type */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Leaf className="h-4 w-4 text-primary" />
              Waste by Category
            </CardTitle>
            <CardDescription>Number of completed collections per waste type</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-52 bg-muted rounded-lg animate-pulse" />
            ) : wasteByType.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={wasteByType} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={60} />
                  <Tooltip />
                  <Bar dataKey="count" name="Collections" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Verification Pie + Agent Performance */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Verification Status Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Verification Status
            </CardTitle>
            <CardDescription>Breakdown of completed pickup verifications</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            {isLoading ? (
              <div className="h-52 w-52 bg-muted rounded-full animate-pulse" />
            ) : verificationData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie
                    data={verificationData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {verificationData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Agent Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Top Agent Performance
            </CardTitle>
            <CardDescription>Completed tasks per agent (all time)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-52 bg-muted rounded-lg animate-pulse" />
            ) : agentPerformance.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={agentPerformance.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="tasks" name="Completed Tasks" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance Table */}
      {agentPerformance.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Agent Performance Table</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs">
                    <th className="text-left pb-2 pr-4">Rank</th>
                    <th className="text-left pb-2 pr-4">Agent</th>
                    <th className="text-right pb-2 pr-4">Completed</th>
                    <th className="text-right pb-2 pr-4">Weight (kg)</th>
                    <th className="text-right pb-2">EcoPoints</th>
                  </tr>
                </thead>
                <tbody>
                  {agentPerformance.map((agent, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="py-2 pr-4 text-muted-foreground font-mono">#{i + 1}</td>
                      <td className="py-2 pr-4 font-medium">{agent.name}</td>
                      <td className="py-2 pr-4 text-right text-green-600 font-semibold">{agent.tasks}</td>
                      <td className="py-2 pr-4 text-right">{agent.weight}</td>
                      <td className="py-2 text-right text-amber-600 font-semibold">{agent.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
