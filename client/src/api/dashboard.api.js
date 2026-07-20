import { apiClient } from "@/api/axios";

export const dashboardApi = {
  getCitizen: async () => {
    const { data } = await apiClient.get("/dashboard/citizen");
    return data;
  },
  getSupervisor: async () => {
    const { data } = await apiClient.get("/dashboard/supervisor");
    return data;
  },
  getRecycler: async () => {
    const { data } = await apiClient.get("/dashboard/recycler");
    return data;
  },
  getAdmin: async () => {
    const { data } = await apiClient.get("/dashboard/admin");
    return data;
  },
};
