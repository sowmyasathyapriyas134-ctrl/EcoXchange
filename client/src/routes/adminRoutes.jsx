import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardSkeleton } from "@/components/loading/DashboardSkeleton";

const AdminDashboardPage = lazy(() => import("@/pages/admin/AdminDashboardPage"));
const AdminUsersPage = lazy(() => import("@/pages/admin/AdminUsersPage"));
const AdminUserDetailPage = lazy(() => import("@/pages/admin/AdminUserDetailPage"));
const AdminMembersPage = lazy(() => import("@/pages/admin/AdminMembersPage"));
const AdminTrialMembersPage = lazy(() => import("@/pages/admin/AdminTrialMembersPage"));
const AdminDeliveryAgentsPage = lazy(() => import("@/pages/admin/AdminDeliveryAgentsPage"));
const AdminSupervisorsPage = lazy(() => import("@/pages/admin/AdminSupervisorsPage"));
const AdminRecyclersPage = lazy(() => import("@/pages/admin/AdminRecyclersPage"));
const AdminMarketplacePage = lazy(() => import("@/pages/admin/AdminMarketplacePage"));
const AdminOrdersPage = lazy(() => import("@/pages/admin/AdminOrdersPage"));
const AdminPickupsPage = lazy(() => import("@/pages/admin/AdminPickupsPage"));
const AdminWalletPage = lazy(() => import("@/pages/admin/AdminWalletPage"));
const AdminPaymentsPage = lazy(() => import("@/pages/admin/AdminPaymentsPage"));
const AdminRewardsPage = lazy(() => import("@/pages/admin/AdminRewardsPage"));
const AdminEcoPointsPage = lazy(() => import("@/pages/admin/AdminEcoPointsPage"));
const AdminAnalyticsPage = lazy(() => import("@/pages/admin/AdminAnalyticsPage"));
const AdminReportsPage = lazy(() => import("@/pages/admin/AdminReportsPage"));
const AdminNotificationsPage = lazy(() => import("@/pages/admin/AdminNotificationsPage"));
const AdminAuditLogsPage = lazy(() => import("@/pages/admin/AdminAuditLogsPage"));
const AdminRolesPage = lazy(() => import("@/pages/admin/AdminRolesPage"));
const AdminSettingsPage = lazy(() => import("@/pages/admin/AdminSettingsPage"));
const AdminProfilePage = lazy(() => import("@/pages/admin/AdminProfilePage"));

export default function AdminRoutes() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="users/:id" element={<AdminUserDetailPage />} />
        <Route path="members" element={<AdminMembersPage />} />
        <Route path="trial-members" element={<AdminTrialMembersPage />} />
        <Route path="delivery-agents" element={<AdminDeliveryAgentsPage />} />
        <Route path="supervisors" element={<AdminSupervisorsPage />} />
        <Route path="recyclers" element={<AdminRecyclersPage />} />
        <Route path="marketplace" element={<AdminMarketplacePage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="pickups" element={<AdminPickupsPage />} />
        <Route path="wallet" element={<AdminWalletPage />} />
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="rewards" element={<AdminRewardsPage />} />
        <Route path="ecopoints" element={<AdminEcoPointsPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="notifications" element={<AdminNotificationsPage />} />
        <Route path="audit-logs" element={<AdminAuditLogsPage />} />
        <Route path="roles" element={<AdminRolesPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="profile" element={<AdminProfilePage />} />
      </Routes>
    </Suspense>
  );
}
