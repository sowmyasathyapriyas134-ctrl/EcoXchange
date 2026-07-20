import { useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GoogleMap } from "@/components/maps/GoogleMap";
import {
  useSupervisorAgentLocations,
  usePendingPickups,
  supervisorKeys,
} from "@/hooks/queries/useSupervisor";
import { useSocket } from "@/hooks/useSocket";
import { useQueryClient } from "@tanstack/react-query";
import { useSupervisorStore } from "@/store/supervisor.store";
import {
  MapPin,
  Users,
  Truck,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";

const AVAILABILITY_DOT = {
  available: "bg-green-500",
  busy: "bg-amber-500",
  offline: "bg-gray-400",
};

export default function SupervisorMapPage() {
  const qc = useQueryClient();
  const { socket, status: socketStatus } = useSocket();
  const { mapState, setSelectedAgent } =
    useSupervisorStore();

  const { data: locData, refetch: refetchLoc } = useSupervisorAgentLocations();
  const { data: pickupData, refetch: refetchPickups } = usePendingPickups();

  const agents = locData?.data ?? [];
  const pendingPickups = pickupData?.data ?? [];

  // Build markers: agents + pending pickup locations
  const agentMarkers = agents
    .filter((a) => a.currentLocation?.lat && a.currentLocation?.lng)
    .map((a) => ({
      position: { lat: a.currentLocation.lat, lng: a.currentLocation.lng },
      title: `${a.name} (${a.availabilityStatus})`,
    }));

  const pickupMarkers = pendingPickups
    .filter((p) => p.destinationLat && p.destinationLng)
    .map((p) => ({
      position: { lat: p.destinationLat, lng: p.destinationLng },
      title: `Pickup: ${p.wasteType} — ${p.address}`,
    }));

  const allMarkers = [...agentMarkers, ...pickupMarkers];

  const onlineAgents = agents.filter(
    (a) => a.availabilityStatus !== "offline"
  );

  // Refresh on tracking updates from socket
  useEffect(() => {
    if (!socket) return;
    const refresh = () => {
      qc.invalidateQueries({ queryKey: supervisorKeys.agentLocations });
    };
    // Agents emit location updates; supervisor receives them for monitoring
    socket.on("tracking:update", refresh);
    socket.on("task:assigned", refresh);
    return () => {
      socket.off("tracking:update", refresh);
      socket.off("task:assigned", refresh);
    };
  }, [socket, qc]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Operations Map"
        description="Track delivery agents and pending pickup locations in real time"
        actions={
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1.5 text-xs ${
                socketStatus === "connected" ? "text-green-600" : "text-amber-500"
              }`}
            >
              {socketStatus === "connected" ? (
                <Wifi className="h-3.5 w-3.5 animate-pulse" />
              ) : (
                <WifiOff className="h-3.5 w-3.5" />
              )}
              {socketStatus === "connected" ? "Live" : "Reconnecting…"}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                refetchLoc();
                refetchPickups();
              }}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4 px-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{onlineAgents.length}</p>
              <p className="text-xs text-muted-foreground">Online Agents</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingPickups.length}</p>
              <p className="text-xs text-muted-foreground">Pending Pickups</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center">
              <Truck className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {agents.filter((a) => a.availabilityStatus === "busy").length}
              </p>
              <p className="text-xs text-muted-foreground">Agents On Task</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main map */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Live Map
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden rounded-b-lg">
          <GoogleMap
            center={mapState.center}
            zoom={mapState.zoom}
            markers={allMarkers}
            height={480}
          />
        </CardContent>
      </Card>

      {/* Agent list with GPS status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Agent Locations</CardTitle>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No agents registered
            </p>
          ) : (
            <div className="space-y-2">
              {agents.map((agent) => (
                <div
                  key={agent._id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedAgent(agent)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {agent.name?.[0]?.toUpperCase() ?? "A"}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                          AVAILABILITY_DOT[agent.availabilityStatus] ?? "bg-gray-400"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{agent.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {agent.availabilityStatus}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {agent.currentLocation?.lat ? (
                      <p className="text-xs text-muted-foreground">
                        {agent.currentLocation.lat.toFixed(4)}, {agent.currentLocation.lng.toFixed(4)}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                        <WifiOff className="h-3 w-3" /> No GPS
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending pickups list */}
      {pendingPickups.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pending Pickup Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingPickups.slice(0, 8).map((p) => (
                <div
                  key={p._id}
                  className="flex items-center gap-3 p-2.5 rounded-lg border text-sm"
                >
                  <MapPin className="h-4 w-4 text-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium capitalize truncate">{p.wasteType}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.address}</p>
                  </div>
                  <Badge className="ml-auto shrink-0 bg-amber-100 text-amber-800 border-amber-200 text-[10px]" variant="outline">
                    Pending
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
