import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useMe } from "@/hooks/queries/useAuth";

/** Hydrates session from /auth/me */
export function AuthInitializer({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const { data, isError } = useMe(isAuthenticated);

  useEffect(() => {
    if (data?.user) {
      setUser(data.user);
    }
  }, [data, setUser]);

  useEffect(() => {
    if (isError && isAuthenticated) {
      logout();
    }
  }, [isError, isAuthenticated, logout]);

  return <>{children}</>;
}
