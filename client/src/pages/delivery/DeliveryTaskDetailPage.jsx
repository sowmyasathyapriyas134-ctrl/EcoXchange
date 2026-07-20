import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CameraCapture } from "@/components/camera/CameraCapture";
import { QrScanner } from "@/components/qr/QrComponents";
import { RouteMap } from "@/components/maps/GoogleMap";
import {
  useDeliveryTask,
  useAcceptTask,
  useRejectTask,
  useStartTask,
  useCompleteTask,
  useScanQr,
  useUploadProof,
} from "@/hooks/queries/useDelivery";
import { useDeliveryTaskStore } from "@/store/delivery.store";
import { useSocket } from "@/hooks/useSocket";
import { useQueryClient } from "@tanstack/react-query";
import {
  Truck,
  MapPin,
  CheckCircle2,
  XCircle,
  QrCode,
  Navigation,
  Clock,
  Weight,
  AlertCircle,
  ChevronLeft,
  Play,
  RotateCcw,
  User,
  ExternalLink,
  Wifi,
  WifiOff,
} from "lucide-react";
import toast from "react-hot-toast";

const STEP_ORDER = ["assigned", "accepted", "in_progress", "completed"];

const STATUS_STEP_MAP = {
  assigned: 0,
  accepted: 1,
  in_progress: 2,
  completed: 3,
};

