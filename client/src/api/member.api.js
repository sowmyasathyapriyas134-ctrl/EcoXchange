import { apiClient } from "./axios";

export const walletApi = {
  getWallet: () => apiClient.get("/wallet/me"),
  getTransactions: () => apiClient.get("/wallet/ledger"),
  withdraw: (body) => apiClient.post("/wallet/withdraw", body),
};

export const profileApi = {
  getProfile: () => apiClient.get("/users/profile"),
  updateProfile: (body) => apiClient.put("/auth/profile", body),
};

export const analyticsApi = {
  memberOverview: () => apiClient.get("/analytics/member/overview"),
};

export const rewardsApi = {
  list: () => apiClient.get("/rewards"),
  myPoints: () => apiClient.get("/rewards/my-points"),
  myRedemptions: () => apiClient.get("/rewards/my-redemptions"),
  redeem: (rewardId) => apiClient.post(`/rewards/redeem/${rewardId}`),
  leaderboard: () => apiClient.get("/rewards/leaderboard"),
};

export const marketplaceApi = {
  getProducts: () => apiClient.get("/marketplace/products"),
  getProduct: (id) => apiClient.get(`/marketplace/products/${id}`),
};

export const cartApi = {
  get: () => apiClient.get("/cart"),
  add: (productId, quantity = 1) => apiClient.post("/cart/add", { productId, quantity }),
  updateItem: (id, quantity) => apiClient.patch(`/cart/item/${id}`, { quantity }),
  removeItem: (id) => apiClient.delete(`/cart/item/${id}`),
};

export const ordersApi = {
  checkout: (body) => apiClient.post("/orders/checkout", body),
  myOrders: () => apiClient.get("/orders/my"),
  getOrder: (id) => apiClient.get(`/orders/${id}`),
};

export const paymentsApi = {
  verify: (body) => apiClient.post("/payments/verify", body),
};

export const pickupsApi = {
  myPickups: () => apiClient.get("/pickups/my"),
  getPickup: (id) => apiClient.get(`/pickups/${id}`),
  create: (formData) =>
    apiClient.post("/pickups", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  cancel: (id) => apiClient.patch(`/pickups/${id}/cancel`),
  qrToken: (id) => apiClient.get(`/pickups/${id}/qr-token`),
};

export const membershipApi = {
  plans: () => apiClient.get("/membership/plans"),
  myMembership: () => apiClient.get("/membership/my-membership"),
  createOrder: (planId) => apiClient.post("/membership/create-order", { planId }),
  verifyPayment: (body) => apiClient.post("/membership/verify-payment", body),
};

export const schedulesApi = {
  available: () => apiClient.get("/recycler/schedules/available"),
};
