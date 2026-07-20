import { apiClient } from "@/api/axios";
import { mapSession, mapApiUser } from "@/utils/mapUser";

export const authApi = {
  firebaseLogin: async (payload) => {
    const { data } = await apiClient.post("/auth/firebase", payload);
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

export function sessionFromFirebaseResponse(res) {
  if (!res.success || !res.token || !res.data?.user) return null;
  const mapped = mapSession(res.data);
  return {
    token: res.token,
    user: mapped.user,
    modelName: mapped.modelName,
    wallet: mapped.wallet,
  };
}

export function userFromMeResponse(res) {
  if (!res.success || !res.data?.user) return null;
  return {
    user: mapApiUser(res.data.user),
    modelName: res.data.modelName,
  };
}
