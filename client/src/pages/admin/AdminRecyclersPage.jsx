import { useState } from "react";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { PageHeader } from "@/components/common/PageHeader";
import { useCreateRecycler, useAdminUsers } from "@/hooks/queries/useAdmin";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminRecyclersPage() {
  const { refetch } = useAdminUsers();
  const createMutation = useCreateRecycler();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      toast.error("Please fill in all fields");
      return;
    }
    createMutation.mutate(
      { name, email, phone },
      {
        onSuccess: () => {
          toast.success("Recycler created successfully");
          setOpen(false);
          setName("");
          setEmail("");
          setPhone("");
          refetch();
        },
      }
    );
  };

  return (
    <>
      <Helmet>
        <title>Manage Recyclers | EcoXchange Admin</title>
      </Helmet>
      <div className="space-y-6">
        <PageHeader
          title="Recyclers"
          description="View and manage partner recyclers, register new recycler organizations"
          actions={
            <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Recycler
            </Button>
          }
        />
        <AdminUsersTable roleFilter="recycler" emptyLabel="No recyclers registered yet." />

        <Modal open={open} onOpenChange={setOpen} title="Add Recycler">
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="recycler-name">Name</Label>
              <Input
                id="recycler-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Recycler Organization Name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recycler-email">Email</Label>
              <Input
                id="recycler-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="recycler@ecoxchange.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recycler-phone">Phone</Label>
              <Input
                id="recycler-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876543210"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating…" : "Create Recycler"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
}
