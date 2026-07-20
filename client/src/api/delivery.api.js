import { apiClient } from "./axios";

export const deliveryApi = {
  // Tasks
  getTasks: (params) => apiClient.get("/delivery/tasks", { params }),
  getTask: (id) => apiClient.get(`/delivery/tasks/${id}`),
  acceptTask: (id) => apiClient.post(`/delivery/tasks/${id}/accept`),
  rejectTask: (id, body) => apiClient.post(`/delivery/tasks/${id}/reject`, body),
  startTask: (id) => apiClient.post(`/delivery/tasks/${id}/start`),
  pauseTask: (id, body) => apiClient.post(`/delivery/tasks/${id}/pause`, body),
  resumeTask: (id) => apiClient.post(`/delivery/tasks/${id}/resume`),
  completeTask: (id, body) => apiClient.post(`/delivery/tasks/${id}/complete`, body),

  // QR
  scanQr: (body) => apiClient.post("/delivery/scan", body),

  // Proofs
  getProofs: (params) => apiClient.get("/delivery/proofs", { params }),
  getProof: (id) => apiClient.get(`/delivery/proofs/${id}`),
  uploadProof: (formData) =>
    apiClient.post("/delivery/proofs", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteProof: (id) => apiClient.delete(`/delivery/proofs/${id}`),

  // Location
  sendLocation: (body) => apiClient.post("/delivery/location", body),

  // Analytics
  getAnalytics: () => apiClient.get("/delivery/analytics"),
};
