import { apiClient } from "./axios";

// ── Users ─────────────────────────────────────────────────────────────────────
export const adminUsersApi = {
  getAll: () => apiClient.get("/admin/users"),
  getById: (id) => apiClient.get(`/admin/users/${id}`),
  updateRole: (id, role) => apiClient.patch(`/admin/users/${id}/role`, { role }),
  suspend: (id, suspendedReason = "") =>
    apiClient.patch(`/admin/users/${id}/suspend`, { suspendedReason }),
  restore: (id) => apiClient.patch(`/admin/users/${id}/restore`),
  delete: (id) => apiClient.delete(`/admin/users/${id}`),
  promoteUser: (id, binSize) => apiClient.post(`/admin/users/${id}/promote`, { binSize }),
};

// ── Create staff ────────────────────────────────────────────────────────────
export const adminCreateApi = {
  supervisor: (body) => apiClient.post("/admin/users/supervisor", body),
  deliveryAgent: (body) => apiClient.post("/admin/users/delivery-agent", body),
  recycler: (body) => apiClient.post("/admin/users/recycler", body),
  admin: (body) => apiClient.post("/admin/create-admin", body),
};

// ── Analytics ────────────────────────────────────────────────────────────────
export const adminAnalyticsApi = {
  overview: () => apiClient.get("/analytics/admin/overview"),
  wasteByType: () => apiClient.get("/analytics/admin/waste-by-type"),
  monthlyTrends: () => apiClient.get("/analytics/admin/monthly-trends"),
};

// ── Revenue / Reports ────────────────────────────────────────────────────────
export const adminRevenueApi = {
  summary: () => apiClient.get("/revenue/summary"),
  history: () => apiClient.get("/revenue/history"),
  analytics: () => apiClient.get("/revenue/analytics"),
};

// ── Marketplace Moderation ────────────────────────────────────────────────────
export const adminMarketplaceApi = {
  allProducts: () => apiClient.get("/marketplace/products"),
  approveProduct: (id) => apiClient.put(`/marketplace/products/${id}/approve`),
  rejectProduct: (id) => apiClient.put(`/marketplace/products/${id}/reject`),
  allOrders: () => apiClient.get("/marketplace/orders"),
  analytics: () => apiClient.get("/marketplace/analytics"),
};

// ── Pickups ──────────────────────────────────────────────────────────────────
export const adminPickupsApi = {
  getAll: () => apiClient.get("/pickups/admin/all"),
};

// ── Rewards ──────────────────────────────────────────────────────────────────
export const adminRewardsApi = {
  getAll: () => apiClient.get("/rewards"),
  create: (body) => apiClient.post("/rewards", body),
  update: (id, body) => apiClient.put(`/rewards/${id}`, body),
  delete: (id) => apiClient.delete(`/rewards/${id}`),
  leaderboard: () => apiClient.get("/rewards/leaderboard"),
};

// ── Notifications ────────────────────────────────────────────────────────────
export const adminNotificationsApi = {
  list: () => apiClient.get("/notifications"),
  markRead: (id) => apiClient.patch(`/notifications/${id}/read`),
  markAllRead: () => apiClient.patch("/notifications/read-all"),
};

// ── Wallet / Ledger ──────────────────────────────────────────────────────────
export const adminWalletApi = {
  getLedger: () => apiClient.get("/wallet/ledger"),
};
