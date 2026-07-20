import { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusChip } from "@/components/common/StatusChip";
import { ApiError } from "@/components/errors/ApiError";
import { EmptyState } from "@/components/common/EmptyState";
import { DashboardSkeleton } from "@/components/loading/DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RouteMap } from "@/components/maps/GoogleMap";
import { usePickup, usePickups } from "@/hooks/queries/useMember";
import { useSocket } from "@/hooks/useSocket";
import { ArrowLeft, MapPin, Truck, Phone, Navigation, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";

const ACTIVE_STATUSES = ["pending", "approved", "assigned", "accepted", "in_progress", "arrived"];

// ─── Single Pickup Tracker ──────────────────────────────────────────────
function PickupTracker({ id }) {
  const { socket, status: socketStatus } = useSocket();
  const pickup = usePickup(id);
  const qc = useQueryClient();
  const p = pickup.data?.data ?? pickup.data;

  const [agentLocation, setAgentLocation] = useState(null);
  const [estimatedArrival, setEstimatedArrival] = useState("");
  const [liveStatus, setLiveStatus] = useState(null);

  const defaultMemberPos = { lat: 12.9716, lng: 77.5946 };
  const memberPos = p?.location?.coordinates
    ? { lat: p.location.coordinates[1], lng: p.location.coordinates[0] }
    : defaultMemberPos;

  const handlePickupEvent = useCallback(
    (eventName) => (data) => {
      if (data?.pickupId && data.pickupId !== id) return;
      setLiveStatus(eventName);
      qc.invalidateQueries({ queryKey: queryKeys.pickups.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.pickups.list });

      const messages = {
        "pickup:assigned": "✅ A delivery agent has been assigned!",
        "pickup:accepted": "✅ Agent accepted your pickup request.",
        "pickup:started": "🚗 Agent is on the way!",
        "pickup:arrived": "📍 Agent has arrived at your location!",
        "pickup:completed": "🎉 Pickup completed successfully!",
        "pickup:verified": "✔️ Waste verified by supervisor.",
        "pickup:rejected": "❌ Pickup was rejected. Check details.",
      };
      if (messages[eventName]) toast(messages[eventName]);
    },
    [id, qc]
  );

  const handleLocationUpdate = useCallback((data) => {
    if (data?.pickupId && data.pickupId !== id) return;
    if (data.location) {
      setAgentLocation({ lat: data.location.lat, lng: data.location.lng });
    }
    if (data.eta) setEstimatedArrival(data.eta);
  }, [id]);

  useEffect(() => {
    if (!socket || !id) return;

    socket.emit("tracking:join", { pickupId: id });

    const events = [
      "pickup:assigned",
      "pickup:accepted",
      "pickup:started",
      "pickup:arrived",
      "pickup:completed",
      "pickup:verified",
      "pickup:rejected",
    ];

    events.forEach((evt) => socket.on(evt, handlePickupEvent(evt)));
    socket.on("tracking:update", handleLocationUpdate);
    // Legacy event name used in SocketProvider
    socket.on("pickup_update", () => {
      qc.invalidateQueries({ queryKey: queryKeys.pickups.detail(id) });
    });

    return () => {
      socket.emit("tracking:leave", { pickupId: id });
      events.forEach((evt) => socket.off(evt));
      socket.off("tracking:update", handleLocationUpdate);
      socket.off("pickup_update");
    };
  }, [socket, id, handlePickupEvent, handleLocationUpdate, qc]);

  if (pickup.isLoading) return <DashboardSkeleton />;
  if (pickup.isError || !p) return <ApiError onRetry={pickup.refetch} message="Pickup tracker unavailable" />;

  const markers = [{ position: memberPos, title: "Your Location (Pickup)" }];

  if (agentLocation) {
    markers.push({ position: agentLocation, title: "Delivery Agent (Live)" });
  } else if (p.assignedAgent) {
    // Show approximate agent marker until live location arrives
    markers.push({
      position: { lat: memberPos.lat + 0.008, lng: memberPos.lng - 0.005 },
      title: "Agent (Approximate)",
    });
  }

  const route = markers.length > 1
    ? [markers[1].position, memberPos]
    : [];

  const displayStatus = liveStatus ? liveStatus.replace("pickup:", "").replace(/_/g, " ") : p.status?.replace(/_/g, " ");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/member/pickups" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Pickups
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Live Agent Tracking"
        description={`Pickup #${String(p._id).slice(-8)}`}
        actions={
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className={`h-2 w-2 rounded-full ${socketStatus === "connected" ? "bg-green-500" : "bg-amber-500"} animate-pulse`} />
            {socketStatus === "connected" ? "Live" : "Connecting..."}
            <Button variant="ghost" size="sm" onClick={() => pickup.refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Map */}
        <div className="md:col-span-2">
          <RouteMap route={route} markers={markers} height={420} />
        </div>

        {/* Info Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Pickup Status</CardTitle>
              <CardDescription>Realtime updates via Socket.IO</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <StatusChip status={p.status} />
                {liveStatus && liveStatus !== `pickup:${p.status}` && (
                  <p className="text-xs text-primary mt-1 font-medium capitalize">
                    Live: {displayStatus}
                  </p>
                )}
              </div>

              <div>
                <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <Navigation className="h-3.5 w-3.5" /> Estimated Arrival
                </span>
                <p className="font-bold text-xl text-primary">{estimatedArrival || "—"}</p>
                {!estimatedArrival && <p className="text-xs text-muted-foreground">Will update when agent is en route</p>}
              </div>

              {p.assignedAgent ? (
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2.5 rounded-full text-primary">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{p.assignedAgent.name || "Delivery Agent"}</p>
                      <p className="text-xs text-muted-foreground">EcoXchange Agent</p>
                    </div>
                  </div>
                  {p.assignedAgent.phone && (
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <a href={`tel:${p.assignedAgent.phone}`}>
                        <Phone className="h-3.5 w-3.5 mr-2" /> Call Agent
                      </a>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="border-t pt-4 text-xs text-muted-foreground">
                  Waiting for supervisor to assign an agent...
                </div>
              )}

              <div className="border-t pt-3">
                <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <MapPin className="h-3.5 w-3.5" /> Pickup Address
                </span>
                <p className="text-xs font-medium">{p.address}</p>
              </div>

              <Button asChild variant="outline" size="sm" className="w-full">
                <Link to={`/member/pickups/${p._id}`}>View Full Details</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── List of active pickups if no :id ───────────────────────────────────
function ActivePickupList() {
  const { data, isLoading, isError, refetch, isFetching } = usePickups();

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <ApiError onRetry={refetch} loading={isFetching} />;

  const active = (data?.data ?? []).filter((p) => ACTIVE_STATUSES.includes(p.status));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Tracking"
        description="Track your active pickup requests in real-time"
        actions={
          <Button asChild>
            <Link to="/member/pickups/new">New Pickup</Link>
          </Button>
        }
      />
      {active.length === 0 ? (
        <EmptyState
          title="No active pickups"
          description="Schedule a pickup to start tracking your waste collection"
          action={
            <Button asChild>
              <Link to="/member/pickups/new">Schedule Pickup</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {active.map((p) => (
            <Card key={p._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base capitalize">{p.wasteType}</CardTitle>
                <StatusChip status={p.status} />
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <p className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0" /> {p.address}
                </p>
                <p className="text-muted-foreground">
                  Scheduled: {p.scheduledDate ? new Date(p.scheduledDate).toLocaleDateString("en-IN") : "—"}
                </p>
                <div className="flex gap-2">
                  <Button asChild size="sm" className="flex-1">
                    <Link to={`/member/tracking/${p._id}`}>Track Live</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <Link to={`/member/pickups/${p._id}`}>Details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────
export default function TrackingPage() {
  const { id } = useParams();
  return id ? <PickupTracker id={id} /> : <ActivePickupList />;
}
