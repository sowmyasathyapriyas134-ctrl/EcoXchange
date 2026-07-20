import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { DataTable } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { ApiError } from "@/components/errors/ApiError";
import { DashboardSkeleton } from "@/components/loading/DashboardSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMyProducts } from "@/hooks/queries/useRecycler";
import { Warehouse, Package, Boxes, AlertTriangle } from "lucide-react";

export default function InventoryPage() {
  const { data, isLoading, isError, refetch, isFetching } = useMyProducts();

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <ApiError onRetry={refetch} loading={isFetching} />;

  const products = data?.data ?? [];

  const activeCount = products.filter((p) => p.status === "active").length;
  const lowStock = products.filter((p) => Number(p.quantityAvailable || 0) <= 5 && p.status === "active");

  const columns = [
    {
      key: "name",
      header: "Product",
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.images?.[0] ? (
            <img src={row.images[0]} alt={row.name} className="h-8 w-8 rounded object-cover" />
          ) : (
            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <span className="font-medium text-sm truncate max-w-[180px]">{row.name}</span>
        </div>
      ),
    },
    { key: "category", header: "Category", render: (row) => <span className="capitalize text-sm">{row.category || "—"}</span> },
    {
      key: "quantityAvailable",
      header: "Stock",
      render: (row) => {
        const qty = Number(row.quantityAvailable || 0);
        return (
          <span className={`font-medium text-sm ${qty <= 5 ? "text-red-600" : qty <= 20 ? "text-amber-600" : ""}`}>
            {qty}
          </span>
        );
      },
    },
    {
      key: "price",
      header: "Price",
      render: (row) => <span className="text-sm">₹{Number(row.price || 0).toLocaleString("en-IN")}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge
          variant="outline"
          className={`text-[10px] capitalize ${
            row.status === "active"
              ? "bg-green-100 text-green-800 border-green-200"
              : row.status === "draft"
              ? "bg-yellow-100 text-yellow-800 border-yellow-200"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {row.status}
        </Badge>
      ),
    },
    {
      key: "approval",
      header: "Approval",
      render: (row) => (
        <Badge
          variant="outline"
          className={`text-[10px] ${
            row.isApprovedByAdmin
              ? "bg-green-100 text-green-800 border-green-200"
              : "bg-orange-100 text-orange-800 border-orange-200"
          }`}
        >
          {row.isApprovedByAdmin ? "Approved" : "Pending"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" description="Track your product stock levels and availability" />

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Products" value={String(products.length)} icon={Package} hint="all listings" />
        <StatCard
          label="Active Products"
          value={String(activeCount)}
          icon={Boxes}
          hint="approved & live"
          className="border-green-200 dark:border-green-800"
        />
        <StatCard
          label="Low Stock"
          value={String(lowStock.length)}
          icon={AlertTriangle}
          hint="≤ 5 units"
          className={lowStock.length > 0 ? "border-red-200 dark:border-red-800" : ""}
        />
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <Card className="border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800">
          <CardContent className="py-3 px-4 flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-900 dark:text-red-200">
                {lowStock.length} product{lowStock.length > 1 ? "s" : ""} running low on stock
              </p>
              <p className="text-xs text-red-700 dark:text-red-400">
                {lowStock.map((p) => p.name).join(", ")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products table */}
      {products.length === 0 ? (
        <EmptyState
          icon={Warehouse}
          title="No inventory"
          description="Create products in the Marketplace section to see them here."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <DataTable columns={columns} data={products} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
