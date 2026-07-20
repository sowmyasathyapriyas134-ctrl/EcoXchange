import { create } from "zustand";
import { persist } from "zustand/middleware";
import { disconnectSocket } from "@/lib/socket";

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      modelName: null,
      isAuthenticated: false,
      pendingPhone: null,
      confirmationReady: false,
      setSession: ({ token, user, modelName }) =>
        set({
          token,
          user,
          modelName,
          isAuthenticated: true,
          pendingPhone: null,
        }),
      setPendingPhone: (phone) => set({ pendingPhone: phone }),
      setConfirmationReady: (v) => set({ confirmationReady: v }),
      setUser: (user) => set({ user }),
      logout: () => {
        disconnectSocket();
        set({
          token: null,
          user: null,
          modelName: null,
          isAuthenticated: false,
          pendingPhone: null,
          confirmationReady: false,
        });
      },
    }),
    {
      name: "ecoxchange-auth-v3",
      partialize: (s) => ({
        token: s.token,
        user: s.user,
        modelName: s.modelName,
        isAuthenticated: s.isAuthenticated,
      }),
    },
  ),
);
