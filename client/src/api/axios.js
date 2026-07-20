import axios from "axios";
import { useAuthStore } from "@/store/auth.store";

const baseURL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "/api";

export const apiClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const isAdminPath = window.location.pathname.startsWith("/admin-sowmya");

    if (status === 401) {
      useAuthStore.getState().logout();
      window.location.href = isAdminPath ? "/admin-sowmya" : "/login";
    }

    return Promise.reject(error);
  },
);

export function parseApiError(error) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data?.message) return data.message;
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}
