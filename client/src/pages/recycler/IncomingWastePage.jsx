import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { ApiError } from "@/components/errors/ApiError";
import { DashboardSkeleton } from "@/components/loading/DashboardSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAvailablePickups, useAcceptPickupForRecycling } from "@/hooks/queries/useRecycler";
import { useRecyclerStore } from "@/store/recycler.store";
import { PackageOpen, Search, MapPin, Calendar, Scale } from "lucide-react";

export default function IncomingWastePage() {
  const { data, isLoading, isError, refetch, isFetching } = useAvailablePickups();
  const acceptMutation = useAcceptPickupForRecycling();
  const { filters, setFilter } = useRecyclerStore();
  const [expandedId, setExpandedId] = useState(null);

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <ApiError onRetry={refetch} loading={isFetching} />;

  const pickups = data?.data ?? [];

  const filtered = pickups.filter((p) => {
    if (filters.material && p.wasteType !== filters.material) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      return (
        p.wasteType?.toLowerCase().includes(q) ||
        p.address?.toLowerCase().includes(q) ||
        p._id?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const columns = [
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
      key: "actualWeight",
      header: "Weight",
      render: (row) => (
        <span className="flex items-center gap-1 text-sm">
          <Scale className="h-3.5 w-3.5 text-muted-foreground" />
          {row.actualWeight ?? "—"} kg
        </span>
      ),
    },
    {
      key: "address",
      header: "Location",
      render: (row) => (
        <span className="flex items-center gap-1 text-sm truncate max-w-[200px]">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {row.address || "—"}
        </span>
      ),
    },
    {
      key: "scheduledDate",
      header: "Date",
      render: (row) => (
        <span className="flex items-center gap-1 text-sm">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          {row.scheduledDate ? new Date(row.scheduledDate).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      render: (row) => (
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
          disabled={acceptMutation.isPending}
          onClick={(e) => {
            e.stopPropagation();
            acceptMutation.mutate(row._id);
          }}
        >
          {acceptMutation.isPending ? "Accepting…" : "Accept"}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incoming Waste"
        description="View completed pickups available for recycling"
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by type or address…"
                className="pl-8 w-64"
                value={filters.search}
                onChange={(e) => setFilter("search", e.target.value)}
              />
            </div>
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={filters.material}
              onChange={(e) => setFilter("material", e.target.value)}
            >
              <option value="">All Materials</option>
              <option value="plastic">Plastic</option>
              <option value="paper">Paper</option>
              <option value="metal">Metal</option>
              <option value="glass">Glass</option>
              <option value="organic">Organic</option>
              <option value="ewaste">E-Waste</option>
            </select>
          </div>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title="No incoming waste"
          description="All completed pickups have already been accepted for recycling. Check back later."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={filtered}
              onRowClick={(row) => setExpandedId(expandedId === row._id ? null : row._id)}
            />
          </CardContent>
        </Card>
      )}

      {/* Expanded detail panel */}
      {expandedId && (() => {
        const pickup = filtered.find((p) => p._id === expandedId);
        if (!pickup) return null;
        return (
          <Card className="border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-4 space-y-2">
              <h3 className="font-semibold text-sm">Pickup Details</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">ID</span>
                  <p className="font-mono text-xs">{pickup._id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Material</span>
                  <p className="capitalize">{pickup.wasteType}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Weight</span>
                  <p>{pickup.actualWeight ?? "—"} kg</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Location</span>
                  <p className="truncate">{pickup.address || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}
