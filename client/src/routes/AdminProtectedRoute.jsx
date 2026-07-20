import { Navigate, Outlet } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuthStore } from "@/store/auth.store";
import NotFoundPage from "@/pages/NotFoundPage";

/**
 * Hidden admin portal guard.
 * Non-admins see 404 (no hint that admin exists).
 */
export function AdminProtectedRoute() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/admin-sowmya" replace />;
  }

  if (user.role !== "admin") {
    return <NotFoundPage />;
  }

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <Outlet />
    </>
  );
}
