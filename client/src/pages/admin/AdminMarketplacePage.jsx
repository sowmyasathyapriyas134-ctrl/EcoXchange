import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import { Check, X } from "lucide-react";
import { useAdminMarketplaceProducts, useApproveProduct, useRejectProduct } from "@/hooks/queries/useAdmin";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { StatusChip } from "@/components/common/StatusChip";
import { ApiError } from "@/components/errors/ApiError";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";

export default function AdminMarketplacePage() {
  const { data, isLoading, isError, error, refetch } = useAdminMarketplaceProducts();
  const approveMutation = useApproveProduct();
  const rejectMutation = useRejectProduct();

  const handleApprove = (id) => {
    approveMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast.success("Product approved successfully");
          refetch();
        },
      }
    );
  };

  const handleReject = (id) => {
    rejectMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast.success("Product rejected");
          refetch();
        },
      }
    );
  };

  const products = data?.data ?? data ?? [];

  const columns = [
    {
      key: "name",
      header: "Product Name",
      render: (p) => (
        <div>
          <span className="font-semibold block">{p.name}</span>
          <span className="text-xs text-muted-foreground line-clamp-1">{p.description}</span>
        </div>
      ),
    },
    {
      key: "price",
      header: "Price",
      render: (p) => <span>₹{p.price}</span>,
    },
    {
      key: "stock",
      header: "Stock",
    },
    {
      key: "status",
      header: "Status",
      render: (p) => {
        if (p.isApproved) return <StatusChip status="verified" />;
        if (p.status === "rejected") return <StatusChip status="cancelled" />;
        return <StatusChip status="pending" />;
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (p) => (
        <div className="flex items-center gap-2">
          {!p.isApproved && p.status !== "rejected" && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                onClick={() => handleApprove(p._id)}
                disabled={approveMutation.isPending}
              >
                <Check className="h-4 w-4 mr-1" /> Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive-50"
                onClick={() => handleReject(p._id)}
                disabled={rejectMutation.isPending}
              >
                <X className="h-4 w-4 mr-1" /> Reject
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Loading products…</div>;
  if (isError) {
    return (
      <ApiError
        message={error instanceof Error ? error.message : "Failed to load marketplace products"}
        onRetry={refetch}
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>Marketplace Moderation | EcoXchange Admin</title>
      </Helmet>
      <div className="space-y-6">
        <PageHeader
          title="Marketplace Moderation"
          description="Review products listed by Recyclers for public citizen marketplace"
        />
        {products.length === 0 ? (
          <EmptyState title="No products listed" description="There are no marketplace items needing verification." />
        ) : (
          <DataTable columns={columns} data={products} />
        )}
      </div>
    </>
  );
}
