import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ShieldOff, ShieldCheck, Trash2, UserCog, UserPlus } from "lucide-react";
import { useAdminUsers, useSuspendUser, useRestoreUser, useDeleteUser } from "@/hooks/queries/useAdmin";
import { useAdminStore } from "@/store/admin.store";
import { DataTable } from "@/components/common/DataTable";
import { SearchBar } from "@/components/common/SearchBar";
import { StatusChip } from "@/components/common/StatusChip";
import { Pagination } from "@/components/common/Pagination";
import { ConfirmDialog } from "@/components/common/Modal";
import { ApiError } from "@/components/errors/ApiError";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const PAGE_SIZE = 15;

const ROLE_LABELS = {
  trial_member: "Trial Member",
  member: "Member",
  supervisor: "Supervisor",
  delivery_agent: "Delivery Agent",
  recycler: "Recycler",
  admin: "Admin",
};

/**
 * Shared reusable table for admin user management.
 * @param {object} props
 * @param {string|null} props.roleFilter  - If set, only show users with this role
 * @param {string}      props.emptyLabel  - Label for empty state
 * @param {React.ReactNode} props.actions - Optional header-level action buttons
 */
export function AdminUsersTable({ roleFilter = null, emptyLabel = "No users found", actions }) {
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch, isFetching } = useAdminUsers();

  const search = useAdminStore((s) => s.userSearch);
  const setSearch = useAdminStore((s) => s.setUserSearch);
  const page = useAdminStore((s) => s.usersPage);
  const setPage = useAdminStore((s) => s.setUsersPage);

  const suspendMutation = useSuspendUser();
  const restoreMutation = useRestoreUser();
  const deleteMutation = useDeleteUser();

  const [confirmDelete, setConfirmDelete] = useState(null); // user object
  const [confirmSuspend, setConfirmSuspend] = useState(null);

  const users = useMemo(() => {
    const all = data?.data ?? [];
    let filtered = roleFilter ? all.filter((u) => u.role === roleFilter) : all;
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          (u.name || u.fullName || u.companyName || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          (u.phone || u.phoneNumber || "").toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [data, roleFilter, search]);

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const paged = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (u) => (
        <span className="font-medium">
          {u.name || u.fullName || u.companyName || <span className="text-muted-foreground italic">No name</span>}
        </span>
      ),
    },
    {
      key: "email",
      header: "Email / Phone",
      render: (u) => (
        <span className="text-sm text-muted-foreground">
          {u.email || u.phone || u.phoneNumber || "—"}
        </span>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (u) => (
        <Badge variant="outline" className="capitalize text-xs">
          {ROLE_LABELS[u.role] ?? u.role}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (u) => (
        <StatusChip status={u.isSuspended ? "suspended" : "active"} />
      ),
    },
    {
      key: "createdAt",
      header: "Joined",
      render: (u) =>
        u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—",
    },
    {
      key: "actions",
      header: "",
      render: (u) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2">
              ⋯
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/admin-sowmya/users/${u._id}`)}>
              <UserCog className="mr-2 h-4 w-4" />
              View / Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {u.isSuspended ? (
              <DropdownMenuItem
                onClick={() => {
                  restoreMutation.mutate(
                    { id: u._id },
                    { onSuccess: () => toast.success("User restored") }
                  );
                }}
              >
                <ShieldCheck className="mr-2 h-4 w-4 text-emerald-500" />
                Restore
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => setConfirmSuspend(u)}>
                <ShieldOff className="mr-2 h-4 w-4 text-amber-500" />
                Suspend
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setConfirmDelete(u)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (isError) {
    return (
      <ApiError
        message={error instanceof Error ? error.message : "Failed to load users"}
        onRetry={refetch}
        loading={isFetching}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={search}
          onChange={(q) => { setSearch(q); setPage(1); }}
          placeholder="Search by name, email or phone…"
          className="w-full sm:max-w-xs"
        />
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
      ) : paged.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title={emptyLabel}
          description={search ? "Try a different search term." : undefined}
        />
      ) : (
        <DataTable columns={columns} data={paged} />
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Confirm Suspend */}
      <ConfirmDialog
        open={!!confirmSuspend}
        onOpenChange={(open) => !open && setConfirmSuspend(null)}
        title="Suspend User"
        description={`Are you sure you want to suspend ${confirmSuspend?.name || "this user"}?`}
        confirmLabel="Suspend"
        destructive
        loading={suspendMutation.isPending}
        onConfirm={() => {
          if (!confirmSuspend) return;
          suspendMutation.mutate(
            { id: confirmSuspend._id, reason: "Suspended by admin" },
            {
              onSuccess: () => {
                toast.success("User suspended");
                setConfirmSuspend(null);
              },
            }
          );
        }}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Delete User"
        description={`This will permanently delete ${confirmDelete?.name || "this user"}. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!confirmDelete) return;
          deleteMutation.mutate(
            { id: confirmDelete._id },
            {
              onSuccess: () => {
                toast.success("User deleted");
                setConfirmDelete(null);
              },
            }
          );
        }}
      />
    </div>
  );
}
