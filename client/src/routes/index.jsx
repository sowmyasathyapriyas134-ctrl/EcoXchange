import { Routes, Route } from "react-router-dom";
import PublicLayout from "@/layouts/PublicLayout";
import AuthLayout from "@/layouts/AuthLayout";
import RoleLayout from "@/layouts/RoleLayout";
import AdminLayout from "@/layouts/AdminLayout";
import { PrivateRoute } from "@/routes/PrivateRoute";
import { RoleRoute } from "@/routes/RoleRoute";
import { AdminProtectedRoute } from "@/routes/AdminProtectedRoute";
import LandingPage, { RolesPage } from "@/pages/public/LandingPage";
import LoginPage from "@/pages/auth/LoginPage";
import VerifyOtpPage from "@/pages/auth/VerifyOtpPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import NotFoundPage from "@/pages/NotFoundPage";
import UnauthorizedPage from "@/pages/UnauthorizedPage";
import ForbiddenPage from "@/pages/ForbiddenPage";
import ServerErrorPage from "@/pages/ServerErrorPage";
import OfflinePage from "@/pages/OfflinePage";
import TrialDashboardPage from "@/pages/trial/TrialDashboardPage";
import MemberRoutes from "@/routes/memberRoutes";
import SupervisorRoutes from "@/routes/supervisorRoutes";
import DeliveryRoutes from "@/routes/deliveryRoutes";
import RecyclerRoutes from "@/routes/recyclerRoutes";
import AdminLoginPage from "@/pages/admin/AdminLoginPage";
import AdminRoutes from "@/routes/adminRoutes";

import MembershipUpgradePage from "@/pages/member/MembershipUpgradePage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="roles" element={<RolesPage />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="verify-otp" element={<VerifyOtpPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route path="admin-sowmya" element={<AdminLoginPage />} />
      <Route element={<AdminProtectedRoute />}>
        <Route path="admin-sowmya" element={<AdminLayout />}>
          <Route path="*" element={<AdminRoutes />} />
        </Route>
      </Route>

      <Route element={<PrivateRoute />}>
        <Route element={<RoleLayout />}>
          <Route element={<RoleRoute allowedRoles={["trial_member", "member"]} />}>
            <Route path="membership/upgrade" element={<MembershipUpgradePage />} />
          </Route>
          <Route element={<RoleRoute allowedRoles={["trial_member"]} />}>
            <Route index element={<TrialDashboardPage />} />
            <Route path="trial" element={<TrialDashboardPage />} />
            <Route path="trial/dashboard" element={<TrialDashboardPage />} />
            <Route path="trial/*" element={<TrialDashboardPage />} />
          </Route>
          <Route element={<RoleRoute allowedRoles={["member"]} />}>
            <Route path="member/*" element={<MemberRoutes />} />
            <Route path="tracking" element={<MemberRoutes />} />
            <Route path="tracking/:id" element={<MemberRoutes />} />
          </Route>
          <Route element={<RoleRoute allowedRoles={["supervisor"]} />}>
            <Route path="supervisor/*" element={<SupervisorRoutes />} />
          </Route>
          <Route element={<RoleRoute allowedRoles={["delivery_agent"]} />}>
            <Route path="delivery/*" element={<DeliveryRoutes />} />
          </Route>
          <Route element={<RoleRoute allowedRoles={["recycler"]} />}>
            <Route path="recycler/*" element={<RecyclerRoutes />} />
          </Route>
        </Route>
      </Route>

      <Route path="unauthorized" element={<UnauthorizedPage />} />
      <Route path="forbidden" element={<ForbiddenPage />} />
      <Route path="error" element={<ServerErrorPage />} />
      <Route path="offline" element={<OfflinePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
