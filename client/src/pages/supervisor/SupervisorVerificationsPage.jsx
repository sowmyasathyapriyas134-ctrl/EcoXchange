import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useSupervisorProofs,
  useVerifyPickup,
  useRejectVerification,
  supervisorKeys,
} from "@/hooks/queries/useSupervisor";
import { useSupervisorStore } from "@/store/supervisor.store";
import { useSocket } from "@/hooks/useSocket";
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  MapPin,
  Weight,
  Calendar,
  User,
  Truck,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  ScanLine,
} from "lucide-react";

const WASTE_ICONS = {
  plastic: "🧴",
  paper: "📄",
  metal: "🔩",
  glass: "🍶",
  organic: "🌿",
  ewaste: "💻",
};

function RejectModal({ pickupId, onClose, onConfirm, isPending }) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="h-5 w-5" />
          <h3 className="font-semibold">Reject Verification</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Provide a reason for rejection. The pickup will be returned to the pending queue and the member will be notified.
        </p>
        <textarea
          className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          placeholder="e.g. Proof photo unclear, wrong waste type, weight mismatch…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground text-right">{reason.length}/500</p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={!reason.trim() || isPending}
            onClick={() => onConfirm(pickupId, reason.trim())}
          >
            Confirm Rejection
          </Button>
        </div>
      </div>
    </div>
  );
}

