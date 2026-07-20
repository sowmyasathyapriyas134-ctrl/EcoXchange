import { apiClient } from "./axios";

export const trialApi = {
  getSchedule: () => apiClient.get("/trial/schedule"),
  getProgress: () => apiClient.get("/trial/progress"),
  getSubmissions: () => apiClient.get("/trial/submissions/my"),
  uploadPhoto: (formData) =>
    apiClient.post("/trial/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  createSubmission: (imageUrl) => apiClient.post("/trial/submissions", { imageUrl }),
};
