import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  useDeliveryTasks,
  useAcceptTask,
  useRejectTask,
} from "@/hooks/queries/useDelivery";
import { useSocket } from "@/hooks/useSocket";
import { useQueryClient } from "@tanstack/react-query";
import {
  Truck,
  Search,
  MapPin,
  Clock,
  Weight,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";
import { useEffect } from "react";

const STATUS_COLORS = {
  assigned: "bg-amber-100 text-amber-800 border-amber-200",
  accepted: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-cyan-100 text-cyan-800 border-cyan-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_FILTERS = ["all", "assigned", "accepted", "in_progress", "completed"];

export default function DeliveryTasksPage() {
  const qc = useQueryClient();
  const { socket } = useSocket();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading } = useDeliveryTasks();
  const acceptTask = useAcceptTask();
  const rejectTask = useRejectTask();

  const tasks = data?.data ?? [];

  // Socket: invalidate on new assignment
  useEffect(() => {
    if (!socket) return;
    const handler = () => {
      qc.invalidateQueries({ queryKey: ["delivery", "tasks"] });
      toast.success("🚨 New pickup task assigned!");
    };
    socket.on("task:assigned", handler);
    return () => socket.off("task:assigned", handler);
  }, [socket, qc]);

  const filtered = tasks.filter((t) => {
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchSearch =
      !search ||
      t.address?.toLowerCase().includes(search.toLowerCase()) ||
      t.wasteType?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleReject = (task) => {
    if (!rejectReason.trim()) {
      toast.error("Please enter a reason for rejection");
      return;
    }
    rejectTask.mutate(
      { id: task._id, reason: rejectReason },
      {
        onSuccess: () => {
          setRejectingId(null);
          setRejectReason("");
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assigned Tasks"
        description="View and manage your pickup assignments"
        actions={
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Truck className="h-4 w-4" />
            {tasks.filter((t) => t.status === "assigned").length} pending
          </div>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by address or waste type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground self-center" />
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium border capitalize transition-colors ${
                  statusFilter === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-muted"
                }`}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 rounded-lg border bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">
              {tasks.length === 0 ? "No tasks assigned to you" : "No tasks match your filter"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => (
            <Card
              key={task._id}
              className="hover:border-primary/50 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        className={`text-xs capitalize border ${STATUS_COLORS[task.status] || ""}`}
                        variant="outline"
                      >
                        {task.status?.replace(/_/g, " ")}
                      </Badge>
                      <span className="font-semibold capitalize text-sm">{task.wasteType}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{task.address}</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Weight className="h-3.5 w-3.5" />
                        {task.estimatedWeight} kg
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(task.scheduledDate).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Quick actions for assigned tasks */}
                    {task.status === "assigned" && (
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() => acceptTask.mutate(task._id)}
                          disabled={acceptTask.isPending}
                          className="bg-green-600 hover:bg-green-700 text-xs h-7"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setRejectingId(rejectingId === task._id ? null : task._id)
                          }
                          className="text-xs h-7 border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}

                    {/* Reject reason input */}
                    {rejectingId === task._id && (
                      <div className="space-y-2 pt-2 border-t">
                        <Input
                          placeholder="Reason for rejection..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="text-xs h-8"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleReject(task)}
                            disabled={rejectTask.isPending}
                            className="text-xs h-7 bg-red-600 hover:bg-red-700"
                          >
                            Confirm Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setRejectingId(null); setRejectReason(""); }}
                            className="text-xs h-7"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* View Details Arrow */}
                  <Link
                    to={`/delivery/tasks/${task._id}`}
                    className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0 mt-1"
                  >
                    Details
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
