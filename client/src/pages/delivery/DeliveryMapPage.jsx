import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RouteMap } from "@/components/maps/GoogleMap";
import { useDeliveryTasks } from "@/hooks/queries/useDelivery";
import { useDeliveryTaskStore } from "@/store/delivery.store";
import { useSocket } from "@/hooks/useSocket";
import {
  Navigation,
  MapPin,
  Wifi,
  WifiOff,
  Target,
  Route,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function DeliveryMapPage() {
  const { socket } = useSocket();
  const { data } = useDeliveryTasks();
  const { lastPosition, isTracking } = useDeliveryTaskStore();

  const tasks = data?.data ?? [];
  const activeTasks = tasks.filter((t) =>
    ["accepted", "in_progress"].includes(t.status)
  );

  const [agentPos, setAgentPos] = useState(
    lastPosition || { lat: 12.9716, lng: 77.5946 }
  );
  const [selectedTask, setSelectedTask] = useState(null);

  // Get real GPS on mount
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setAgentPos({ lat: latitude, lng: longitude });
      },
      () => {},
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Listen for socket tracking updates from supervisor side
  useEffect(() => {
    if (!socket) return;
    socket.on("tracking:update", (d) => {
      if (d?.agentId) {
        // Could update agent position from server if needed
      }
    });
    return () => socket.off("tracking:update");
  }, [socket]);

  // Auto-select in-progress task — derived from tasks, no effect needed
  const currentTask =
    selectedTask ||
    tasks.find((t) => t.status === "in_progress") ||
    activeTasks[0] ||
    null;

  const destLat = currentTask?.location?.coordinates?.[1] || currentTask?.destinationLat;
  const destLng = currentTask?.location?.coordinates?.[0] || currentTask?.destinationLng;

  const handleOpenNavigation = () => {
    if (!currentTask) return;
    const query = destLat && destLng
      ? `${destLat},${destLng}`
      : encodeURIComponent(currentTask.address || "");
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Map & Navigation"
        description="Track your location and navigate to member addresses"
        actions={
          <div className="flex items-center gap-2 text-xs">
            {isTracking ? (
              <span className="flex items-center gap-1.5 text-green-600">
                <Wifi className="h-3.5 w-3.5 animate-pulse" />
                GPS Active
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <WifiOff className="h-3.5 w-3.5" />
                GPS Idle
              </span>
            )}
          </div>
        }
      />

      {/* Active Task Selector */}
      {activeTasks.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {activeTasks.map((t) => (
            <button
              key={t._id}
              onClick={() => setSelectedTask(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                selectedTask?._id === t._id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:bg-muted"
              }`}
            >
              <Badge className="mr-1.5 capitalize text-[10px]">
                {t.status?.replace(/_/g, " ")}
              </Badge>
              {t.wasteType}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Map */}
        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-0 overflow-hidden rounded-lg">
              <RouteMap
                route={
                  destLat && destLng
                    ? [agentPos, { lat: destLat, lng: destLng }]
                    : [agentPos]
                }
                markers={[
                  { position: agentPos, title: "📍 You" },
                  ...(destLat && destLng
                    ? [{ position: { lat: destLat, lng: destLng }, title: "🏠 Member" }]
                    : []),
                ]}
                height={420}
              />
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Agent Location */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Your Location
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1">
              <p>Lat: {agentPos.lat.toFixed(6)}</p>
              <p>Lng: {agentPos.lng.toFixed(6)}</p>
            </CardContent>
          </Card>

          {/* Selected Task Info */}
          {currentTask ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Destination
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-3">
                <p className="leading-relaxed">{currentTask.address}</p>
                {destLat && destLng && (
                  <p className="text-muted-foreground">
                    {destLat.toFixed(6)}, {destLng.toFixed(6)}
                  </p>
                )}
                <Button
                  size="sm"
                  className="w-full text-xs"
                  onClick={handleOpenNavigation}
                >
                  <Navigation className="h-3.5 w-3.5 mr-1.5" />
                  Navigate in Google Maps
                </Button>
                <Link
                  to={`/delivery/tasks/${currentTask._id}`}
                  className="flex items-center justify-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open task details
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-xs text-muted-foreground">
                <Route className="h-6 w-6 mx-auto mb-2 opacity-40" />
                No active tasks
              </CardContent>
            </Card>
          )}

          {/* All tasks mini list */}
          {tasks.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">All Tasks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tasks.slice(0, 5).map((t) => (
                  <div
                    key={t._id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="truncate max-w-[120px] capitalize">
                      {t.wasteType}
                    </span>
                    <Badge className="capitalize text-[10px]">
                      {t.status?.replace(/_/g, " ")}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
