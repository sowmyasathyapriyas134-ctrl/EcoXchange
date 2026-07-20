import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/queries/useNotifications";
import { cn } from "@/lib/utils";

export function NotificationBell({ className }) {
  const { data } = useNotifications();
  const notifications = data?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead && !n.read).length;
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("relative", className)} aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => markAllRead.mutate()}
            >
              Mark all read
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4 text-center">No notifications</p>
        ) : (
          notifications.slice(0, 8).map((n) => (
            <DropdownMenuItem
              key={n._id}
              className={cn("flex flex-col items-start gap-1 cursor-pointer", !(n.isRead ?? n.read) && "bg-accent/50")}
              onClick={() => !(n.isRead ?? n.read) && markRead.mutate(n._id)}
            >
              <span className="text-sm font-medium">{n.title || n.type || "Update"}</span>
              <span className="text-xs text-muted-foreground line-clamp-2">{n.message}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
