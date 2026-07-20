import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { ApiError } from "@/components/errors/ApiError";
import { DashboardSkeleton } from "@/components/loading/DashboardSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/common/Modal";
import { useProcessedPickups, useCreateRecyclerPayment } from "@/hooks/queries/useRecycler";
import { useRecyclerStore } from "@/store/recycler.store";
import { Cog, Scale, Banknote } from "lucide-react";

export default function ProcessingCenterPage() {
  const processed = useProcessedPickups();
  const paymentMutation = useCreateRecyclerPayment();
  const { selectedBatch, setSelectedBatch, clearSelectedBatch, modalOpen, openModal, closeModal } = useRecyclerStore();

  const isLoading = processed.isLoading;
  const isError = processed.isError;
  const refetch = processed.refetch;
  const isFetching = processed.isFetching;

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <ApiError onRetry={refetch} loading={isFetching} />;

  const items = processed.data?.data ?? [];

  const columns = [
    {
      key: "wasteType",
      header: "Material",
      render: (row) => (
        <Badge variant="outline" className="capitalize text-xs">{row.wasteType}</Badge>
      ),
    },
    {
      key: "recycledWeight",
      header: "Recycled Weight",
      render: (row) => (
        <span className="flex items-center gap-1 text-sm">
          <Scale className="h-3.5 w-3.5 text-muted-foreground" />
          {row.recycledWeight ?? "—"} kg
        </span>
      ),
    },
    {
      key: "recyclingStatus",
      header: "Status",
      render: (row) => (
        <Badge
          className={`text-[10px] capitalize ${
            row.recyclingStatus === "processed"
              ? "bg-green-100 text-green-800 border-green-200"
              : row.recyclingStatus === "accepted"
              ? "bg-blue-100 text-blue-800 border-blue-200"
              : "bg-gray-100 text-gray-800"
          }`}
          variant="outline"
        >
          {row.recyclingStatus}
        </Badge>
      ),
    },
    {
      key: "processingDate",
      header: "Processed",
      render: (row) =>
        row.processingDate
          ? new Date(row.processingDate).toLocaleDateString()
          : "—",
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedBatch(row);
              openModal("confirm_receipt");
            }}
          >
            Details
          </Button>
          {row.recyclingStatus === "processed" && (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              disabled={paymentMutation.isPending}
              onClick={(e) => {
                e.stopPropagation();
                paymentMutation.mutate(row._id);
              }}
            >
              <Banknote className="h-3.5 w-3.5 mr-1" />
              Pay Member
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Processing Center"
        description="View and manage processed waste batches"
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Cog}
          title="No processed pickups yet"
          description="Accept incoming waste and process it to see items here."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={items}
              onRowClick={(row) => {
                setSelectedBatch(row);
                openModal("confirm_receipt");
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Detail Modal */}
      {modalOpen === "confirm_receipt" && selectedBatch && (
        <Modal
          open={true}
          onClose={() => {
            closeModal();
            clearSelectedBatch();
          }}
          title="Batch Details"
        >
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-muted-foreground">Waste Type</span>
                <p className="font-medium capitalize">{selectedBatch.wasteType}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Recycled Weight</span>
                <p className="font-medium">{selectedBatch.recycledWeight ?? "—"} kg</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status</span>
                <p className="font-medium capitalize">{selectedBatch.recyclingStatus}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Processing Date</span>
                <p className="font-medium">
                  {selectedBatch.processingDate
                    ? new Date(selectedBatch.processingDate).toLocaleDateString()
                    : "—"}
                </p>
              </div>
            </div>
            {selectedBatch.processingNotes && (
              <div>
                <span className="text-muted-foreground">Notes</span>
                <p className="text-sm mt-1">{selectedBatch.processingNotes}</p>
              </div>
            )}
            {selectedBatch.recyclingCertificate && (
              <div>
                <span className="text-muted-foreground">Certificate</span>
                <a
                  href={selectedBatch.recyclingCertificate}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-xs block mt-1"
                >
                  View Certificate
                </a>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
