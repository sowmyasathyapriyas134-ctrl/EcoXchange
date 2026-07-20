import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CameraCapture } from "@/components/camera/CameraCapture";
import { useDeliveryProofs, useUploadProof, useDeleteProof, useDeliveryTasks } from "@/hooks/queries/useDelivery";
import {
  Camera,
  Trash2,
  Image,
  CheckCircle2,
  Plus,
  Eye,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";

export default function DeliveryProofsPage() {
  const { data: proofsData, isLoading } = useDeliveryProofs();
  const { data: tasksData } = useDeliveryTasks();
  const uploadProof = useUploadProof();
  const deleteProof = useDeleteProof();

  const [showCamera, setShowCamera] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);

  const proofs = proofsData?.data ?? [];
  const tasks = tasksData?.data ?? [];
  const inProgressTasks = tasks.filter((t) =>
    ["in_progress", "accepted"].includes(t.status)
  );

  const handleCapture = async (blob) => {
    if (!selectedTaskId) {
      toast.error("Please select a task first");
      return;
    }
    const fd = new FormData();
    fd.append("image", blob, "proof.jpg");
    fd.append("taskId", selectedTaskId);
    fd.append("deviceType", navigator.userAgent);
    fd.append("captureTime", new Date().toISOString());

    uploadProof.mutate(fd, {
      onSuccess: () => setShowCamera(false),
    });
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this proof photo?")) return;
    deleteProof.mutate(id);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proof Photos"
        description="Manage waste collection proof images"
        actions={
          <Button
            size="sm"
            onClick={() => setShowCamera(!showCamera)}
            disabled={!selectedTaskId}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Capture Photo
          </Button>
        }
      />

      {/* Task Selector */}
      {inProgressTasks.length > 0 && (
        <Card>
          <CardContent className="pt-4 space-y-2">
            <p className="text-sm font-medium">Select task for photo:</p>
            <div className="flex gap-2 flex-wrap">
              {inProgressTasks.map((t) => (
                <button
                  key={t._id}
                  onClick={() => setSelectedTaskId(t._id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-colors ${
                    selectedTaskId === t._id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-muted"
                  }`}
                >
                  {t.wasteType} — {t.address?.substring(0, 30)}...
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Camera */}
      {showCamera && selectedTaskId && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              Capture Waste Proof
            </CardTitle>
            <CardDescription className="text-xs">
              Photo will be automatically uploaded to Cloudinary
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CameraCapture onCapture={handleCapture} />
            {uploadProof.isPending && (
              <p className="text-xs text-muted-foreground mt-2 animate-pulse">
                Uploading to Cloudinary…
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Proofs Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="aspect-square rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : proofs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <Image className="h-10 w-10 text-muted-foreground mx-auto opacity-40" />
            <p className="text-muted-foreground text-sm">No proof photos yet</p>
            <p className="text-xs text-muted-foreground">
              Capture waste photos during task execution
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {proofs.length} proof photo{proofs.length !== 1 ? "s" : ""}
            </p>
            <Badge className="bg-green-100 text-green-800 border-green-200 border text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              All Verified
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {proofs.map((proof) => (
              <div
                key={proof._id}
                className="relative group rounded-lg overflow-hidden border bg-muted"
              >
                <img
                  src={proof.imageUrl}
                  alt="Proof"
                  className="w-full aspect-square object-cover"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPreviewUrl(proof.imageUrl)}
                    className="bg-white/20 hover:bg-white/30 text-white rounded-full p-1.5"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <a
                    href={proof.imageUrl}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="bg-white/20 hover:bg-white/30 text-white rounded-full p-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                  <button
                    onClick={() => handleDelete(proof._id)}
                    className="bg-red-500/80 hover:bg-red-500 text-white rounded-full p-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {/* Status badge */}
                <div className="absolute top-1.5 left-1.5">
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-500 text-white">
                    ✓
                  </span>
                </div>
                {/* Time */}
                <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] px-2 py-1">
                  {new Date(proof.captureTime || proof.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Lightbox Preview */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <img
            src={previewUrl}
            alt="Full preview"
            className="max-h-[90vh] max-w-full object-contain rounded-lg"
          />
          <button
            className="absolute top-4 right-4 text-white bg-white/20 rounded-full p-2 hover:bg-white/30"
            onClick={() => setPreviewUrl(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
