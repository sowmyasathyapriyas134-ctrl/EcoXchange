import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  authApi,
  sessionFromFirebaseResponse,
  userFromMeResponse,
} from "@/api/auth.api";
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

export function useFirebaseLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload) => authApi.firebaseLogin(payload),
    onSuccess: (res) => {
      const session = sessionFromFirebaseResponse(res);
      if (!session) {
        toast.error(res.message ?? "Login failed");
        return;
      }
      setSession({
        token: session.token,
        user: session.user,
        modelName: session.modelName,
      });
      connectSocket();
      qc.invalidateQueries({ queryKey: queryKeys.auth.me });
      toast.success("Signed in successfully");
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
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
