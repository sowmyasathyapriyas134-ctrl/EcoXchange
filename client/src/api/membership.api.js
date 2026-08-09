import { apiClient } from "./axios";

export const membershipApi = {
  createOrder: (binSize) =>
    apiClient.post("/membership/create-order", { binSize }),

  verifyPayment: (payload) =>
    apiClient.post("/membership/verify-payment", payload),

  getStatus: () => apiClient.get("/membership/status"),

  getToolkit: () => apiClient.get("/membership/toolkit"),

  getQRCode: () => apiClient.get("/membership/qrcode"),

  // Admin APIs
  getAdminMemberships: () => apiClient.get("/membership/admin/list"),

  updateAdminToolkitStatus: (id, payload) =>
    apiClient.patch(`/membership/admin/${id}/toolkit-status`, payload),

  regenerateUserQR: (userId) =>
    apiClient.post(`/membership/admin/${userId}/regenerate-qr`),
};
