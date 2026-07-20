import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSupervisorDashboardStats } from "@/hooks/queries/useSupervisor";
import { useSocket } from "@/hooks/useSocket";
import { supervisorKeys } from "@/hooks/queries/useSupervisor";
import toast from "react-hot-toast";
import {
  Users,
  ClipboardCheck,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Wifi,
  WifiOff,
  AlertTriangle,
  BarChart3,
  Map,
  ClipboardList,
} from "lucide-react";

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-blue-100 text-blue-800 border-blue-200",
  assigned: "bg-indigo-100 text-indigo-800 border-indigo-200",
  accepted: "bg-cyan-100 text-cyan-800 border-cyan-200",
  in_progress: "bg-violet-100 text-violet-800 border-violet-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-gray-100 text-gray-800 border-gray-200",
};

const QUICK_ACTIONS = [
  { label: "Assignments", href: "/supervisor/assignments", icon: ClipboardList, color: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
  { label: "Verifications", href: "/supervisor/verifications", icon: ClipboardCheck, color: "bg-green-50 text-green-700 hover:bg-green-100" },
  { label: "Agents", href: "/supervisor/agents", icon: Users, color: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
  { label: "Live Map", href: "/supervisor/map", icon: Map, color: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
  { label: "Analytics", href: "/supervisor/analytics", icon: BarChart3, color: "bg-rose-50 text-rose-700 hover:bg-rose-100" },
];

export default function SupervisorDashboardPage() {
  const qc = useQueryClient();
  const { socket, status: socketStatus } = useSocket();
  const { data, isLoading, isError, refetch } = useSupervisorDashboardStats();

  const stats = data?.data ?? {};
  const recentPickups = useMemo(() => stats.recentPickups ?? [], [stats.recentPickups]);

  // ── Socket listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const refresh = () => {
      qc.invalidateQueries({ queryKey: supervisorKeys.dashboardStats });
    };

    const onTaskCompleted = () => {
      refresh();
      toast("📦 A pickup was completed — verification needed", { icon: "🔔" });
    };

    const onPickupVerified = () => {
      refresh();
    };

    socket.on("task:completed", onTaskCompleted);
    socket.on("task:assigned", refresh);
    socket.on("pickup:verified", onPickupVerified);
    socket.on("pickup:rejected", refresh);

    return () => {
      socket.off("task:completed", onTaskCompleted);
      socket.off("task:assigned", refresh);
      socket.off("pickup:verified", onPickupVerified);
      socket.off("pickup:rejected", refresh);
    };
  }, [socket, qc]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Supervisor Dashboard"
        description="Monitor collections, agents, and verification queue"
        actions={
          <div className="flex items-center gap-3">
            <span
              className={`flex items-center gap-1.5 text-xs ${
                socketStatus === "connected" ? "text-green-600" : "text-amber-500"
              }`}
            >
              {socketStatus === "connected" ? (
                <Wifi className="h-3.5 w-3.5" />
              ) : (
                <WifiOff className="h-3.5 w-3.5" />
              )}
              {socketStatus === "connected" ? "Live" : "Reconnecting…"}
            </span>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Refresh
            </Button>
          </div>
        }
      />

      {/* Pending verification alert */}
      {!isLoading && (stats.pendingVerifications ?? 0) > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="py-3 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  {stats.pendingVerifications} pickup{stats.pendingVerifications > 1 ? "s" : ""} awaiting your verification
                </p>
                <p className="text-xs text-amber-700">Review proof photos and approve or reject</p>
              </div>
            </div>
            <Link to="/supervisor/verifications">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs">
                Review Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today's Collections"
          value={isLoading ? "—" : String(stats.todayCollections ?? 0)}
          icon={Clock}
          hint="pickups created today"
        />
        <StatCard
          label="Pending Verifications"
          value={isLoading ? "—" : String(stats.pendingVerifications ?? 0)}
          icon={ClipboardCheck}
          hint="require review"
          className={(stats.pendingVerifications ?? 0) > 0 ? "border-amber-300" : ""}
        />
        <StatCard
          label="Active Agents"
          value={isLoading ? "—" : String(stats.activeAgents ?? 0)}
          icon={Users}
          hint="online right now"
        />
        <StatCard
          label="Assigned Pickups"
          value={isLoading ? "—" : String(stats.assignedPickups ?? 0)}
          icon={Truck}
          hint="in progress"
        />
      </div>

      {/* Secondary stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Pending Queue"
          value={isLoading ? "—" : String(stats.totalPending ?? 0)}
          icon={Clock}
          hint="awaiting assignment"
        />
        <StatCard
          label="Verified"
          value={isLoading ? "—" : String(stats.totalVerified ?? 0)}
          icon={CheckCircle2}
          hint="all time"
          className="border-green-200"
        />
        <StatCard
          label="Rejected"
          value={isLoading ? "—" : String(stats.totalRejected ?? 0)}
          icon={XCircle}
          hint="verification rejected"
          className={(stats.totalRejected ?? 0) > 0 ? "border-red-200" : ""}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {QUICK_ACTIONS.map(({ label, href, icon: Icon, color }) => (
          <Link
            key={href}
            to={href}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors text-center group ${color}`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Pickups</CardTitle>
              <Link
                to="/supervisor/assignments"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View All <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <CardDescription>Latest pickup activity across the platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-14 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : isError ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Failed to load. <button onClick={() => refetch()} className="text-primary underline">Retry</button>
              </p>
            ) : recentPickups.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No recent pickups</p>
            ) : (
              recentPickups.map((pickup) => (
                <div
                  key={pickup._id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`text-[10px] capitalize border ${STATUS_COLORS[pickup.status] || ""}`}
                        variant="outline"
                      >
                        {pickup.status?.replace(/_/g, " ")}
                      </Badge>
                      <span className="text-xs font-medium capitalize truncate">
                        {pickup.wasteType}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {pickup.user?.fullName ?? "Unknown member"} · {pickup.address}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {new Date(pickup.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Summary Panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Operations Summary</CardTitle>
            <CardDescription>All-time collection statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Total Completed", value: stats.totalCompleted ?? 0, color: "text-green-600" },
              { label: "Total Verified", value: stats.totalVerified ?? 0, color: "text-blue-600" },
              { label: "Pending Queue", value: stats.totalPending ?? 0, color: "text-amber-600" },
              { label: "Verification Rejected", value: stats.totalRejected ?? 0, color: "text-red-600" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className={`font-bold text-lg ${color}`}>{isLoading ? "—" : value}</span>
              </div>
            ))}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">Verification Rate</span>
                <span className="font-bold text-lg">
                  {isLoading
                    ? "—"
                    : stats.totalCompleted > 0
                    ? `${Math.round(((stats.totalVerified ?? 0) / stats.totalCompleted) * 100)}%`
                    : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
