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
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  History,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function DeliveryScannerPage() {
  const navigate = useNavigate();
  const { data } = useDeliveryTasks();
  const scanQr = useScanQr();

  const [scanResult, setScanResult] = useState(null); // { success, message, task }
  const [scanning, setScanning] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [scanHistory, setScanHistory] = useState([]);

  const tasks = data?.data ?? [];
  const inProgressTask = tasks.find((t) => t.status === "in_progress");

  const processQrData = (decoded) => {
    try {
      const parsed = JSON.parse(decoded);
      const { taskId, agentId, expiry, signature } = parsed;

      if (!taskId || !agentId || !expiry || !signature) {
        setScanResult({
          success: false,
          message: "Invalid QR format. Missing required fields.",
        });
        addToHistory(false, decoded);
        return;
      }

      // Check if expired locally first
      // eslint-disable-next-line react-hooks/purity
      if (Date.now() > parseInt(expiry)) {
        setScanResult({
          success: false,
          message: "QR Code has expired. Ask member to generate a new one.",
        });
        addToHistory(false, decoded);
        return;
      }

      // Send to backend for validation
      scanQr.mutate(
        { taskId, agentId, expiry, signature },
        {
          onSuccess: (res) => {
            const task = res.data?.data;
            setScanResult({ success: true, message: "QR verified!", task });
            setScanning(false);
            addToHistory(true, decoded, task);
          },
          onError: (err) => {
            const msg = err?.response?.data?.message || "QR validation failed";
            setScanResult({ success: false, message: msg });
            addToHistory(false, decoded);
          },
        }
      );
    } catch {
      setScanResult({
        success: false,
        message: "Invalid QR format. Not a valid JSON QR code.",
      });
      addToHistory(false, decoded);
    }
  };

  const addToHistory = (success, raw, task = null) => {
    setScanHistory((prev) => [
      {
        success,
        raw: raw.substring(0, 40) + (raw.length > 40 ? "..." : ""),
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
        title="QR Scanner"
        description="Scan and validate member QR codes during pickup"
        actions={
          inProgressTask ? (
            <Badge className="bg-cyan-100 text-cyan-800 border-cyan-200 border text-xs">
              Active: {inProgressTask.wasteType}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              No active task
            </Badge>
          )
        }
      />

      {!inProgressTask && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-3 px-4 flex items-center gap-2.5 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            You need an in-progress task to validate QR codes. Accept and start a task first.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Scanner */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <QrCode className="h-4 w-4 text-primary" />
                Camera Scanner
              </CardTitle>
              <CardDescription>
                Point camera at member's EcoXchange QR code
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {scanning ? (
                <QrScanner
                  onScan={(decoded) => {
                    processQrData(decoded);
                  }}
                  onError={(e) => toast.error(String(e))}
                />
              ) : (
                <Button
                  className="w-full"
                  onClick={() => {
                    setScanResult(null);
                    setScanning(true);
                  }}
                  disabled={!inProgressTask}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Open Camera Scanner
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Manual Entry */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Manual QR Data Entry</CardTitle>
              <CardDescription className="text-xs">
                For testing or fallback — paste raw QR JSON
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                placeholder='{"taskId":"...","agentId":"...","expiry":...,"signature":"..."}'
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="text-xs font-mono"
              />
              <Button
                size="sm"
                onClick={handleManualScan}
                disabled={!manualInput.trim() || !inProgressTask}
                className="w-full"
              >
                Validate Manual Input
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results + History */}
        <div className="space-y-4">
          {/* Scan Result */}
          {scanResult && (
            <Card
              className={
                scanResult.success
                  ? "border-green-300 bg-green-50"
                  : "border-red-300 bg-red-50"
              }
            >
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-center gap-3">
                  {scanResult.success ? (
                    <CheckCircle2 className="h-8 w-8 text-green-600 shrink-0" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-600 shrink-0" />
                  )}
                  <div>
                    <p
                      className={`font-semibold text-sm ${
                        scanResult.success ? "text-green-800" : "text-red-800"
                      }`}
                    >
                      {scanResult.success ? "Verification Successful" : "Verification Failed"}
                    </p>
                    <p
                      className={`text-xs ${
                        scanResult.success ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {scanResult.message}
                    </p>
                  </div>
                </div>
                {scanResult.success && scanResult.task && (
                  <div className="border-t pt-3 text-xs space-y-1">
                    <p className="capitalize">
                      <span className="font-medium">Waste Type:</span>{" "}
                      {scanResult.task.wasteType}
                    </p>
                    <p>
                      <span className="font-medium">Address:</span>{" "}
                      {scanResult.task.address}
                    </p>
                    <Button
                      size="sm"
                      className="mt-2 text-xs"
                      onClick={() =>
                        navigate(`/delivery/tasks/${scanResult.task._id}`)
                      }
                    >
                      Continue Task →
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Security Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <p>✓ HMAC-SHA256 cryptographic signature validation</p>
              <p>✓ Expiry time checked (10-min window)</p>
              <p>✓ Task ownership verified server-side</p>
              <p>✓ Duplicate scan prevention</p>
            </CardContent>
          </Card>

          {/* Scan History */}
          {scanHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Recent Scans
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {scanHistory.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs border-b last:border-0 pb-1.5"
                  >
                    {h.success ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                    )}
                    <span className="flex-1 text-muted-foreground font-mono truncate">
                      {h.raw}
                    </span>
                    <span className="text-muted-foreground shrink-0">{h.time}</span>
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