function VerificationCard({ pickup, onApprove, onReject, isApprovePending, isRejectPending }) {
  const [imageIdx, setImageIdx] = useState(0);
  const proofs = pickup.proofs ?? [];
  const currentProof = proofs[imageIdx];

  return (
    <Card className="overflow-hidden">
      {/* Proof Image */}
      <div className="relative bg-muted aspect-video flex items-center justify-center overflow-hidden">
        {currentProof?.imageUrl ? (
          <img
            src={currentProof.imageUrl}
            alt="Proof of pickup"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImageIcon className="h-10 w-10 opacity-40" />
            <p className="text-xs">No proof image uploaded</p>
          </div>
        )}

        {/* Image navigator */}
        {proofs.length > 1 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 rounded-full px-2 py-1">
            <button
              onClick={() => setImageIdx((i) => Math.max(0, i - 1))}
              disabled={imageIdx === 0}
              className="text-white disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-white text-xs">
              {imageIdx + 1}/{proofs.length}
            </span>
            <button
              onClick={() => setImageIdx((i) => Math.min(proofs.length - 1, i + 1))}
              disabled={imageIdx === proofs.length - 1}
              className="text-white disabled:opacity-40"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* QR scanned badge */}
        {pickup.qrScanned && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-full">
            <ScanLine className="h-3 w-3" />
            QR Verified
          </div>
        )}
      </div>

      {/* Details */}
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">{WASTE_ICONS[pickup.wasteType] ?? "🗑️"}</span>
              <span className="font-semibold capitalize">{pickup.wasteType}</span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" /> {pickup.address}
            </p>
          </div>
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]" variant="outline">
            Pending Review
          </Badge>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Weight className="h-3 w-3" />
            <span>Est: {pickup.estimatedWeight} kg</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Weight className="h-3 w-3" />
            <span>Actual: {pickup.actualWeight ?? "—"} kg</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <User className="h-3 w-3" />
            <span className="truncate">{pickup.user?.fullName ?? "Unknown"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Truck className="h-3 w-3" />
            <span className="truncate">{pickup.assignedAgent?.name ?? "—"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
            <Calendar className="h-3 w-3" />
            <span>
              Completed{" "}
              {pickup.updatedAt
                ? new Date(pickup.updatedAt).toLocaleString()
                : "—"}
            </span>
          </div>
        </div>

        {/* Agent notes */}
        {pickup.completionNotes && (
          <div className="bg-muted/60 rounded-lg px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground mb-0.5">Agent Notes:</p>
            <p className="text-xs">{pickup.completionNotes}</p>
          </div>
        )}

        {/* EcoPoints preview (display only — backend calculates) */}
        {pickup.ecoPointsAwarded > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 rounded px-2 py-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {pickup.ecoPointsAwarded} EcoPoints calculated by backend
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs"
            size="sm"
            disabled={isApprovePending}
            onClick={() => onApprove(pickup._id)}
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            Approve
          </Button>
          <Button
            className="flex-1 text-xs"
            size="sm"
            variant="destructive"
            disabled={isRejectPending}
            onClick={() => onReject(pickup._id)}
          >
            <XCircle className="h-3.5 w-3.5 mr-1.5" />
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SupervisorVerificationsPage() {
  const qc = useQueryClient();
  const { socket } = useSocket();
  const [page, setPage] = useState(1);
  const { rejectModalOpen, rejectTarget, openRejectModal, closeRejectModal } =
    useSupervisorStore();

  const { data, isLoading, isError, refetch } = useSupervisorProofs({ page });
  const verifyMutation = useVerifyPickup();
  const rejectMutation = useRejectVerification();

  const pickups = data?.data ?? [];
  const pagination = data?.pagination;

  const handleApprove = useCallback(
    (pickupId) => {
      verifyMutation.mutate(pickupId);
    },
    [verifyMutation]
  );

  const handleOpenReject = useCallback(
    (pickupId) => {
      openRejectModal(pickupId);
    },
    [openRejectModal]
  );

  const handleConfirmReject = useCallback(
    (pickupId, reason) => {
      rejectMutation.mutate(
        { pickupId, rejectionReason: reason },
        {
          onSuccess: () => {
            closeRejectModal();
          },
        }
      );
    },
    [rejectMutation, closeRejectModal]
  );

  // Socket: refresh when a new pickup is completed
  useEffect(() => {
    if (!socket) return;
    const refresh = () => {
      qc.invalidateQueries({ queryKey: ["supervisor", "proofs"] });
      qc.invalidateQueries({ queryKey: supervisorKeys.dashboardStats });
    };
    socket.on("task:completed", refresh);
    return () => {
      socket.off("task:completed", refresh);
    };
  }, [socket, qc]);

  const pendingCount = pagination?.total ?? pickups.length;

  return (
    <>
      {/* Reject Modal */}
      {rejectModalOpen && (
        <RejectModal
          pickupId={rejectTarget}
          onClose={closeRejectModal}
          onConfirm={handleConfirmReject}
          isPending={rejectMutation.isPending}
        />
      )}

      <div className="space-y-6">
        <PageHeader
          title="Verification Queue"
          description="Review proof photos and approve or reject completed pickups"
          actions={
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </Button>
          }
        />

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Pending Review"
            value={String(pendingCount)}
            icon={ClipboardCheck}
            className={pendingCount > 0 ? "border-amber-300" : ""}
          />
          <StatCard label="Approved Today" value="—" icon={CheckCircle2} />
          <StatCard label="Rejected Today" value="—" icon={XCircle} />
        </div>

        {/* Important note */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-3 px-4">
            <p className="text-xs text-blue-800 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              EcoPoints are calculated and awarded by the backend — never manually. Approving confirms the collection is valid.
            </p>
          </CardContent>
        </Card>

        {/* Content */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-80 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Failed to load verifications.{" "}
              <button onClick={() => refetch()} className="text-primary underline">
                Retry
              </button>
            </CardContent>
          </Card>
        ) : pickups.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 mx-auto text-green-500 opacity-50" />
              <p className="text-sm font-medium text-muted-foreground">
                All caught up! No pickups pending verification.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pickups.map((pickup) => (
                <VerificationCard
                  key={pickup._id}
                  pickup={pickup}
                  onApprove={handleApprove}
                  onReject={handleOpenReject}
                  isApprovePending={verifyMutation.isPending}
                  isRejectPending={rejectMutation.isPending}
                />
              ))}
            </div>

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
    </>
  );
}
