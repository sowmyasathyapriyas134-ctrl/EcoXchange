import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/hooks/useSocket";
import { useRecyclerDashboard, recyclerKeys } from "@/hooks/queries/useRecycler";
import { ApiError } from "@/components/errors/ApiError";
import { DashboardSkeleton } from "@/components/loading/DashboardSkeleton";
import toast from "react-hot-toast";
import {
  PackageOpen,
  Cog,
  CheckCircle2,
  IndianRupee,
  Scale,
  Package,
  Boxes,
  Truck,
  Store,
  FileText,
  BarChart3,
  ChevronRight,
  Wifi,
  WifiOff,
  Heart,
} from "lucide-react";

const QUICK_ACTIONS = [
  { label: "Incoming Waste", href: "/recycler/incoming", icon: PackageOpen, color: "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400" },
  { label: "Processing", href: "/recycler/processing", icon: Cog, color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400" },
  { label: "Shipments", href: "/recycler/shipments", icon: Truck, color: "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400" },
  { label: "Marketplace", href: "/recycler/marketplace", icon: Store, color: "bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-400" },
  { label: "Reports", href: "/recycler/reports", icon: FileText, color: "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400" },
  { label: "Analytics", href: "/recycler/analytics", icon: BarChart3, color: "bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:text-cyan-400" },
];

export default function RecyclerDashboardPage() {
  const qc = useQueryClient();
  const { socket, status: socketStatus } = useSocket();
  const { data, isLoading, isError, refetch, isFetching } = useRecyclerDashboard();

  const stats = useMemo(() => data?.data ?? {}, [data]);

  // ── Socket listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const refresh = () => {
      qc.invalidateQueries({ queryKey: recyclerKeys.dashboard });
    };

    const onPickupCompleted = () => {
      refresh();
      toast("📦 New waste pickup completed — ready for processing", { icon: "🔔" });
    };

    socket.on("pickup_update", refresh);
    socket.on("shipment_update", refresh);
    socket.on("order_update", refresh);
    socket.on("payment_update", refresh);
    socket.on("pickup:completed", onPickupCompleted);

    return () => {
      socket.off("pickup_update", refresh);
      socket.off("shipment_update", refresh);
      socket.off("order_update", refresh);
      socket.off("payment_update", refresh);
      socket.off("pickup:completed", onPickupCompleted);
    };
  }, [socket, qc]);

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <ApiError onRetry={refetch} loading={isFetching} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Recycler Dashboard"
        description="Manage incoming waste, processing, and marketplace operations"
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

      {/* Incoming waste alert */}
      {(stats.incomingWaste ?? 0) > 0 && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
          <CardContent className="py-3 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <PackageOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  {stats.incomingWaste} pickup{stats.incomingWaste > 1 ? "s" : ""} ready for recycling
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400">Accept and process these waste collections</p>
              </div>
            </div>
            <Link to="/recycler/incoming">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs">
                View Incoming
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Incoming Waste"
          value={String(stats.incomingWaste ?? 0)}
          icon={PackageOpen}
          hint="awaiting acceptance"
          className={(stats.incomingWaste ?? 0) > 0 ? "border-amber-300 dark:border-amber-700" : ""}
        />
        <StatCard
          label="Processing Queue"
          value={String(stats.processingQueue ?? 0)}
          icon={Cog}
          hint="accepted, in progress"
        />
        <StatCard
          label="Completed Batches"
          value={String(stats.completedBatches ?? 0)}
          icon={CheckCircle2}
          hint="fully processed"
          className="border-green-200 dark:border-green-800"
        />
        <StatCard
          label="Total Revenue"
          value={`₹${(stats.totalRevenue ?? 0).toLocaleString("en-IN")}`}
          icon={IndianRupee}
          hint="from payments"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Weight Processed"
          value={`${(stats.totalWeightProcessed ?? 0).toFixed(1)} kg`}
          icon={Scale}
          hint="total recycled"
        />
        <StatCard
          label="Carbon Saved"
          value={`${((stats.totalWeightProcessed ?? 0) * 1.6).toFixed(1)} kg CO2`}
          icon={Heart}
          hint="estimated offset"
          className="border-emerald-200 dark:border-emerald-800"
        />
        <StatCard
          label="Products Listed"
          value={String(stats.totalProductsListed ?? 0)}
          icon={Package}
          hint="on marketplace"
        />
        <StatCard
          label="Active Products"
          value={String(stats.activeProducts ?? 0)}
          icon={Boxes}
          hint="approved & live"
          className="border-emerald-200 dark:border-emerald-800"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {QUICK_ACTIONS.map(({ label, href, icon: Icon, color }) => (
          <Link
            key={href}
            to={href}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center group hover:shadow-md ${color}`}
          >
            <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        ))}
      </div>

      {/* Operations Summary */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Pipeline Overview</CardTitle>
              <Link
                to="/recycler/incoming"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View All <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <CardDescription>Current waste processing pipeline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Incoming (Pending)", value: stats.incomingWaste ?? 0, color: "text-amber-600 dark:text-amber-400" },
              { label: "In Processing", value: stats.processingQueue ?? 0, color: "text-blue-600 dark:text-blue-400" },
              { label: "Completed", value: stats.completedBatches ?? 0, color: "text-green-600 dark:text-green-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className={`font-bold text-lg ${color}`}>{value}</span>
              </div>
            ))}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">Processing Rate</span>
                <span className="font-bold text-lg">
                  {(stats.incomingWaste ?? 0) + (stats.processingQueue ?? 0) + (stats.completedBatches ?? 0) > 0
                    ? `${Math.round(
                        ((stats.completedBatches ?? 0) /
                          ((stats.incomingWaste ?? 0) + (stats.processingQueue ?? 0) + (stats.completedBatches ?? 0))) *
                          100
                      )}%`
                    : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Revenue & Marketplace</CardTitle>
            <CardDescription>Your financial overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Total Revenue", value: `₹${(stats.totalRevenue ?? 0).toLocaleString("en-IN")}`, color: "text-emerald-600 dark:text-emerald-400" },
              { label: "Weight Processed", value: `${(stats.totalWeightProcessed ?? 0).toFixed(1)} kg`, color: "text-blue-600 dark:text-blue-400" },
              { label: "Products Listed", value: stats.totalProductsListed ?? 0, color: "text-purple-600 dark:text-purple-400" },
              { label: "Active Products", value: stats.activeProducts ?? 0, color: "text-green-600 dark:text-green-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className={`font-bold text-lg ${color}`}>{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
