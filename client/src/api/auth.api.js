import { apiClient } from "@/api/axios";
import { mapApiUser } from "@/utils/mapUser";

export const authApi = {
  login: async (payload) => {
    const { data } = await apiClient.post("/auth/login", payload);
    return data;
  },

  register: async (payload) => {
    const { data } = await apiClient.post("/auth/register", payload);
    return data;
  },

  sendOtp: async (payload) => {
    const { data } = await apiClient.post("/auth/send-otp", payload);
    return data;
  },

  verifyOtp: async (payload) => {
    const { data } = await apiClient.post("/auth/verify-otp", payload);
    return data;
  },

  forgotPassword: async (payload) => {
    const { data } = await apiClient.post("/auth/forgot-password", payload);
    return data;
  },

  resetPassword: async (payload) => {
    const { data } = await apiClient.post("/auth/reset-password", payload);
    return data;
  },

  getMe: async () => {
    const { data } = await apiClient.get("/auth/me");
    return data;
  },

  logout: async () => {
    const { data } = await apiClient.post("/auth/logout");
    return data;
  },

  updateProfile: async (body) => {
    const { data } = await apiClient.put("/auth/profile", body);
    return data;
  },
};

export function userFromMeResponse(res) {
  if (!res.success || !res.data?.user) return null;
  return {
    user: mapApiUser(res.data.user),
    modelName: res.data.modelName,
  };
}
