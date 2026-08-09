import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import {
  adminUsersApi,
  adminCreateApi,
  adminAnalyticsApi,
  adminRevenueApi,
  adminMarketplaceApi,
  adminPickupsApi,
  adminRewardsApi,
  adminNotificationsApi,
  adminWalletApi,
} from "@/api/admin.api";

// ── Users ──────────────────────────────────────────────────────────────────────
export function useAdminUsers() {
  return useQuery({
    queryKey: queryKeys.admin.users,
    queryFn: async () => {
      const { data } = await adminUsersApi.getAll();
      return data;
    },
  });
}

export function useAdminUser(id) {
  return useQuery({
    queryKey: queryKeys.admin.user(id),
    queryFn: async () => {
      const { data } = await adminUsersApi.getById(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }) => adminUsersApi.updateRole(id, role),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.users });
      qc.invalidateQueries({ queryKey: queryKeys.admin.user(id) });
    },
  });
}

export function usePromoteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, binSize }) => adminUsersApi.promoteUser(id, binSize),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.users });
      qc.invalidateQueries({ queryKey: queryKeys.admin.user(id) });
    },
  });
}

export function useSuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => adminUsersApi.suspend(id, reason),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.users });
      qc.invalidateQueries({ queryKey: queryKeys.admin.user(id) });
    },
  });
}

export function useRestoreUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => adminUsersApi.restore(id),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.users });
      qc.invalidateQueries({ queryKey: queryKeys.admin.user(id) });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => adminUsersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.users });
    },
  });
}

// ── Create Staff ────────────────────────────────────────────────────────────────
export function useCreateSupervisor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => adminCreateApi.supervisor(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.admin.users }),
  });
}

export function useCreateDeliveryAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => adminCreateApi.deliveryAgent(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.admin.users }),
  });
}

export function useCreateRecycler() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => adminCreateApi.recycler(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.admin.users }),
  });
}

export function useCreateAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => adminCreateApi.admin(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.admin.users }),
  });
}

// ── Analytics ────────────────────────────────────────────────────────────────────
export function useAdminAnalyticsOverview() {
  return useQuery({
    queryKey: queryKeys.admin.analyticsOverview,
    queryFn: async () => {
      const { data } = await adminAnalyticsApi.overview();
      return data;
    },
  });
}

export function useAdminWasteByType() {
  return useQuery({
    queryKey: queryKeys.admin.wasteByType,
    queryFn: async () => {
      const { data } = await adminAnalyticsApi.wasteByType();
      return data;
    },
  });
}

export function useAdminMonthlyTrends() {
  return useQuery({
    queryKey: queryKeys.admin.monthlyTrends,
    queryFn: async () => {
      const { data } = await adminAnalyticsApi.monthlyTrends();
      return data;
    },
  });
}

// ── Revenue / Reports ────────────────────────────────────────────────────────────
export function useAdminRevenueSummary() {
  return useQuery({
    queryKey: queryKeys.admin.revenueSummary,
    queryFn: async () => {
      const { data } = await adminRevenueApi.summary();
      return data;
    },
  });
}

export function useAdminRevenueHistory() {
  return useQuery({
    queryKey: queryKeys.admin.revenueHistory,
    queryFn: async () => {
      const { data } = await adminRevenueApi.history();
      return data;
    },
  });
}

export function useAdminRevenueAnalytics() {
  return useQuery({
    queryKey: queryKeys.admin.revenueAnalytics,
    queryFn: async () => {
      const { data } = await adminRevenueApi.analytics();
      return data;
    },
  });
}

// ── Marketplace ──────────────────────────────────────────────────────────────────
export function useAdminMarketplaceProducts() {
  return useQuery({
    queryKey: queryKeys.admin.marketplaceProducts,
    queryFn: async () => {
      const { data } = await adminMarketplaceApi.allProducts();
      return data;
    },
  });
}

export function useAdminMarketplaceOrders() {
  return useQuery({
    queryKey: queryKeys.admin.marketplaceOrders,
    queryFn: async () => {
      const { data } = await adminMarketplaceApi.allOrders();
      return data;
    },
  });
}

export function useAdminMarketplaceAnalytics() {
  return useQuery({
    queryKey: queryKeys.admin.marketplaceAnalytics,
    queryFn: async () => {
      const { data } = await adminMarketplaceApi.analytics();
      return data;
    },
  });
}

export function useApproveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => adminMarketplaceApi.approveProduct(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.admin.marketplaceProducts }),
  });
}

export function useRejectProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => adminMarketplaceApi.rejectProduct(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.admin.marketplaceProducts }),
  });
}

// ── Pickups ──────────────────────────────────────────────────────────────────────
export function useAdminPickups() {
  return useQuery({
    queryKey: queryKeys.admin.pickups,
    queryFn: async () => {
      const { data } = await adminPickupsApi.getAll();
      return data;
    },
  });
}

// ── Rewards ──────────────────────────────────────────────────────────────────────
export function useAdminRewards() {
  return useQuery({
    queryKey: queryKeys.admin.rewards,
    queryFn: async () => {
      const { data } = await adminRewardsApi.getAll();
      return data;
    },
  });
}

export function useAdminRewardsLeaderboard() {
  return useQuery({
    queryKey: queryKeys.admin.rewardsLeaderboard,
    queryFn: async () => {
      const { data } = await adminRewardsApi.leaderboard();
      return data;
    },
  });
}

export function useCreateReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => adminRewardsApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.admin.rewards }),
  });
}

export function useUpdateReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => adminRewardsApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.admin.rewards }),
  });
}

export function useDeleteReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => adminRewardsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.admin.rewards }),
  });
}

// ── Notifications ────────────────────────────────────────────────────────────────
export function useAdminNotifications() {
  return useQuery({
    queryKey: queryKeys.admin.notifications,
    queryFn: async () => {
      const { data } = await adminNotificationsApi.list();
      return data;
    },
  });
}

export function useAdminMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => adminNotificationsApi.markRead(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.admin.notifications }),
  });
}

export function useAdminMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => adminNotificationsApi.markAllRead(),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.admin.notifications }),
  });
}

// ── Wallet / Ledger ──────────────────────────────────────────────────────────────
export function useAdminWalletLedger() {
  return useQuery({
    queryKey: queryKeys.admin.walletLedger,
    queryFn: async () => {
      const { data } = await adminWalletApi.getLedger();
      return data;
    },
  });
}
