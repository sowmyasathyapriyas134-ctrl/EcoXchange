import { useState } from "react";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { PageHeader } from "@/components/common/PageHeader";
import { useCreateSupervisor, useAdminUsers } from "@/hooks/queries/useAdmin";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminSupervisorsPage() {
  const { refetch } = useAdminUsers();
  const createMutation = useCreateSupervisor();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !phone || !password) {
      toast.error("Please fill in all required fields");
      return;
    }
    createMutation.mutate(
      { name, email, phone, password },
      {
        onSuccess: () => {
          toast.success("Supervisor created successfully");
          setOpen(false);
          setName("");
          setEmail("");
          setPhone("");
          setPassword("");
          refetch();
        },
      }
    );
  };

  return (
    <>
      <Helmet>
        <title>Manage Supervisors | EcoXchange Admin</title>
      </Helmet>
      <div className="space-y-6">
        <PageHeader
          title="Supervisors"
          description="View and manage system supervisors, register new supervisors"
          actions={
            <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Supervisor
            </Button>
          }
        />
        <AdminUsersTable roleFilter="supervisor" emptyLabel="No supervisors registered yet." />

        <Modal open={open} onOpenChange={setOpen} title="Add Supervisor">
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="supervisor-name">Name</Label>
              <Input
                id="supervisor-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Supervisor Full Name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supervisor-email">Email</Label>
              <Input
                id="supervisor-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="supervisor@ecoxchange.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supervisor-phone">Phone</Label>
              <Input
                id="supervisor-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876543210"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supervisor-password">Password *</Label>
              <Input
                id="supervisor-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating…" : "Create Supervisor"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
}
