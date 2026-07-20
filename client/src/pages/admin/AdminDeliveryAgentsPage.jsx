import { useState } from "react";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { PageHeader } from "@/components/common/PageHeader";
import { useCreateDeliveryAgent, useAdminUsers } from "@/hooks/queries/useAdmin";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminDeliveryAgentsPage() {
  const { refetch } = useAdminUsers();
  const createMutation = useCreateDeliveryAgent();
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
          toast.success("Delivery Agent created successfully");
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
        <title>Manage Delivery Agents | EcoXchange Admin</title>
      </Helmet>
      <div className="space-y-6">
        <PageHeader
          title="Delivery Agents"
          description="View and manage delivery agents, register new agents"
          actions={
            <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Delivery Agent
            </Button>
          }
        />
        <AdminUsersTable roleFilter="delivery_agent" emptyLabel="No delivery agents registered yet." />

        <Modal open={open} onOpenChange={setOpen} title="Add Delivery Agent">
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="agent-name">Name</Label>
              <Input
                id="agent-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Agent Full Name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-email">Email</Label>
              <Input
                id="agent-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@ecoxchange.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-phone">Phone</Label>
              <Input
                id="agent-phone"
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
                {createMutation.isPending ? "Creating…" : "Create Agent"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
}
