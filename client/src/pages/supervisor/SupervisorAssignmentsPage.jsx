import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  usePendingPickups,
  useSupervisorPickups,
  useSupervisorAgents,
  useAssignAgent,
  useReassignAgent,
  supervisorKeys,
} from "@/hooks/queries/useSupervisor";
import { useSocket } from "@/hooks/useSocket";
import {
  MapPin,
  Calendar,
  Weight,
  User,
  Search,
  RefreshCw,
  ChevronRight,
  Truck,
  Clock,
} from "lucide-react";

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-blue-100 text-blue-800 border-blue-200",
  assigned: "bg-indigo-100 text-indigo-800 border-indigo-200",
  accepted: "bg-cyan-100 text-cyan-800 border-cyan-200",
  in_progress: "bg-violet-100 text-violet-800 border-violet-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

const WASTE_ICONS = {
  plastic: "🧴",
  paper: "📄",
  metal: "🔩",
  glass: "🍶",
  organic: "🌿",
  ewaste: "💻",
};

function AgentSelector({ pickupId, currentAgentId, agents, onAssign, isPending }) {
  const [selected, setSelected] = useState(currentAgentId ?? "");

  return (
    <div className="flex items-center gap-2 mt-3">
      <select
        className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        <option value="">— Select agent —</option>
        {agents.map((a) => (
          <option key={a._id} value={a._id} disabled={a.availabilityStatus === "offline"}>
            {a.name} ({a.availabilityStatus})
          </option>
        ))}
      </select>
      <Button
        size="sm"
        disabled={!selected || selected === currentAgentId || isPending}
        onClick={() => onAssign({ pickupId, agentId: selected })}
        className="text-xs shrink-0"
      >
        {currentAgentId ? "Reassign" : "Assign"}
      </Button>
    </div>
  );
}

function PickupCard({ pickup, agents, assignMutation, reassignMutation }) {
  const [expanded, setExpanded] = useState(false);
  const hasAgent = Boolean(pickup.assignedAgent);
  const mutation = hasAgent ? reassignMutation : assignMutation;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base">{WASTE_ICONS[pickup.wasteType] ?? "🗑️"}</span>
              <span className="font-semibold text-sm capitalize">{pickup.wasteType}</span>
              <Badge
                className={`text-[10px] capitalize border ${STATUS_COLORS[pickup.status] ?? ""}`}
                variant="outline"
              >
                {pickup.status?.replace(/_/g, " ")}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3 shrink-0" />
              {pickup.address}
            </p>
          </div>
          <button
            className="text-xs text-primary hover:underline shrink-0 flex items-center gap-0.5"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Less" : "More"} <ChevronRight className={`h-3 w-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
          </button>
        </div>

        {/* Details row */}
        <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Weight className="h-3 w-3" />
            {pickup.estimatedWeight} kg
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(pickup.scheduledDate).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {pickup.user?.fullName ?? "Unknown"}
          </div>
        </div>

        {/* Currently assigned agent */}
        {pickup.assignedAgent && (
          <div className="mt-2 text-xs flex items-center gap-1 text-indigo-700 bg-indigo-50 rounded px-2 py-1">
            <Truck className="h-3 w-3" />
            Assigned: {pickup.assignedAgent?.name ?? pickup.assignedAgent}
          </div>
        )}

        {/* Expanded details + agent selector */}
        {expanded && (
          <div className="mt-3 pt-3 border-t space-y-2">
            {pickup.notes && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Notes:</span> {pickup.notes}
              </p>
            )}
            {pickup.verificationStatus && pickup.verificationStatus !== "pending" && (
              <Badge
                className={
                  pickup.verificationStatus === "verified"
                    ? "bg-green-100 text-green-800 border-green-200 text-[10px]"
                    : "bg-red-100 text-red-800 border-red-200 text-[10px]"
                }
                variant="outline"
              >
                Verification: {pickup.verificationStatus}
              </Badge>
            )}

            {/* Only show agent selector for pending/approved or already assigned */}
            {(pickup.status === "pending" || pickup.status === "approved" || pickup.status === "assigned") && (
              <AgentSelector
                pickupId={pickup._id}
                currentAgentId={typeof pickup.assignedAgent === "object" ? pickup.assignedAgent?._id : pickup.assignedAgent}
                agents={agents}
                onAssign={({ pickupId, agentId }) =>
                  mutation.mutate({ pickupId, agentId })
                }
                isPending={mutation.isPending}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const STATUS_FILTERS = ["all", "pending", "assigned", "accepted", "in_progress", "completed", "rejected"];

export default function SupervisorAssignmentsPage() {
  const qc = useQueryClient();
  const { socket } = useSocket();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);

  // For pending queue use dedicated endpoint; for others use the filterable one
  const isPendingView = statusFilter === "pending";

  const { data: pendingData, isLoading: pendingLoading } = usePendingPickups();
  const { data: allData, isLoading: allLoading } = useSupervisorPickups(
    !isPendingView ? { status: statusFilter === "all" ? undefined : statusFilter, page } : null
  );
  const { data: agentsData } = useSupervisorAgents();

  const agents = agentsData?.data ?? [];
  const rawPickups = isPendingView
    ? (pendingData?.data ?? [])
    : (allData?.data ?? []);
  const pagination = !isPendingView ? allData?.pagination : null;
  const isLoading = isPendingView ? pendingLoading : allLoading;

  const assignMutation = useAssignAgent();
  const reassignMutation = useReassignAgent();

  // Filter by search locally
  const pickups = rawPickups.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      p.wasteType?.toLowerCase().includes(s) ||
      p.address?.toLowerCase().includes(s) ||
      p.user?.fullName?.toLowerCase().includes(s)
    );
  });

  // Socket: refresh when tasks get assigned
  useEffect(() => {
    if (!socket) return;
    const refresh = () => {
      qc.invalidateQueries({ queryKey: supervisorKeys.pendingPickups });
      qc.invalidateQueries({ queryKey: ["supervisor", "pickups"] });
      qc.invalidateQueries({ queryKey: supervisorKeys.dashboardStats });
    };
    socket.on("task:assigned", refresh);
    socket.on("task:completed", refresh);
    return () => {
      socket.off("task:assigned", refresh);
      socket.off("task:completed", refresh);
    };
  }, [socket, qc]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pickup Assignments"
        description="Assign delivery agents to pending pickups and track all collections"
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              qc.invalidateQueries({ queryKey: supervisorKeys.pendingPickups });
              qc.invalidateQueries({ queryKey: ["supervisor", "pickups"] });
            }}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
        }
      />

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? "default" : "outline"}
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
            className="capitalize text-xs"
          >
            {s === "all" ? "All" : s.replace(/_/g, " ")}
          </Button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by waste type, address, or member name…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">
        {isLoading ? "Loading…" : `${pickups.length} pickup${pickups.length !== 1 ? "s" : ""} found`}
        {pagination && ` · Page ${pagination.page} of ${pagination.pages}`}
      </p>

      {/* Pickup grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-40 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : pickups.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center space-y-2">
            <Clock className="h-10 w-10 mx-auto opacity-30" />
            <p className="text-sm text-muted-foreground">
              {statusFilter === "pending"
                ? "No pending pickups — all caught up!"
                : "No pickups match the selected filter"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pickups.map((pickup) => (
              <PickupCard
                key={pickup._id}
                pickup={pickup}
                agents={agents}
                assignMutation={assignMutation}
                reassignMutation={reassignMutation}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {pagination.pages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
