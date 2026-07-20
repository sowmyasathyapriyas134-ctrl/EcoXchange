import { Link, useParams } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Timeline } from "@/components/common/Timeline";
import { ApiError } from "@/components/errors/ApiError";
import { DashboardSkeleton } from "@/components/loading/DashboardSkeleton";
import { QrGenerator } from "@/components/qr/QrComponents";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePickup, usePickupQr } from "@/hooks/queries/useMember";
import { ArrowLeft, Printer, Share2, Star, MapPin, Package, Sparkles, User, Phone, Download } from "lucide-react";
import toast from "react-hot-toast";

const STATUS_STEPS = [
  { key: "pending", label: "Requested" },
  { key: "approved", label: "Approved" },
  { key: "assigned", label: "Agent Assigned" },
  { key: "accepted", label: "Agent Accepted" },
  { key: "in_progress", label: "En Route" },
  { key: "arrived", label: "Agent Arrived" },
  { key: "collected", label: "Waste Collected" },
  { key: "completed", label: "Verified" },
];

const STATUS_COLOR = {
  pending: "bg-amber-100 text-amber-800 border-amber-300",
  approved: "bg-blue-100 text-blue-800 border-blue-300",
  assigned: "bg-purple-100 text-purple-800 border-purple-300",
  accepted: "bg-indigo-100 text-indigo-800 border-indigo-300",
  in_progress: "bg-cyan-100 text-cyan-800 border-cyan-300",
  arrived: "bg-teal-100 text-teal-800 border-teal-300",
  collected: "bg-lime-100 text-lime-800 border-lime-300",
  completed: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
  rejected: "bg-red-100 text-red-800 border-red-300",
};

