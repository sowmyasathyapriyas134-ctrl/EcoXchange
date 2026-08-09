import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, userFromMeResponse } from "@/api/auth.api";
import { parseApiError } from "@/api/axios";
import { useAuthStore } from "@/store/auth.store";
import { connectSocket } from "@/lib/socket";
import { queryKeys } from "@/lib/query-client";
import toast from "react-hot-toast";

export function useMe(enabled = true) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      const res = await authApi.getMe();
      const mapped = userFromMeResponse(res);
      if (!mapped) throw new Error(res.message ?? "Failed to load profile");
      return mapped;
    },
    enabled: enabled && isAuthenticated,
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      logout();
      qc.clear();
    },
  });
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload) => authApi.login(payload),
    onSuccess: (res) => {
      if (!res.success || !res.token) {
        toast.error(res.message ?? "Login failed");
        return;
      }
      setSession({
        token: res.token,
        user: res.data,
        modelName: res.modelName ?? "User",
      });
      connectSocket();
      qc.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });
}

export function useSendOtp() {
  return useMutation({
    mutationFn: (payload) => authApi.sendOtp(payload),
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });
}

export function useVerifyOtp() {
  const setSession = useAuthStore((s) => s.setSession);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload) => authApi.verifyOtp(payload),
    onSuccess: (res) => {
      if (!res.success || !res.token) {
        toast.error(res.message ?? "Verification failed");
        return;
      }
      setSession({
        token: res.token,
        user: res.data,
        modelName: res.modelName ?? "User",
      });
      connectSocket();
      qc.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });
}
