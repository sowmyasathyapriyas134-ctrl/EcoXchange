import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RouteMap } from "@/components/maps/GoogleMap";
import { useDeliveryTasks, useDeliveryAnalytics } from "@/hooks/queries/useDelivery";
import { useDeliveryTaskStore } from "@/store/delivery.store";
import { useSocket } from "@/hooks/useSocket";
import { useQueryClient } from "@tanstack/react-query";
import {
  Truck,
  CheckCircle2,
  AlertCircle,
  QrCode,
  TrendingUp,
  Navigation,
  Compass,
  Clock,
  MapPin,
  ChevronRight,
  Wifi,
  History,
  Camera,
  Leaf,
  Route,
} from "lucide-react";
import toast from "react-hot-toast";

const STATUS_COLORS = {
  assigned: "bg-amber-100 text-amber-800 border-amber-200",
  accepted: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-cyan-100 text-cyan-800 border-cyan-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

const QUICK_LINKS = [
  { label: "All Tasks", href: "/delivery/tasks", icon: Truck },
  { label: "Live Map", href: "/delivery/map", icon: Navigation },
  { label: "QR Scanner", href: "/delivery/scanner", icon: QrCode },
  { label: "Proof Photos", href: "/delivery/proofs", icon: Camera },
  { label: "History", href: "/delivery/history", icon: History },
];

export default function DeliveryDashboardPage() {
  const qc = useQueryClient();
  const { socket, status: socketStatus } = useSocket();
  const { isTracking, lastPosition, flushLocationQueue } = useDeliveryTaskStore();

  const [agentPos, setAgentPos] = useState(lastPosition || { lat: 12.9716, lng: 77.5946 });

  const { data: tasksData, isLoading: tasksLoading } = useDeliveryTasks();
  const { data: analyticsData } = useDeliveryAnalytics();

  const tasks = tasksData?.data ?? [];
  const stats = analyticsData?.data ?? {
    tasksToday: 0,
    completedTasks: 0,
    averageDeliveryTimeMinutes: 0,
    distanceCoveredKm: 0,
    proofUploadSuccessRate: 100,
  };

  const activeTasks = tasks.filter((t) =>
    ["assigned", "accepted", "in_progress"].includes(t.status)
  );
  const completedToday = tasks.filter((t) => t.status === "completed");
  const inProgressTask = tasks.find((t) => t.status === "in_progress");

  // Get GPS position
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      setAgentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
    // Flush any offline queued location updates
    flushLocationQueue();
  }, [flushLocationQueue]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const onAssigned = () => {
      qc.invalidateQueries({ queryKey: ["delivery", "tasks"] });
      qc.invalidateQueries({ queryKey: ["delivery", "analytics"] });
      toast.success("🚨 New pickup task assigned!", { duration: 5000 });
    };

    const onCompleted = (data) => {
      qc.invalidateQueries({ queryKey: ["delivery", "tasks"] });
      qc.invalidateQueries({ queryKey: ["delivery", "analytics"] });
      if (data?.message) toast.success(data.message);
    };

    const onVerified = () => {
      qc.invalidateQueries({ queryKey: ["delivery", "tasks"] });
      toast.success("✅ Pickup verified by supervisor!");
    };

    const onRejected = () => {
      qc.invalidateQueries({ queryKey: ["delivery", "tasks"] });
      toast.error("❌ Pickup rejected by supervisor.");
    };

    socket.on("task:assigned", onAssigned);
    socket.on("task:completed", onCompleted);
    socket.on("pickup:verified", onVerified);
    socket.on("pickup:rejected", onRejected);

    return () => {
      socket.off("task:assigned", onAssigned);
      socket.off("task:completed", onCompleted);
      socket.off("pickup:verified", onVerified);
      socket.off("pickup:rejected", onRejected);
    };
  }, [socket, qc]);

  const destLat = inProgressTask?.location?.coordinates?.[1] || inProgressTask?.destinationLat;
  const destLng = inProgressTask?.location?.coordinates?.[0] || inProgressTask?.destinationLng;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Dashboard"
        description="Your waste pickup command center"
        actions={
          <div className="flex items-center gap-3">
            {isTracking && (
              <span className="flex items-center gap-1.5 text-xs text-green-600">
                <Wifi className="h-3.5 w-3.5 animate-pulse" />
                GPS Active
              </span>
            )}
            <div
              className={`flex items-center gap-1.5 text-xs ${
                socketStatus === "connected"
                  ? "text-green-600"
                  : "text-amber-500"
              }`}
            >
              <div
                className={`h-2 w-2 rounded-full animate-pulse ${
                  socketStatus === "connected" ? "bg-green-500" : "bg-amber-500"
                }`}
              />
              {socketStatus === "connected" ? "Realtime Active" : "Reconnecting…"}
            </div>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tasks Today"
          value={String(stats.tasksToday)}
          icon={Truck}
        />
        <StatCard
          label="Completed"
          value={String(stats.completedTasks)}
          icon={CheckCircle2}
        />
        <StatCard
          label="Success Rate"
          value={`${stats.proofUploadSuccessRate}%`}
          icon={TrendingUp}
        />
        <StatCard
          label="Distance Covered"
          value={`${stats.distanceCoveredKm} km`}
          icon={Compass}
        />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {QUICK_LINKS.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            to={href}
            className="flex flex-col items-center gap-2 p-3 rounded-xl border bg-card hover:border-primary/50 hover:bg-primary/5 transition-colors text-center group"
          >
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Icon className="h-4.5 w-4.5 text-primary" />
            </div>
            <span className="text-xs font-medium">{label}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Active Tasks Column */}
        <div className="md:col-span-2 space-y-4">
          {/* In-progress alert */}
          {inProgressTask && (
            <Card className="border-cyan-300 bg-cyan-50">
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
                  <div>
                    <p className="text-sm font-semibold text-cyan-900">
                      Active Task: {inProgressTask.wasteType}
                    </p>
                    <p className="text-xs text-cyan-700 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {inProgressTask.address}
                    </p>
                  </div>
                </div>
                <Link to={`/delivery/tasks/${inProgressTask._id}`}>
                  <Button size="sm" className="text-xs bg-cyan-600 hover:bg-cyan-700">
                    Continue
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Tasks List */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Active Tasks</CardTitle>
                <Link
                  to="/delivery/tasks"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  View All <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <CardDescription>
                {activeTasks.length} pending / {completedToday.length} completed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {tasksLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((n) => (
                    <div key={n} className="h-16 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : activeTasks.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground space-y-2">
                  <AlertCircle className="h-8 w-8 mx-auto opacity-40" />
                  <p>No active tasks right now</p>
                </div>
              ) : (
                activeTasks.slice(0, 5).map((task) => (
                  <Link
                    key={task._id}
                    to={`/delivery/tasks/${task._id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/40 hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`text-[10px] capitalize border ${
                            STATUS_COLORS[task.status] || ""
                          }`}
                          variant="outline"
                        >
                          {task.status?.replace(/_/g, " ")}
                        </Badge>
                        <span className="font-medium text-sm capitalize">
                          {task.wasteType}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {task.address}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* Map showing current route */}
          {(inProgressTask || activeTasks.length > 0) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Route className="h-4 w-4 text-primary" />
                  Current Route
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RouteMap
                  route={[
                    agentPos,
                    destLat && destLng
                      ? { lat: destLat, lng: destLng }
                      : { lat: 12.9786, lng: 77.6046 },
                  ]}
                  markers={[
                    { position: agentPos, title: "You" },
                    ...(destLat && destLng
                      ? [
                          {
                            position: { lat: destLat, lng: destLng },
                            title: "Member",
                          },
                        ]
                      : []),
                  ]}
                  height={260}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Performance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Avg. Delivery Time</span>
                <span className="font-semibold">
                  {stats.averageDeliveryTimeMinutes} min
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Proof Success Rate</span>
                <span className="font-semibold">
                  {stats.proofUploadSuccessRate}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Distance Today</span>
                <span className="font-semibold">{stats.distanceCoveredKm} km</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tasks Today</span>
                <span className="font-semibold">{stats.tasksToday}</span>
              </div>
            </CardContent>
          </Card>

          {/* Completed Today */}
          {completedToday.length > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-green-800">
                  <Leaf className="h-4 w-4" />
                  Completed Today
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {completedToday.slice(0, 3).map((task) => (
                  <div
                    key={task._id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="capitalize text-green-800">{task.wasteType}</span>
                    {task.ecoPointsAwarded > 0 && (
                      <span className="font-semibold text-green-700">
                        +{task.ecoPointsAwarded} pts
                      </span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recent completed tasks */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Activity
                </CardTitle>
                <Link
                  to="/delivery/history"
                  className="text-xs text-primary hover:underline"
                >
                  View All
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {tasks.filter((t) => t.status === "completed").slice(0, 3).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No completed tasks yet
                </p>
              ) : (
                tasks
                  .filter((t) => t.status === "completed")
                  .slice(0, 3)
                  .map((task) => (
                    <div
                      key={task._id}
                      className="flex items-center gap-2 text-xs border-b last:border-0 pb-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      <span className="flex-1 truncate capitalize">{task.wasteType}</span>
                      <span className="text-muted-foreground shrink-0">
                        {new Date(task.scheduledDate).toLocaleDateString()}
                      </span>
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
