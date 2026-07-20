import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useDeliveryTasks, useDeliveryAnalytics } from "@/hooks/queries/useDelivery";
import {
  History,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Weight,
  Leaf,
  ChevronRight,
  TrendingUp,
  Truck,
  AlertCircle,
} from "lucide-react";
import { StatCard } from "@/components/common/StatCard";

const HISTORY_STATUSES = ["completed", "cancelled", "rejected"];

const STATUS_ICON = {
  completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  cancelled: <XCircle className="h-4 w-4 text-gray-400" />,
  rejected: <XCircle className="h-4 w-4 text-red-500" />,
};

const STATUS_COLOR = {
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

export default function DeliveryHistoryPage() {
  const { data: tasksData, isLoading } = useDeliveryTasks();
  const { data: analyticsData } = useDeliveryAnalytics();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const tasks = tasksData?.data ?? [];
  const stats = analyticsData?.data ?? {};

  const historicalTasks = tasks.filter((t) =>
    HISTORY_STATUSES.includes(t.status)
  );

  const filtered = historicalTasks.filter((t) => {
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchSearch =
      !search ||
      t.address?.toLowerCase().includes(search.toLowerCase()) ||
      t.wasteType?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  // Totals
  const totalCompleted = historicalTasks.filter((t) => t.status === "completed").length;
  const totalWeight = historicalTasks
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + (t.actualWeight || t.estimatedWeight || 0), 0);
  const totalPoints = historicalTasks
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + (t.ecoPointsAwarded || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Task History"
        description="Your completed and cancelled pickup records"
        actions={
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <History className="h-3.5 w-3.5" />
            {historicalTasks.length} historical tasks
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Completed"
          value={String(totalCompleted)}
          icon={CheckCircle2}
        />
        <StatCard
          label="Success Rate"
          value={`${stats.proofUploadSuccessRate ?? 100}%`}
          icon={TrendingUp}
        />
        <StatCard
          label="Avg. Time"
          value={`${stats.averageDeliveryTimeMinutes ?? 0} min`}
          icon={Clock}
        />
        <StatCard
          label="Total Weight"
          value={`${totalWeight.toFixed(1)} kg`}
          icon={Weight}
        />
      </div>

      {/* EcoPoints summary */}
      {totalPoints > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="py-4 flex items-center gap-4">
            <Leaf className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-700">{totalPoints}</p>
              <p className="text-sm text-green-600">Total EcoPoints earned from completions</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search history..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", ...HISTORY_STATUSES].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium border capitalize transition-colors ${
                  statusFilter === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-muted"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 rounded-lg border bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto opacity-40" />
            <p className="text-muted-foreground text-sm">
              {historicalTasks.length === 0
                ? "No completed tasks yet"
                : "No tasks match your filter"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => (
            <Card
              key={task._id}
              className="hover:border-primary/30 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 shrink-0">
                      {STATUS_ICON[task.status] || <Truck className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          className={`text-xs capitalize border ${STATUS_COLOR[task.status] || ""}`}
                          variant="outline"
                        >
                          {task.status}
                        </Badge>
                        <span className="font-semibold capitalize text-sm">
                          {task.wasteType}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{task.address}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {task.actualWeight && (
                          <span className="flex items-center gap-1">
                            <Weight className="h-3 w-3" />
                            {task.actualWeight} kg
                          </span>
                        )}
                        {task.ecoPointsAwarded > 0 && (
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            <Leaf className="h-3 w-3" />
                            +{task.ecoPointsAwarded} pts
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(task.scheduledDate).toLocaleDateString()}
                        </span>
                      </div>
                      {task.completionNotes && (
                        <p className="text-xs text-muted-foreground italic">
                          "{task.completionNotes}"
                        </p>
                      )}
                    </div>
                  </div>
                  <Link
                    to={`/delivery/tasks/${task._id}`}
                    className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0 mt-1"
                  >
                    View
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
