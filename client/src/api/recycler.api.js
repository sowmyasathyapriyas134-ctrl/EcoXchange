import { apiClient } from "./axios";

export const recyclerApi = {
  // Dashboard
  getDashboard: () => apiClient.get("/dashboard/recycler"),

  // Waste Pickups
  getAvailablePickups: () => apiClient.get("/recycler/available"),
  acceptPickup: (pickupId) => apiClient.put(`/recycler/accept/${pickupId}`),
  processPickup: (pickupId, formData) =>
    apiClient.put(`/recycler/process/${pickupId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getProcessedPickups: () => apiClient.get("/recycler/processed"),

  // Payments / Payouts
  createPayment: (pickupId) => apiClient.post(`/recycler/payments/${pickupId}`),
  getPayments: () => apiClient.get("/recycler/payments"),

  // Schedules / Bookings
  getSchedules: () => apiClient.get("/recycler/schedules"),
  createSchedule: (data) => apiClient.post("/recycler/schedules", data),
  updateSchedule: (id, data) => apiClient.put(`/recycler/schedules/${id}`, data),
  deleteSchedule: (id) => apiClient.delete(`/recycler/schedules/${id}`),
  patchScheduleStatus: (id, status) =>
    apiClient.patch(`/recycler/schedules/${id}/status`, { status }),

  // Marketplace – Products (recycler ownership)
  getMyProducts: () => apiClient.get("/marketplace/my-products"),
  createProduct: (formData) =>
    apiClient.post("/marketplace/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateProduct: (id, data) => apiClient.put(`/marketplace/products/${id}`, data),
  deleteProduct: (id) => apiClient.delete(`/marketplace/products/${id}`),
  getSalesReport: () => apiClient.get("/marketplace/my-sales-report"),

  // Shipments
  getShipments: () => apiClient.get("/shipments"),
  createShipment: (data) => apiClient.post("/shipments", data),
  getShipment: (id) => apiClient.get(`/shipments/${id}`),
  updateShipmentStatus: (id, status) =>
    apiClient.patch(`/shipments/${id}/status`, { status }),
  confirmReceipt: (id, data) => apiClient.post(`/shipments/${id}/confirm-receipt`, data),

  // Revenue
  getRevenueSummary: () => apiClient.get("/revenue/summary"),
  getRevenueHistory: () => apiClient.get("/revenue/history"),

  // General Report / Analytics
  getReport: () => apiClient.get("/recycler/report"),

  // Profile
  getProfile: () => apiClient.get("/users/profile"),
  updateProfile: (data) => apiClient.put("/auth/profile", data),

  // Notifications
  getNotifications: () => apiClient.get("/notifications"),
};
