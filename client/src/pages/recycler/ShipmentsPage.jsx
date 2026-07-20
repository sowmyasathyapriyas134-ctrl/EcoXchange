import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { DataTable } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { ApiError } from "@/components/errors/ApiError";
import { DashboardSkeleton } from "@/components/loading/DashboardSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/common/Modal";
import { useShipments, useCreateShipment, useUpdateShipmentStatus, useConfirmReceipt } from "@/hooks/queries/useRecycler";
import { useRecyclerStore } from "@/store/recycler.store";
import { Truck, Plus, Scale, MapPin } from "lucide-react";

export default function ShipmentsPage() {
  const { data, isLoading, isError, refetch, isFetching } = useShipments();
  const createMutation = useCreateShipment();
  const updateStatusMutation = useUpdateShipmentStatus();
  const confirmReceiptMutation = useConfirmReceipt();

  const { selectedShipment, setSelectedShipment, clearSelectedShipment, modalOpen, openModal, closeModal } = useRecyclerStore();

  const [form, setForm] = useState({ fromHub: "", wasteType: "plastic", weightKg: "" });

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <ApiError onRetry={refetch} loading={isFetching} />;

  const shipments = data?.data ?? [];

  const totalWeight = shipments.reduce((sum, s) => sum + Number(s.weightKg || 0), 0);

  const handleCreate = (e) => {
    e.preventDefault();
    createMutation.mutate(
      {
        fromHub: form.fromHub,
        wasteType: form.wasteType,
        weightKg: Number(form.weightKg),
      },
      {
        onSuccess: () => {
          closeModal();
          setForm({ fromHub: "", wasteType: "plastic", weightKg: "" });
        },
      }
    );
  };

  const columns = [
    {
      key: "fromHub",
      header: "Origin Hub",
      render: (row) => (
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          {row.fromHub}
        </span>
      ),
    },
    {
      key: "wasteType",
      header: "Material",
      render: (row) => (
        <Badge variant="outline" className="capitalize text-xs">
          {row.wasteType}
        </Badge>
      ),
    },
    {
      key: "weightKg",
      header: "Weight",
      render: (row) => (
        <span className="flex items-center gap-1 text-sm">
          <Scale className="h-3.5 w-3.5 text-muted-foreground" />
          {row.weightKg} kg
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge
          className={`text-[10px] capitalize ${
            row.status === "Receipt Confirmed" || row.status === "Completed"
              ? "bg-green-100 text-green-800 border-green-200"
              : row.status === "Cancelled" || row.status === "Rejected"
              ? "bg-red-100 text-red-800 border-red-200"
              : "bg-blue-100 text-blue-800 border-blue-200"
          }`}
          variant="outline"
        >
          {row.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Action",
      render: (row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedShipment(row);
              openModal("shipment_detail");
            }}
          >
            Details
          </Button>
          {row.status === "Delivered" && (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              disabled={confirmReceiptMutation.isPending}
              onClick={(e) => {
                e.stopPropagation();
                confirmReceiptMutation.mutate({
                  id: row._id,
                  data: { notes: "Receipt confirmed at processing facility" },
                });
              }}
            >
              Confirm Receipt
            </Button>
          )}
          {row.status === "Assigned" && (
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
              disabled={updateStatusMutation.isPending}
              onClick={(e) => {
                e.stopPropagation();
                updateStatusMutation.mutate({ id: row._id, status: "Accepted" });
              }}
            >
              Accept Shipment
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hub Shipments"
        description="Monitor, accept, and manage waste shipments from collection hubs"
        actions={
          <Button onClick={() => openModal("create_shipment")} className="bg-primary text-white text-xs flex items-center gap-1">
            <Plus className="h-4 w-4" /> New Shipment
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Total Shipments" value={String(shipments.length)} icon={Truck} hint="all shipments tracked" />
        <StatCard
          label="Total Cargo Weight"
          value={`${totalWeight} kg`}
          icon={Scale}
          hint="total transit quantity"
          className="border-green-200 dark:border-green-800"
        />
      </div>

      {shipments.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No shipments listed"
          description="There are currently no hub shipments assigned or recorded. Create one or wait for assignation."
        />
      ) : (
        <Card className="backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-white/20 dark:border-slate-800/50">
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={shipments}
              onRowClick={(row) => {
                setSelectedShipment(row);
                openModal("shipment_detail");
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Create Shipment Modal */}
      {modalOpen === "create_shipment" && (
        <Modal
          open={true}
          onClose={() => {
            closeModal();
          }}
          title="Create New Shipment"
        >
          <form onSubmit={handleCreate} className="space-y-4 text-sm">
            <div>
              <Label>Origin Hub</Label>
              <Input
                required
                placeholder="e.g. South Zone Hub A"
                value={form.fromHub}
                onChange={(e) => setForm({ ...form, fromHub: e.target.value })}
              />
            </div>
            <div>
              <Label>Material Category</Label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={form.wasteType}
                onChange={(e) => setForm({ ...form, wasteType: e.target.value })}
              >
                <option value="plastic">Plastic</option>
                <option value="paper">Paper</option>
                <option value="metal">Metal</option>
                <option value="glass">Glass</option>
                <option value="ewaste">E-Waste</option>
              </select>
            </div>
            <div>
              <Label>Weight (kg)</Label>
              <Input
                type="number"
                required
                min="1"
                placeholder="e.g. 250"
                value={form.weightKg}
                onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => closeModal()}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-emerald-600 text-white">
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Shipment Details Modal */}
      {modalOpen === "shipment_detail" && selectedShipment && (
        <Modal
          open={true}
          onClose={() => {
            closeModal();
            clearSelectedShipment();
          }}
          title="Shipment Details"
        >
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-muted-foreground">ID</span>
                <p className="font-mono text-xs">{selectedShipment._id}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Origin Hub</span>
                <p className="font-medium">{selectedShipment.fromHub}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Material</span>
                <p className="font-medium capitalize">{selectedShipment.wasteType}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Weight</span>
                <p className="font-medium">{selectedShipment.weightKg} kg</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status</span>
                <p className="font-medium capitalize">{selectedShipment.status}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Created At</span>
                <p className="font-medium">{new Date(selectedShipment.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {selectedShipment.shipmentHistory && (
              <div>
                <span className="text-muted-foreground font-semibold">History Logs</span>
                <ul className="space-y-1.5 mt-1 border-t pt-2">
                  {selectedShipment.shipmentHistory.map((h, i) => (
                    <li key={i} className="text-xs flex justify-between">
                      <span>
                        <Badge variant="outline" className="scale-90">{h.status}</Badge> - {h.remarks || "No remarks"}
                      </span>
                      <span className="text-muted-foreground">{new Date(h.timestamp).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
