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
import { useMyProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/queries/useRecycler";
import { useRecyclerStore } from "@/store/recycler.store";
import { Store, Plus, Tag, Trash2, Edit } from "lucide-react";

export default function MarketplacePage() {
  const { data, isLoading, isError, refetch, isFetching } = useMyProducts();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const { selectedInventory, setSelectedInventory, clearSelectedInventory, modalOpen, openModal, closeModal } = useRecyclerStore();

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "plastic",
    price: "",
    quantityAvailable: "",
  });

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <ApiError onRetry={refetch} loading={isFetching} />;

  const products = data?.data ?? [];

  const handleCreate = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("description", form.description);
    formData.append("category", form.category);
    formData.append("price", form.price);
    formData.append("quantityAvailable", form.quantityAvailable);

    createMutation.mutate(formData, {
      onSuccess: () => {
        closeModal();
        setForm({ name: "", description: "", category: "plastic", price: "", quantityAvailable: "" });
      },
    });
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    updateMutation.mutate(
      {
        id: selectedInventory._id,
        data: {
          name: form.name,
          description: form.description,
          category: form.category,
          price: Number(form.price),
          quantityAvailable: Number(form.quantityAvailable),
        },
      },
      {
        onSuccess: () => {
          closeModal();
          clearSelectedInventory();
          setForm({ name: "", description: "", category: "plastic", price: "", quantityAvailable: "" });
        },
      }
    );
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this listing?")) {
      deleteMutation.mutate(id);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Product",
      render: (row) => (
        <span className="font-medium text-sm truncate max-w-[180px]">{row.name}</span>
      ),
    },
    { key: "category", header: "Category", render: (row) => <span className="capitalize text-sm">{row.category || "—"}</span> },
    {
      key: "quantityAvailable",
      header: "Stock",
      render: (row) => <span>{row.quantityAvailable} units</span>,
    },
    {
      key: "price",
      header: "Price",
      render: (row) => <span>₹{Number(row.price || 0).toLocaleString("en-IN")}</span>,
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
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {row.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs flex items-center gap-1"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedInventory(row);
              setForm({
                name: row.name,
                description: row.description || "",
                category: row.category || "plastic",
                price: String(row.price),
                quantityAvailable: String(row.quantityAvailable),
              });
              openModal("edit_product");
            }}
          >
            <Edit className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-1"
            disabled={deleteMutation.isPending}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row._id);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace Listings"
        description="Offer your processed and recycled materials to citizen partners and industrial consumers"
        actions={
          <Button onClick={() => openModal("create_product")} className="bg-primary text-white text-xs flex items-center gap-1">
            <Plus className="h-4 w-4" /> Create Listing
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Total Listed Products" value={String(products.length)} icon={Store} hint="all listings registered" />
        <StatCard
          label="Market Value"
          value={`₹${products.reduce((sum, p) => sum + Number(p.price || 0) * Number(p.quantityAvailable || 0), 0).toLocaleString("en-IN")}`}
          icon={Tag}
          hint="potential revenue from stock"
          className="border-green-200 dark:border-green-800"
        />
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No product listings"
          description="You haven't listed any recycled materials yet. Add a new listing to start selling."
        />
      ) : (
        <Card className="backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-white/20 dark:border-slate-800/50">
          <CardContent className="p-0">
            <DataTable columns={columns} data={products} />
          </CardContent>
        </Card>
      )}

      {/* Create Product Modal */}
      {modalOpen === "create_product" && (
        <Modal
          open={true}
          onClose={() => {
            closeModal();
          }}
          title="Create Product Listing"
        >
          <form onSubmit={handleCreate} className="space-y-4 text-sm">
            <div>
              <Label>Product Name</Label>
              <Input
                required
                placeholder="e.g. Recycled PET Flakes Grade A"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                required
                placeholder="e.g. Clean, washed flakes, size 8-10mm suitable for manufacturing"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Category</Label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="plastic">Plastic</option>
                <option value="paper">Paper</option>
                <option value="metal">Metal</option>
                <option value="glass">Glass</option>
                <option value="organic">Organic</option>
                <option value="ewaste">E-Waste</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Price per Unit (₹)</Label>
                <Input
                  type="number"
                  required
                  min="0"
                  placeholder="e.g. 45"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div>
                <Label>Quantity Available</Label>
                <Input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 500"
                  value={form.quantityAvailable}
                  onChange={(e) => setForm({ ...form, quantityAvailable: e.target.value })}
                />
              </div>
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

      {/* Edit Product Modal */}
      {modalOpen === "edit_product" && selectedInventory && (
        <Modal
          open={true}
          onClose={() => {
            closeModal();
            clearSelectedInventory();
          }}
          title="Edit Product Listing"
        >
          <form onSubmit={handleUpdate} className="space-y-4 text-sm">
            <div>
              <Label>Product Name</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Category</Label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="plastic">Plastic</option>
                <option value="paper">Paper</option>
                <option value="metal">Metal</option>
                <option value="glass">Glass</option>
                <option value="organic">Organic</option>
                <option value="ewaste">E-Waste</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Price per Unit (₹)</Label>
                <Input
                  type="number"
                  required
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div>
                <Label>Quantity Available</Label>
                <Input
                  type="number"
                  required
                  min="1"
                  value={form.quantityAvailable}
                  onChange={(e) => setForm({ ...form, quantityAvailable: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { closeModal(); clearSelectedInventory(); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending} className="bg-emerald-600 text-white">
                {updateMutation.isPending ? "Updating..." : "Update"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
