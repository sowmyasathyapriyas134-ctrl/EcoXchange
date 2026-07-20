import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import { useAdminUser, useUpdateUserRole, useSuspendUser, useRestoreUser } from "@/hooks/queries/useAdmin";
import { PageHeader } from "@/components/common/PageHeader";
import { ApiError } from "@/components/errors/ApiError";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { StatusChip } from "@/components/common/StatusChip";
import { ArrowLeft, Shield, Ban, CheckCircle } from "lucide-react";

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: user, isLoading, isError, error, refetch } = useAdminUser(id);

  const updateRoleMutation = useUpdateUserRole();
  const suspendMutation = useSuspendUser();
  const restoreMutation = useRestoreUser();

  const [role, setRole] = useState("");
  const [suspendReason, setSuspendReason] = useState("");

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Loading user details…</div>;
  if (isError || !user) {
    return (
      <ApiError
        message={error instanceof Error ? error.message : "Failed to load user details"}
        onRetry={refetch}
      />
    );
  }

  const userData = user.data ?? user;

  const handleUpdateRole = () => {
    if (!role) return;
    updateRoleMutation.mutate(
      { id, role },
      {
        onSuccess: () => {
          toast.success("Role updated successfully");
          refetch();
        },
      }
    );
  };

  const handleSuspend = () => {
    suspendMutation.mutate(
      { id, reason: suspendReason || "Suspended by Administrator" },
      {
        onSuccess: () => {
          toast.success("User suspended");
          refetch();
        },
      }
    );
  };

  const handleRestore = () => {
    restoreMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast.success("User restored");
          refetch();
        },
      }
    );
  };

  return (
    <>
      <Helmet>
        <title>{`User Details - ${userData.name || "Admin"} | EcoXchange`}</title>
      </Helmet>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageHeader
            title={userData.name || "Unnamed User"}
            description={`Manage account permissions and status for ID: ${userData._id}`}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>Basic registration details for this user</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Full Name</Label>
                  <p className="font-semibold text-lg">{userData.name || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-semibold text-lg">{userData.email || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-semibold text-lg">{userData.phone || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="block mt-1">
                    <StatusChip status={userData.isSuspended ? "suspended" : "active"} />
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Joined Date</Label>
                  <p className="text-sm">{userData.createdAt ? new Date(userData.createdAt).toLocaleString() : "—"}</p>
                </div>
                {userData.isSuspended && (
                  <div>
                    <Label className="text-destructive">Suspended Reason</Label>
                    <p className="text-sm text-destructive font-medium">{userData.suspendedReason || "No reason given"}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4 text-primary" />
                  Access Control
                </CardTitle>
                <CardDescription>Change user permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role-select">Account Role</Label>
                  <select
                    id="role-select"
                    className="w-full h-10 rounded-md border border-slate-700 bg-slate-800 text-slate-100 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={role || userData.role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="trial_member">Trial Member</option>
                    <option value="member">Member</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="delivery_agent">Delivery Agent</option>
                    <option value="recycler">Recycler</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <Button
                  className="w-full"
                  disabled={updateRoleMutation.isPending || !role || role === userData.role}
                  onClick={handleUpdateRole}
                >
                  Update Role
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Ban className="h-4 w-4 text-destructive" />
                  Account Security
                </CardTitle>
                <CardDescription>Suspend or restore system access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {userData.isSuspended ? (
                  <Button
                    variant="outline"
                    className="w-full text-emerald-600 hover:text-emerald-700"
                    disabled={restoreMutation.isPending}
                    onClick={handleRestore}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Restore Account
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="suspend-reason">Reason for suspension</Label>
                      <Input
                        id="suspend-reason"
                        placeholder="Reason description…"
                        value={suspendReason}
                        onChange={(e) => setSuspendReason(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="destructive"
                      className="w-full"
                      disabled={suspendMutation.isPending}
                      onClick={handleSuspend}
                    >
                      Suspend Account
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
