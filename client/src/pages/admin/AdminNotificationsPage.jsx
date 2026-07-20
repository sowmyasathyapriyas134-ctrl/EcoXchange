import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import { Check } from "lucide-react";
import { useAdminNotifications, useAdminMarkNotificationRead, useAdminMarkAllNotificationsRead } from "@/hooks/queries/useAdmin";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { ApiError } from "@/components/errors/ApiError";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";

export default function AdminNotificationsPage() {
  const { data, isLoading, isError, error, refetch } = useAdminNotifications();
  const readMutation = useAdminMarkNotificationRead();
  const readAllMutation = useAdminMarkAllNotificationsRead();

  const handleMarkRead = (id) => {
    readMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast.success("Notification marked as read");
          refetch();
        },
      }
    );
  };

  const handleMarkAllRead = () => {
    readAllMutation.mutate(
      undefined,
      {
        onSuccess: () => {
          toast.success("All notifications marked as read");
          refetch();
        },
      }
    );
  };

  const notifications = data?.data ?? data ?? [];

  const columns = [
    {
      key: "message",
      header: "Message",
      render: (n) => (
        <span className={n.isRead ? "text-muted-foreground" : "font-semibold text-slate-100"}>
          {n.message}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Date/Time",
      render: (n) => (
        <span className="text-xs text-muted-foreground">
          {n.createdAt ? new Date(n.createdAt).toLocaleString() : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (n) => (
        <div className="text-right">
          {!n.isRead && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2"
              onClick={() => handleMarkRead(n._id)}
              disabled={readMutation.isPending}
            >
              <Check className="h-4 w-4 mr-1" /> Mark Read
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Loading notifications…</div>;
  if (isError) {
    return (
      <ApiError
        message={error instanceof Error ? error.message : "Failed to load notifications"}
        onRetry={refetch}
      />
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      <Helmet>
        <title>Notifications | EcoXchange Admin</title>
      </Helmet>
      <div className="space-y-6">
        <PageHeader
          title="System Notifications"
          description={`You have ${unreadCount} unread system notifications`}
          actions={
            unreadCount > 0 && (
              <Button onClick={handleMarkAllRead} disabled={readAllMutation.isPending} variant="outline">
                Mark All Read
              </Button>
            )
          }
        />
        {notifications.length === 0 ? (
          <EmptyState title="No notifications" description="All clear! No system notifications generated yet." />
        ) : (
          <DataTable columns={columns} data={notifications} />
        )}
      </div>
    </>
  );
}
