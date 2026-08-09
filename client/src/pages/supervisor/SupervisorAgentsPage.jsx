import { useState } from "react";
import { useForm } from "react-hook-form";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSupervisorAgents, useSupervisorAgentHistory, useCreateDeliveryAgent } from "@/hooks/queries/useSupervisor";
import { LiveMarkerMap } from "@/components/maps/GoogleMap";
import {
  Users,
  Truck,
  MapPin,
  Phone,
  Mail,
  Search,
  ChevronDown,
  ChevronUp,
  Wifi,
  WifiOff,
  Circle,
  UserPlus,
} from "lucide-react";

const AVAILABILITY_CONFIG = {
  available: { label: "Available", color: "bg-green-100 text-green-800 border-green-200", dot: "bg-green-500" },
  busy: { label: "Busy", color: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  offline: { label: "Offline", color: "bg-gray-100 text-gray-700 border-gray-200", dot: "bg-gray-400" },
};

function AgentCard({ agent }) {
  const [expanded, setExpanded] = useState(false);
  const { data: historyData } = useSupervisorAgentHistory(expanded ? agent._id : null);
  const history = historyData?.data ?? [];

  const avail = AVAILABILITY_CONFIG[agent.availabilityStatus] ?? AVAILABILITY_CONFIG.offline;
  const hasLocation =
    agent.currentLocation?.lat && agent.currentLocation?.lng;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Avatar + info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base">
                {agent.name?.[0]?.toUpperCase() ?? "A"}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${avail.dot}`}
              />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{agent.name}</p>
              <p className="text-xs text-muted-foreground truncate">{agent.email}</p>
              {agent.phone && (
                <p className="text-xs text-muted-foreground">{agent.phone}</p>
              )}
            </div>
          </div>

          {/* Status badge */}
          <Badge
            className={`text-[10px] border shrink-0 ${avail.color}`}
            variant="outline"
          >
            <Circle className={`h-1.5 w-1.5 mr-1 ${avail.dot} fill-current`} />
            {avail.label}
          </Badge>
        </div>

        {/* Task counts */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="rounded-lg bg-muted/60 p-2 text-center">
            <p className="text-lg font-bold text-amber-600">{agent.activeTasks ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Active Tasks</p>
          </div>
          <div className="rounded-lg bg-muted/60 p-2 text-center">
            <p className="text-lg font-bold text-green-600">{agent.completedTasks ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Completed</p>
          </div>
        </div>

        {/* Vehicle info */}
        {(agent.vehicleType || agent.vehicleNumber) && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Truck className="h-3 w-3" />
            {agent.vehicleType} {agent.vehicleNumber && `· ${agent.vehicleNumber}`}
          </p>
        )}

        {/* Expand toggle */}
        <button
          className="w-full mt-3 flex items-center justify-center gap-1 text-xs text-primary hover:underline"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? (
            <>
              Hide Details <ChevronUp className="h-3 w-3" />
            </>
          ) : (
            <>
              View Details <ChevronDown className="h-3 w-3" />
            </>
          )}
        </button>

        {/* Expanded: map + location history */}
        {expanded && (
          <div className="mt-3 space-y-3 border-t pt-3">
            {hasLocation ? (
              <div>
                <p className="text-xs font-medium mb-1.5 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Current Location
                </p>
                <LiveMarkerMap
                  position={{
                    lat: agent.currentLocation.lat,
                    lng: agent.currentLocation.lng,
                  }}
                  height={160}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {agent.currentLocation.lat.toFixed(5)}, {agent.currentLocation.lng.toFixed(5)}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <WifiOff className="h-3 w-3" /> No GPS data available
              </p>
            )}

            {/* Contact */}
            <div className="flex flex-col gap-1">
              {agent.email && (
                <a
                  href={`mailto:${agent.email}`}
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <Mail className="h-3 w-3" /> {agent.email}
                </a>
              )}
              {agent.phone && (
                <a
                  href={`tel:${agent.phone}`}
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <Phone className="h-3 w-3" /> {agent.phone}
                </a>
              )}
            </div>

            {/* Location history */}
            {history.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1">Recent Location History</p>
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {history.slice(0, 5).map((h, i) => (
                    <div key={i} className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {h.latitude?.toFixed(4)}, {h.longitude?.toFixed(4)}
                      </span>
                      <span>{new Date(h.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CreateAgentModal({ open, onClose }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const createMutation = useCreateDeliveryAgent();

  const onSubmit = async (values) => {
    await createMutation.mutateAsync({
      name: values.name,
      email: values.email,
      phone: values.phone.startsWith("+91") ? values.phone : `+91${values.phone}`,
      password: values.password,
      vehicleType: values.vehicleType || "",
      vehicleNumber: values.vehicleNumber || "",
      employeeId: values.employeeId || "",
    });
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Delivery Agent</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="agent-name">Full Name *</Label>
              <Input
                id="agent-name"
                placeholder="Ravi Kumar"
                {...register("name", { required: "Name is required" })}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="agent-email">Email *</Label>
              <Input
                id="agent-email"
                type="email"
                placeholder="agent@eco.in"
                {...register("email", { required: "Email is required" })}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="agent-phone">Phone *</Label>
              <div className="flex">
                <span className="inline-flex items-center px-2.5 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">+91</span>
                <Input
                  id="agent-phone"
                  inputMode="tel"
                  placeholder="9876543210"
                  className="rounded-l-none"
                  {...register("phone", {
                    required: "Phone is required",
                    pattern: { value: /^\d{10}$/, message: "Enter 10 digits" },
                  })}
                />
              </div>
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="agent-password">Password *</Label>
              <Input
                id="agent-password"
                type="password"
                placeholder="Min 8 chars"
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 8, message: "Min 8 characters" },
                })}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="agent-vehicle-type">Vehicle Type</Label>
              <Input
                id="agent-vehicle-type"
                placeholder="Bike / Van"
                {...register("vehicleType")}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="agent-vehicle-no">Vehicle Number</Label>
              <Input
                id="agent-vehicle-no"
                placeholder="TN01AB1234"
                {...register("vehicleNumber")}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="agent-employee-id">Employee ID</Label>
            <Input
              id="agent-employee-id"
              placeholder="EMP-001"
              {...register("employeeId")}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Agent"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function SupervisorAgentsPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, isLoading, isError, refetch } = useSupervisorAgents();
  const agents = data?.data ?? [];

  const filtered = agents.filter((a) => {
    const matchSearch =
      !search ||
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === "all" || a.availabilityStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const available = agents.filter((a) => a.availabilityStatus === "available").length;
  const busy = agents.filter((a) => a.availabilityStatus === "busy").length;
  const offline = agents.filter((a) => a.availabilityStatus === "offline").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Agents"
        description="Monitor agent availability, GPS, and task performance"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Refresh
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5"
              onClick={() => setShowCreateModal(true)}
            >
              <UserPlus className="h-4 w-4" />
              Add Agent
            </Button>
          </div>
        }
      />

      <CreateAgentModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Available" value={String(available)} icon={Wifi} className="border-green-200" />
        <StatCard label="Busy" value={String(busy)} icon={Truck} className="border-amber-200" />
        <StatCard label="Offline" value={String(offline)} icon={WifiOff} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {["all", "available", "busy", "offline"].map((s) => (
            <Button
              key={s}
              size="sm"
              variant={filterStatus === s ? "default" : "outline"}
              onClick={() => setFilterStatus(s)}
              className="capitalize text-xs"
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Agent grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-48 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Failed to load agents.{" "}
            <button onClick={() => refetch()} className="text-primary underline">
              Retry
            </button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <Users className="h-10 w-10 mx-auto opacity-30" />
            <p className="text-sm text-muted-foreground">No agents match your search</p>
            <Button
              size="sm"
              className="mt-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setShowCreateModal(true)}
            >
              <UserPlus className="h-4 w-4 mr-1.5" /> Add First Agent
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((agent) => (
            <AgentCard key={agent._id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}
