import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusChip } from "@/components/common/StatusChip";
import { EmptyState } from "@/components/common/EmptyState";
import { ApiError } from "@/components/errors/ApiError";
import { DashboardSkeleton } from "@/components/loading/DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useCancelPickup, usePickups } from "@/hooks/queries/useMember";
import { MapPin, Package, Sparkles } from "lucide-react";

const ACTIVE_STATUSES = ["pending", "approved", "assigned", "accepted", "in_progress", "arrived", "collected"];
const HISTORY_STATUSES = ["completed", "cancelled", "rejected"];

export default function PickupsPage() {
  const [tab, setTab] = useState("active");
  const { data, isLoading, isError, refetch, isFetching } = usePickups();
  const cancel = useCancelPickup();

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <ApiError onRetry={refetch} loading={isFetching} />;

  const all = data?.data ?? [];
  const active = all.filter((p) => ACTIVE_STATUSES.includes(p.status));
  const history = all.filter((p) => HISTORY_STATUSES.includes(p.status));

  const mapRow = (p) => ({
    ...p,
    id: p._id,
    date: p.scheduledDate ? new Date(p.scheduledDate).toLocaleDateString("en-IN") : "—",
    createdOn: p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN") : "—",
  });

  const activeColumns = [
    { key: "date", header: "Scheduled" },
    { key: "wasteType", header: "Waste Type", render: (r) => <span className="capitalize">{r.wasteType}</span> },
    { key: "estimatedWeight", header: "Weight (kg)" },
    { key: "address", header: "Address", render: (r) => (
      <span className="flex items-center gap-1 max-w-[180px] truncate text-xs">
        <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />{r.address}
      </span>
    )},
    { key: "status", header: "Status", render: (r) => <StatusChip status={r.status} /> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex gap-2 items-center">
          <Button asChild size="sm" variant="outline" className="h-7 text-xs">
            <Link to={`/member/pickups/${r._id}`}>View</Link>
          </Button>
          {["in_progress", "arrived"].includes(r.status) && (
            <Button asChild size="sm" className="h-7 text-xs">
              <Link to={`/member/tracking/${r._id}`}>Track</Link>
            </Button>
          )}
          {r.status === "pending" && (
            <button
              type="button"
              className="text-destructive text-xs hover:underline"
              onClick={() => cancel.mutate(r._id)}
              disabled={cancel.isPending}
            >
              Cancel
            </button>
          )}
        </div>
      ),
    },
  ];

  const historyColumns = [
    { key: "createdOn", header: "Requested" },
    { key: "date", header: "Scheduled" },
    { key: "wasteType", header: "Waste Type", render: (r) => <span className="capitalize">{r.wasteType}</span> },
    { key: "estimatedWeight", header: "Est. (kg)" },
    {
      key: "actualWeight",
      header: "Actual (kg)",
      render: (r) => r.actualWeight ? <span className="font-medium text-green-600">{r.actualWeight}</span> : "—",
    },
    {
      key: "ecoPointsAwarded",
      header: "EcoPoints",
      render: (r) => r.ecoPointsAwarded > 0
        ? <span className="flex items-center gap-1 text-primary font-semibold"><Sparkles className="h-3 w-3" />+{r.ecoPointsAwarded}</span>
        : <span className="text-muted-foreground">—</span>,
    },
    { key: "status", header: "Result", render: (r) => <StatusChip status={r.status} /> },
    {
      key: "detail",
      header: "",
      render: (r) => (
        <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
          <Link to={`/member/pickups/${r._id}`}>Details</Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pickup Requests"
        description="Manage your waste collection schedule"
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/member/tracking">Live Track</Link>
            </Button>
            <Button asChild>
              <Link to="/member/pickups/new">
                <Package className="h-4 w-4 mr-2" /> New Pickup
              </Link>
            </Button>
          </div>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="active">
            Active
            {active.length > 0 && (
              <Badge className="ml-2 bg-primary text-primary-foreground text-xs h-4 w-4 p-0 flex items-center justify-center rounded-full">
                {active.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {active.length === 0 ? (
            <EmptyState
              title="No active pickups"
              description="Schedule a waste collection to get started"
              action={
                <Button asChild>
                  <Link to="/member/pickups/new">Schedule Pickup</Link>
                </Button>
              }
            />
          ) : (
            <DataTable
              columns={activeColumns}
              data={active.map(mapRow)}
              emptyMessage="No active pickups"
            />
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {history.length === 0 ? (
            <EmptyState
              title="No pickup history"
              description="Your completed and cancelled pickups will appear here"
            />
          ) : (
            <DataTable
              columns={historyColumns}
              data={history.map(mapRow)}
              emptyMessage="No pickup history yet"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
