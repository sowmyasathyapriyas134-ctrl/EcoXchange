import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/api/notifications.api";
import { invalidateNotifications, queryKeys } from "@/lib/query-client";

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: async () => {
      const { data } = await notificationsApi.list();
      return data;
    },
    refetchInterval: 60_000,
  });
}

export function useUnreadNotificationCount() {
  const { data } = useNotifications();
  const notifications = data?.data ?? [];
  return notifications.filter((n) => !n.read).length;
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => notificationsApi.markRead(id),
    onSuccess: () => invalidateNotifications(qc),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => invalidateNotifications(qc),
  });
}
