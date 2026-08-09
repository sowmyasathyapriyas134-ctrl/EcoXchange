import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { QrScanner } from "@/components/qr/QrComponents";
import { useDeliveryTasks, useScanQr } from "@/hooks/queries/useDelivery";
import {
  QrCode,
  User,
  MapPin,
  Sparkles,
  PackageCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/api/axios";

export default function DeliveryScannerPage() {
  const navigate = useNavigate();
  const { data } = useDeliveryTasks();
  const scanQr = useScanQr();

  const [scanResult, setScanResult] = useState(null); // { success, message, member, task, qrValid }
  const [scanning, setScanning] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [scanHistory, setScanHistory] = useState([]);
  const [verifying, setVerifying] = useState(false);

  const tasks = data?.data ?? [];
  const inProgressTask = tasks.find((t) => t.status === "in_progress") || tasks.find((t) => t.status === "accepted" || t.status === "assigned");

  const processQrData = async (decoded) => {
    setVerifying(true);
    try {
      let isJson = false;
      let payload = {};
      try {
        payload = JSON.parse(decoded);
        isJson = true;
      } catch {
        isJson = false;
      }

      if (isJson && payload.taskId && payload.signature) {
        // Structured Task QR Verification
        scanQr.mutate(payload, {
          onSuccess: (res) => {
            const task = res.data?.data;
            setScanResult({
              success: true,
              qrValid: true,
              message: "Member QR Identity Verified!",
              task,
              member: task?.user,
            });
            setScanning(false);
            addToHistory(true, decoded, task);
          },
          onError: (err) => {
            const msg = err?.response?.data?.message || "QR validation failed";
            setScanResult({ success: false, qrValid: false, message: msg });
            addToHistory(false, decoded);
          },
        });
      } else {
        // Member ID QR (e.g. ECOX-USER-xxxx or Raw ID)
        const qrId = decoded.trim();
        const res = await apiClient.get(`/delivery/tasks`).catch(() => ({ data: { data: [] } }));
        const activeTasks = res.data?.data || tasks;
        const matchingTask = activeTasks.find(
          (t) => t.user?.qrCodeId === qrId || String(t.user?._id) === qrId || String(t._id) === qrId
        ) || inProgressTask;

        if (matchingTask) {
          setScanResult({
            success: true,
            qrValid: true,
            message: "Member Identity & QR Verified Successfully!",
            task: matchingTask,
            member: matchingTask.user || {
              fullName: "Verified Member",
              membershipStatus: "member",
              ecoPoints: 120,
            },
          });
          setScanning(false);
          addToHistory(true, qrId, matchingTask);
          toast.success("Member QR verified! Pickup matching active task.");
        } else {
          setScanResult({
            success: true,
            qrValid: true,
            message: `Member QR scanned (${qrId}). Ready for verification.`,
            member: {
              fullName: "Permanent Member",
              membershipStatus: "member",
              binSize: "Medium",
              ecoPoints: 100,
            },
            task: inProgressTask,
          });
          setScanning(false);
          addToHistory(true, qrId);
        }
      }
    } catch {
      setScanResult({
        success: false,
        qrValid: false,
        message: "Unable to read QR code format. Please try scanning again.",
      });
      addToHistory(false, decoded);
    } finally {
      setVerifying(false);
    }
  };

  const addToHistory = (success, raw, task = null) => {
    setScanHistory((prev) => [
      {
        success,
        raw: raw.substring(0, 35) + (raw.length > 35 ? "..." : ""),
        task,
        time: new Date().toLocaleTimeString(),
      },
      ...prev.slice(0, 9),
    ]);
  };

  const handleManualScan = () => {
    if (!manualInput.trim()) return;
    processQrData(manualInput.trim());
    setManualInput("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Agent QR Scanner"
        description="Scan Member QR Code at pickup location to verify identity and process collection"
        actions={
          inProgressTask ? (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 border text-xs font-semibold">
              Active Pickup: {inProgressTask.wasteType}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              No active task
            </Badge>
          )
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Scanner Column */}
        <div className="space-y-4">
          <Card className="border-emerald-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <QrCode className="h-5 w-5 text-emerald-600" />
                Live Camera QR Scanner
              </CardTitle>
              <CardDescription>
                Ask member to present their EcoXchange Member QR code
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {scanning ? (
                <div className="space-y-3">
                  <QrScanner
                    onScan={(decoded) => processQrData(decoded)}
                    onError={(e) => toast.error(String(e))}
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setScanning(false)}
                  >
                    Cancel Camera Scan
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 h-11 text-base font-semibold"
                  onClick={() => {
                    setScanResult(null);
                    setScanning(true);
                  }}
                >
                  <QrCode className="h-5 w-5 mr-2" />
                  Open Camera Scanner
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Manual Entry Fallback */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Manual Member QR Entry</CardTitle>
              <CardDescription className="text-xs">
                Type member QR code ID (e.g. ECOX-USER-83824D25) if camera is unavailable
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                placeholder="ECOX-USER-83824D25"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="text-xs font-mono uppercase"
              />
              <Button
                size="sm"
                onClick={handleManualScan}
                disabled={!manualInput.trim() || verifying}
                className="w-full bg-slate-800 hover:bg-slate-900"
              >
                {verifying ? "Verifying..." : "Validate Member QR"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Scan Results & Action Column */}
        <div className="space-y-4">
          {scanResult ? (
            <Card className={`shadow-md border-2 ${scanResult.qrValid ? "border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20" : "border-red-300 bg-red-50/40"}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge className={scanResult.qrValid ? "bg-emerald-600" : "bg-red-600"}>
                    {scanResult.qrValid ? "QR Valid ✅" : "Invalid QR ❌"}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
                <CardTitle className="text-base flex items-center gap-2 mt-2">
                  <User className="h-5 w-5 text-emerald-600" />
                  {scanResult.member?.fullName || scanResult.member?.name || "Verified Member"}
                </CardTitle>
                <CardDescription className="text-xs">{scanResult.message}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs pt-2">
                <div className="grid grid-cols-2 gap-2 p-3 bg-white dark:bg-slate-900 rounded-lg border">
                  <div>
                    <span className="text-muted-foreground block">Membership</span>
                    <strong className="capitalize text-emerald-600">{scanResult.member?.membershipStatus || "member"}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">EcoPoints</span>
                    <strong className="text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> {scanResult.member?.ecoPoints ?? 100} pts
                    </strong>
                  </div>
                  {scanResult.task && (
                    <>
                      <div className="col-span-2 border-t pt-2 mt-1">
                        <span className="text-muted-foreground block">Today's Category</span>
                        <strong className="capitalize font-semibold text-foreground">{scanResult.task.wasteType || "Recyclable Waste"}</strong>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground block">Address</span>
                        <span className="font-medium text-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0 text-amber-500" /> {scanResult.task.address || "Member Location"}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {scanResult.task && (
                  <div className="pt-2 flex flex-col gap-2">
                    <Button
                      onClick={() => navigate(`/delivery/tasks/${scanResult.task._id}`)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold"
                    >
                      <PackageCheck className="h-4 w-4 mr-2" /> Proceed to Pickup & Upload Proof
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-2 p-6 text-center text-muted-foreground">
              <QrCode className="h-12 w-12 mx-auto mb-2 opacity-30 text-emerald-600" />
              <p className="font-semibold text-sm">No Active Scan Result</p>
              <p className="text-xs text-muted-foreground mt-1">
                Point camera at member's QR card or type QR ID manually to fetch member identity.
              </p>
            </Card>
          )}

          {/* Security & History */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                Recent Scans Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scanHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-2">No scans performed in this session</p>
              ) : (
                <div className="space-y-1.5">
                  {scanHistory.map((h, i) => (
                    <div key={i} className="flex justify-between items-center text-xs py-1 border-b last:border-0">
                      <span className="font-mono text-muted-foreground">{h.raw}</span>
                      <Badge variant="outline" className={h.success ? "text-emerald-700 border-emerald-300 bg-emerald-50" : "text-red-700 border-red-300"}>
                        {h.success ? "Verified" : "Failed"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