function TaskTimeline({ statusHistory }) {
  if (!statusHistory?.length) return null;
  return (
    <div className="space-y-3">
      {statusHistory.map((h, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-primary shrink-0" />
          <div>
            <p className="text-xs font-semibold capitalize">{h.status?.replace(/_/g, " ")}</p>
            <p className="text-xs text-muted-foreground">{h.notes}</p>
            <p className="text-[10px] text-muted-foreground">
              {new Date(h.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function StepIndicator({ currentStatus }) {
  const current = STATUS_STEP_MAP[currentStatus] ?? 0;
  return (
    <div className="flex items-center gap-0">
      {STEP_ORDER.map((step, i) => (
        <div key={step} className="flex items-center">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold border-2 transition-all ${
              i < current
                ? "bg-green-500 border-green-500 text-white"
                : i === current
                ? "bg-primary border-primary text-primary-foreground"
                : "bg-background border-border text-muted-foreground"
            }`}
          >
            {i < current ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
          </div>
          {i < STEP_ORDER.length - 1 && (
            <div
              className={`h-0.5 w-10 md:w-16 ${
                i < current ? "bg-green-500" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function DeliveryTaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { socket } = useSocket();

  const { data, isLoading, isError } = useDeliveryTask(id);
  const task = data?.data;

  // Mutations
  const acceptTask = useAcceptTask();
  const rejectTask = useRejectTask();
  const startTask = useStartTask();
  const completeTask = useCompleteTask();
  const scanQr = useScanQr();
  const uploadProof = useUploadProof();

  // GPS store
  const { startTracking, stopTracking, isTracking, lastPosition, flushLocationQueue } =
    useDeliveryTaskStore();

  // Local UI state
  const [showScanner, setShowScanner] = useState(false);
  const [capturedImageUrl, setCapturedImageUrl] = useState(null);
  const [actualWeight, setActualWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [agentPosition, setAgentPosition] = useState(lastPosition || { lat: 12.9716, lng: 77.5946 });

  // Get agent GPS on mount
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      setAgentPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  }, []);

  // Start tracking when task is in_progress
  useEffect(() => {
    if (task?.status === "in_progress" && !isTracking) {
      startTracking(id);
    }
  }, [task?.status, isTracking, id, startTracking]);

  // Flush offline queue on mount
  useEffect(() => {
    flushLocationQueue();
  }, [flushLocationQueue]);

  // Socket events
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = (data) => {
      if (data?.pickupId === id || data?.taskId === id) {
        qc.invalidateQueries({ queryKey: ["delivery", "task", id] });
        qc.invalidateQueries({ queryKey: ["delivery", "tasks"] });
      }
    };
    socket.on("task:accepted", handleUpdate);
    socket.on("task:started", handleUpdate);
    socket.on("task:completed", handleUpdate);
    socket.on("pickup:verified", handleUpdate);
    return () => {
      socket.off("task:accepted", handleUpdate);
      socket.off("task:started", handleUpdate);
      socket.off("task:completed", handleUpdate);
      socket.off("pickup:verified", handleUpdate);
    };
  }, [socket, id, qc]);

  const handleQrScan = useCallback(
    (decoded) => {
      try {
        const parsed = JSON.parse(decoded);
        if (parsed.taskId && parsed.taskId !== id) {
          toast.error("This QR code belongs to a different task!");
          return;
        }
        scanQr.mutate(
          { taskId: id, agentId: parsed.agentId, expiry: parsed.expiry, signature: parsed.signature },
          {
            onSuccess: () => setShowScanner(false),
          }
        );
      } catch {
        // If not valid JSON, try direct scan
        toast.error("Invalid QR code format. Please scan the member's EcoXchange QR.");
      }
    },
    [id, scanQr]
  );

  const handleCaptureProof = useCallback(
    async (blob) => {
      const fd = new FormData();
      fd.append("image", blob, "proof.jpg");
      fd.append("taskId", id);
      fd.append("deviceType", navigator.userAgent);
      fd.append("captureTime", new Date().toISOString());
      if (agentPosition) {
        fd.append("latitude", String(agentPosition.lat));
        fd.append("longitude", String(agentPosition.lng));
      }
      uploadProof.mutate(fd, {
        onSuccess: (res) => {
          const url = res.data?.data?.imageUrl;
          if (url) setCapturedImageUrl(url);
        },
      });
    },
    [id, agentPosition, uploadProof]
  );

  const handleComplete = useCallback(() => {
    if (!capturedImageUrl) {
      toast.error("Please capture and upload a proof photo first.");
      return;
    }
    if (!task?.qrScanned) {
      toast.error("Please scan the member's QR code first.");
      return;
    }

    completeTask.mutate(
      {
        id,
        actualWeight: actualWeight ? parseFloat(actualWeight) : task?.estimatedWeight,
        completionNotes: notes,
      },
      {
        onSuccess: () => {
          stopTracking();
          setCapturedImageUrl(null);
          setActualWeight("");
          setNotes("");
          qc.invalidateQueries({ queryKey: ["delivery", "tasks"] });
        },
      }
    );
  }, [capturedImageUrl, task, id, actualWeight, notes, completeTask, stopTracking, qc]);

  const handleOpenMaps = () => {
    if (!task) return;
    const lat = task.location?.coordinates?.[1] || task.destinationLat;
    const lng = task.location?.coordinates?.[0] || task.destinationLng;
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
    } else if (task.address) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.address)}`,
        "_blank"
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-32 rounded-lg border bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError || !task) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">Task not found or you are not authorized.</p>
        <Button variant="outline" onClick={() => navigate("/delivery/tasks")}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Tasks
        </Button>
      </div>
    );
  }

  const destLat = task.location?.coordinates?.[1] || task.destinationLat;
  const destLng = task.location?.coordinates?.[0] || task.destinationLng;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Task: ${task.wasteType?.charAt(0).toUpperCase() + task.wasteType?.slice(1)}`}
        description={`Scheduled: ${new Date(task.scheduledDate).toLocaleDateString()}`}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/delivery/tasks")}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Tasks
            </Button>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {isTracking ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-green-500 animate-pulse" />
                  <span className="text-green-600">GPS Active</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>GPS Idle</span>
                </>
              )}
            </div>
          </div>
        }
      />

      {/* Progress Indicator */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex flex-col items-center gap-3">
            <StepIndicator currentStatus={task.status} />
            <div className="flex gap-4 text-[11px] text-muted-foreground">
              <span>Assigned</span>
              <span>Accepted</span>
              <span>En Route</span>
              <span>Completed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column: Member + Map */}
        <div className="space-y-4">
          {/* Member Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Member Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <span>{task.address}</span>
              </div>
              {task.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded p-2 text-xs text-amber-800">
                  <span className="font-semibold">Notes: </span>
                  {task.notes}
                </div>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Weight className="h-3.5 w-3.5" />
                  Est. {task.estimatedWeight} kg
                </span>
                {task.actualWeight && (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Actual: {task.actualWeight} kg
                  </span>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleOpenMaps}
                  className="text-xs h-8"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Open Google Maps
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Map */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Navigation className="h-4 w-4 text-primary" />
                Route
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RouteMap
                route={[
                  agentPosition,
                  destLat && destLng
                    ? { lat: destLat, lng: destLng }
                    : { lat: 12.9786, lng: 77.6046 },
                ]}
                markers={[
                  { position: agentPosition, title: "You (Agent)" },
                  ...(destLat && destLng
                    ? [{ position: { lat: destLat, lng: destLng }, title: "Member" }]
                    : []),
                ]}
                height={260}
              />
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Task Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TaskTimeline statusHistory={task.statusHistory} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Workflow Actions */}
        <div>
          <Card className="border-primary/20 sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Execute Task</CardTitle>
              <CardDescription>
                Status:{" "}
                <Badge className="capitalize ml-1">
                  {task.status?.replace(/_/g, " ")}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* ── ASSIGNED ──────────────────────────────── */}
              {task.status === "assigned" && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Review the task details and accept to begin navigation.
                  </p>
                  <Button
                    onClick={() => acceptTask.mutate(task._id)}
                    disabled={acceptTask.isPending}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Accept Task
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectForm(!showRejectForm)}
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Task
                  </Button>
                  {showRejectForm && (
                    <div className="space-y-2 border-t pt-3">
                      <Textarea
                        placeholder="Reason for rejection (required)..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={2}
                        className="text-sm"
                      />
                      <Button
                        onClick={() =>
                          rejectTask.mutate(
                            { id: task._id, reason: rejectReason },
                            {
                              onSuccess: () => {
                                setShowRejectForm(false);
                                navigate("/delivery/tasks");
                              },
                            }
                          )
                        }
                        disabled={rejectTask.isPending || !rejectReason.trim()}
                        className="w-full bg-red-600 hover:bg-red-700"
                      >
                        Confirm Rejection
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* ── ACCEPTED ──────────────────────────────── */}
              {task.status === "accepted" && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Navigate to the member's address. Start the task to activate GPS tracking.
                  </p>
                  <Button
                    onClick={() => {
                      startTask.mutate(task._id);
                      startTracking(task._id);
                    }}
                    disabled={startTask.isPending}
                    className="w-full bg-cyan-600 hover:bg-cyan-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Navigation (En Route)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleOpenMaps}
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Google Maps
                  </Button>
                </div>
              )}

              {/* ── IN PROGRESS ───────────────────────────── */}
              {task.status === "in_progress" && (
                <div className="space-y-5">
                  {/* Step 1: QR Scan */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          task.qrScanned
                            ? "bg-green-500 text-white"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        1
                      </div>
                      <Label className="text-sm font-semibold">Verify Member QR Code</Label>
                    </div>
                    {task.qrScanned ? (
                      <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2.5">
                        <CheckCircle2 className="h-4 w-4" />
                        QR Code verified at{" "}
                        {task.qrScannedAt
                          ? new Date(task.qrScannedAt).toLocaleTimeString()
                          : "—"}
                      </div>
                    ) : (
                      <>
                        <Button
                          onClick={() => setShowScanner(!showScanner)}
                          variant={showScanner ? "destructive" : "outline"}
                          className="w-full"
                        >
                          <QrCode className="h-4 w-4 mr-2" />
                          {showScanner ? "Close Scanner" : "Scan Member QR"}
                        </Button>
                        {showScanner && (
                          <div className="pt-1">
                            <QrScanner
                              onScan={handleQrScan}
                              onError={(e) => toast.error(String(e))}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Step 2: Capture Proof */}
                  <div className="space-y-2 border-t pt-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          capturedImageUrl
                            ? "bg-green-500 text-white"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        2
                      </div>
                      <Label className="text-sm font-semibold">Capture Waste Photo</Label>
                    </div>
                    {capturedImageUrl ? (
                      <div className="space-y-2">
                        <img
                          src={capturedImageUrl}
                          alt="Proof"
                          className="w-full h-36 object-cover rounded-lg border"
                        />
                        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Proof photo uploaded to Cloudinary
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCapturedImageUrl(null)}
                          className="text-xs"
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1" />
                          Retake Photo
                        </Button>
                      </div>
                    ) : (
                      <CameraCapture onCapture={handleCaptureProof} />
                    )}
                    {uploadProof.isPending && (
                      <p className="text-xs text-muted-foreground animate-pulse">
                        Uploading to Cloudinary...
                      </p>
                    )}
                  </div>

                  {/* Step 3: Weight + Complete */}
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          task.status === "completed"
                            ? "bg-green-500 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        3
                      </div>
                      <Label className="text-sm font-semibold">Complete Collection</Label>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="actual-weight" className="text-xs">
                        Actual Weight (kg) — estimated: {task.estimatedWeight} kg
                      </Label>
                      <Input
                        id="actual-weight"
                        type="number"
                        step="0.1"
                        placeholder={String(task.estimatedWeight)}
                        value={actualWeight}
                        onChange={(e) => setActualWeight(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="completion-notes" className="text-xs">
                        Completion Remarks
                      </Label>
                      <Textarea
                        id="completion-notes"
                        rows={2}
                        placeholder="e.g. Clean segregation, no leaks..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handleComplete}
                      disabled={
                        completeTask.isPending || !capturedImageUrl || !task.qrScanned
                      }
                      className="w-full bg-green-600 hover:bg-green-700 font-semibold"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {completeTask.isPending
                        ? "Submitting..."
                        : "Complete Waste Collection"}
                    </Button>
                    {(!capturedImageUrl || !task.qrScanned) && (
                      <p className="text-[11px] text-amber-600">
                        {!task.qrScanned && "⚠ QR not scanned. "}
                        {!capturedImageUrl && "⚠ Proof photo required."}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ── COMPLETED ─────────────────────────────── */}
              {task.status === "completed" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
                    <CheckCircle2 className="h-8 w-8 text-green-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-green-800 text-sm">
                        Pickup Completed!
                      </p>
                      <p className="text-xs text-green-700">
                        Submitted for supervisor verification. EcoPoints will be
                        credited once verified.
                      </p>
                    </div>
                  </div>
                  {task.ecoPointsAwarded > 0 && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">
                        +{task.ecoPointsAwarded}
                      </p>
                      <p className="text-xs text-muted-foreground">EcoPoints Awarded</p>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => navigate("/delivery/tasks")}
                    className="w-full"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Back to Task List
                  </Button>
                </div>
              )}

              {/* ── REJECTED / CANCELLED ─────────────────── */}
              {(task.status === "rejected" || task.status === "cancelled") && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
                    <XCircle className="h-6 w-6 text-red-600 shrink-0" />
                    <p className="text-sm text-red-800 capitalize">
                      Task {task.status}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/delivery/tasks")}
                    className="w-full"
                  >
                    Back to Task List
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
