import { useState } from "react";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useAdminRewards, useCreateReward, useUpdateReward, useDeleteReward } from "@/hooks/queries/useAdmin";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { ApiError } from "@/components/errors/ApiError";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Modal, ConfirmDialog } from "@/components/common/Modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AdminRewardsPage() {
  const { data, isLoading, isError, error, refetch } = useAdminRewards();
  const createMutation = useCreateReward();
  const updateMutation = useUpdateReward();
  const deleteMutation = useDeleteReward();

  const [openForm, setOpenForm] = useState(false);
  const [editingReward, setEditingReward] = useState(null); // reward object when editing
  const [confirmDelete, setConfirmDelete] = useState(null); // reward object when deleting

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pointsRequired, setPointsRequired] = useState("");
  const [code, setCode] = useState("");
  const [stock, setStock] = useState("");

  const handleOpenCreate = () => {
    setEditingReward(null);
    setTitle("");
    setDescription("");
    setPointsRequired("");
    setCode("");
    setStock("");
    setOpenForm(true);
  };

  const handleOpenEdit = (reward) => {
    setEditingReward(reward);
    setTitle(reward.title || "");
    setDescription(reward.description || "");
    setPointsRequired(reward.pointsRequired || "");
    setCode(reward.code || "");
    setStock(reward.stock || "");
    setOpenForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !pointsRequired) {
      toast.error("Title and Points Required are required fields");
      return;
    }

    const payload = {
      title,
      description,
      pointsRequired: Number(pointsRequired),
      code,
      stock: stock ? Number(stock) : undefined,
    };

    if (editingReward) {
      updateMutation.mutate(
        { id: editingReward._id, body: payload },
        {
          onSuccess: () => {
            toast.success("Reward updated");
            setOpenForm(false);
            refetch();
          },
        }
      );
    } else {
      createMutation.mutate(
        payload,
        {
          onSuccess: () => {
            toast.success("Reward created");
            setOpenForm(false);
            refetch();
          },
        }
      );
    }
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    deleteMutation.mutate(
      { id: confirmDelete._id },
      {
        onSuccess: () => {
          toast.success("Reward deleted");
          setConfirmDelete(null);
          refetch();
        },
      }
    );
  };

  const rewards = data?.data ?? data ?? [];

  const columns = [
    {
      key: "title",
      header: "Reward Title",
      render: (r) => (
        <div>
          <span className="font-semibold block">{r.title}</span>
          <span className="text-xs text-muted-foreground line-clamp-1">{r.description}</span>
        </div>
      ),
    },
    {
      key: "pointsRequired",
      header: "Points Required",
      render: (r) => <span className="font-medium text-primary">{r.pointsRequired} pts</span>,
    },
    {
      key: "code",
      header: "Promo Code",
      render: (r) => <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{r.code || "N/A"}</span>,
    },
    {
      key: "stock",
      header: "Stock",
      render: (r) => <span>{r.stock !== undefined ? r.stock : "Unlimited"}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(r)}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive-50" onClick={() => setConfirmDelete(r)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Loading rewards catalog…</div>;
  if (isError) {
    return (
      <ApiError
        message={error instanceof Error ? error.message : "Failed to load rewards"}
        onRetry={refetch}
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>Manage Rewards Catalog | EcoXchange Admin</title>
      </Helmet>
      <div className="space-y-6">
        <PageHeader
          title="Rewards Catalog"
          description="Manage EcoPoints redeemable rewards available for platform members"
          actions={
            <Button onClick={handleOpenCreate} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Reward Item
            </Button>
          }
        />
        {rewards.length === 0 ? (
          <EmptyState title="Rewards catalog is empty" description="Create a reward item to let members redeem their EcoPoints." />
        ) : (
          <DataTable columns={columns} data={rewards} />
        )}

        <Modal open={openForm} onOpenChange={setOpenForm} title={editingReward ? "Edit Reward" : "Add Reward Item"}>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="reward-title">Title</Label>
              <Input
                id="reward-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Free Eco Mug"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reward-desc">Description</Label>
              <Textarea
                id="reward-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the reward..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reward-points">Points Required</Label>
                <Input
                  id="reward-points"
                  type="number"
                  value={pointsRequired}
                  onChange={(e) => setPointsRequired(e.target.value)}
                  placeholder="100"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reward-stock">Stock Limit</Label>
                <Input
                  id="reward-stock"
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reward-code">Redemption Code / Promo Coupon</Label>
              <Input
                id="reward-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. ECOMUG50"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingReward ? "Save Changes" : "Create Reward"}
              </Button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          open={!!confirmDelete}
          onOpenChange={(open) => !open && setConfirmDelete(null)}
          title="Delete Reward Item"
          description={`Are you sure you want to delete "${confirmDelete?.title}"?`}
          confirmLabel="Delete"
          destructive
          loading={deleteMutation.isPending}
          onConfirm={handleDelete}
        />
      </div>
    </>
  );
}