function LifecycleProgress({ status }) {
  const current = STATUS_STEPS.findIndex((s) => s.key === status);
  return (
    <div className="w-full overflow-x-auto">
      <ol className="flex items-center min-w-max gap-0 mb-2">
        {STATUS_STEPS.map((step, idx) => {
          const done = idx <= current;
          return (
            <li key={step.key} className="flex items-center">
              <div className={`flex flex-col items-center`}>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    done ? "bg-primary border-primary text-primary-foreground" : "bg-muted border-muted-foreground/30 text-muted-foreground"
                  }`}
                >
                  {idx + 1}
                </div>
                <span className={`text-[10px] mt-1 text-center w-16 leading-tight ${done ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  {step.label}
                </span>
              </div>
              {idx < STATUS_STEPS.length - 1 && (
                <div className={`h-0.5 w-8 mx-0.5 ${idx < current ? "bg-primary" : "bg-muted"}`} />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function PickupDetailPage() {
  const { id } = useParams();
  const pickup = usePickup(id);
  const qr = usePickupQr(id);
  const p = pickup.data?.data ?? pickup.data;

  if (pickup.isLoading) return <DashboardSkeleton />;
  if (pickup.isError || !p) return <ApiError onRetry={pickup.refetch} message="Pickup not found" />;

  const qrPayload = qr.data?.data
    ? JSON.stringify(qr.data.data)
    : p.qrToken || p._id || null;

  const timeline = (p.statusHistory ?? [{ status: p.status, at: p.updatedAt || p.createdAt }]).map(
    (h, i) => ({
      id: i,
      time: h.at ? new Date(h.at).toLocaleString() : "—",
      title: h.status?.replace(/_/g, " ").toUpperCase(),
      description: h.note || `Status updated to "${h.status}"`,
    }),
  );

  const handleShareQr = () => {
    if (navigator.share) {
      navigator.share({
        title: "EcoXchange Pickup QR",
        text: `QR Verification for Pickup: ${p._id}`,
        url: window.location.href,
      }).catch(() => toast.error("Could not share"));
    } else {
      navigator.clipboard.writeText(qrPayload || "");
      toast.success("QR payload copied to clipboard");
    }
  };

  const handleDownloadQr = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) { toast.error("QR not ready yet"); return; }
    const link = document.createElement("a");
    link.download = `pickup-qr-${String(p._id).slice(-6)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("QR downloaded");
  };

  const handlePrint = () => window.print();

  const statusBadgeClass = STATUS_COLOR[p.status] ?? "bg-muted text-muted-foreground border-muted";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back nav */}
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/member/pickups" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Pickups
          </Link>
        </Button>
      </div>

      {/* Header */}
      <PageHeader
        title="Pickup Request Details"
        description={`Request ID: #${String(p._id)}`}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
            {p.status === "completed" && (
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                <Star className="h-4 w-4 mr-2" /> Rate Agent
              </Button>
            )}
          </div>
        }
      />

      {/* Lifecycle stepper */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Pickup Lifecycle</CardTitle>
            <Badge className={`capitalize border text-xs ${statusBadgeClass}`}>
              {p.status?.replace(/_/g, " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4">
          <LifecycleProgress status={p.status} />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main pickup details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" /> Waste Specification
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Waste Category</span>
                  <span className="capitalize font-semibold text-primary">{p.wasteType}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Estimated Weight</span>
                  <span className="font-semibold">{p.estimatedWeight} kg</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Scheduled Date</span>
                  <span className="font-medium">
                    {p.scheduledDate ? new Date(p.scheduledDate).toLocaleDateString("en-IN", { dateStyle: "long" }) : "—"}
                  </span>
                </div>
                {p.actualWeight && (
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Actual Weight</span>
                    <span className="font-semibold text-green-600">{p.actualWeight} kg</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-3">
                <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <MapPin className="h-3.5 w-3.5" /> Pickup Address
                </span>
                <p className="font-medium">{p.address}</p>
              </div>

              {p.notes && (
                <div className="border-t pt-3">
                  <span className="text-xs text-muted-foreground block mb-1">Notes</span>
                  <p className="italic text-muted-foreground">{p.notes}</p>
                </div>
              )}

              {p.verificationResult && (
                <div className={`border-t pt-3 rounded-lg p-3 ${p.verificationResult === "verified" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                  <span className="text-xs text-muted-foreground block mb-1">Verification Result</span>
                  <p className={`font-bold capitalize ${p.verificationResult === "verified" ? "text-green-700" : "text-red-700"}`}>
                    {p.verificationResult}
                  </p>
                  {p.verificationNote && <p className="text-xs mt-1 text-muted-foreground">{p.verificationNote}</p>}
                </div>
              )}

              {p.ecoPointsAwarded !== undefined && p.ecoPointsAwarded > 0 && (
                <div className="border-t pt-3 flex justify-between items-center bg-primary/5 p-3 rounded-lg border border-primary/20">
                  <span className="flex items-center gap-1 text-sm">
                    <Sparkles className="h-4 w-4 text-primary" /> EcoPoints Earned
                  </span>
                  <span className="font-bold text-primary text-lg">+{p.ecoPointsAwarded} pts</span>
                </div>
              )}

              {/* Proof images */}
              {(p.memberImages?.length > 0 || p.completionImages?.length > 0) && (
                <div className="border-t pt-3 space-y-2">
                  <span className="text-xs text-muted-foreground block">Photos</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[...(p.memberImages ?? []), ...(p.completionImages ?? [])].map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`Proof ${i + 1}`}
                        className="h-24 w-full object-cover rounded border"
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status Timeline</CardTitle>
              <CardDescription>Full lifecycle history of this request</CardDescription>
            </CardHeader>
            <CardContent>
              <Timeline items={timeline} />
            </CardContent>
          </Card>
        </div>

        {/* Right column — QR + Agent */}
        <div className="space-y-6">
          {/* QR Card */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-base">Verification QR</CardTitle>
              <CardDescription>Present to agent when they arrive</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              {qrPayload ? (
                <>
                  <QrGenerator value={qrPayload} title="" size={180} />
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <Button variant="outline" size="sm" onClick={handleShareQr}>
                      <Share2 className="h-3.5 w-3.5 mr-1" /> Share
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadQr}>
                      <Download className="h-3.5 w-3.5 mr-1" /> Save
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full text-xs" onClick={handlePrint}>
                    <Printer className="h-3.5 w-3.5 mr-1" /> Print QR
                  </Button>
                </>
              ) : (
                <div className="text-center py-8 space-y-2">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    QR available once an agent accepts the request.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agent Card */}
          {p.assignedAgent ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Delivery Agent
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {(p.assignedAgent.name || "A")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{p.assignedAgent.name || "Assigned Agent"}</p>
                    <p className="text-xs text-muted-foreground">EcoXchange Delivery Professional</p>
                  </div>
                </div>
                {p.assignedAgent.phone && (
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <a href={`tel:${p.assignedAgent.phone}`}>
                      <Phone className="h-3.5 w-3.5 mr-2" /> Call Agent
                    </a>
                  </Button>
                )}
                {["in_progress", "arrived"].includes(p.status) && (
                  <Button asChild size="sm" className="w-full">
                    <Link to={`/member/tracking/${p._id}`}>Track Live Location</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                Awaiting agent assignment by supervisor.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
