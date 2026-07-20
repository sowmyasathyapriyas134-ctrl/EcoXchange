import { lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

const RecyclerDashboardPage = lazy(() => import("@/pages/recycler/RecyclerDashboardPage"));
const IncomingWastePage = lazy(() => import("@/pages/recycler/IncomingWastePage"));
const ProcessingCenterPage = lazy(() => import("@/pages/recycler/ProcessingCenterPage"));
const InventoryPage = lazy(() => import("@/pages/recycler/InventoryPage"));
const ShipmentsPage = lazy(() => import("@/pages/recycler/ShipmentsPage"));
const OrdersPage = lazy(() => import("@/pages/recycler/OrdersPage"));
const MarketplacePage = lazy(() => import("@/pages/recycler/MarketplacePage"));
const ReportsPage = lazy(() => import("@/pages/recycler/ReportsPage"));
const AnalyticsPage = lazy(() => import("@/pages/recycler/AnalyticsPage"));
const AiAssistantPage = lazy(() => import("@/pages/recycler/AiAssistantPage"));
const SettingsPage = lazy(() => import("@/pages/recycler/SettingsPage"));

export default function RecyclerRoutes() {
  return (
    <Routes>
      <Route index element={<RecyclerDashboardPage />} />
      <Route path="dashboard" element={<RecyclerDashboardPage />} />
      <Route path="incoming" element={<IncomingWastePage />} />
      <Route path="processing" element={<ProcessingCenterPage />} />
      <Route path="inventory" element={<InventoryPage />} />
      <Route path="shipments" element={<ShipmentsPage />} />
      <Route path="orders" element={<OrdersPage />} />
      <Route path="marketplace" element={<MarketplacePage />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="analytics" element={<AnalyticsPage />} />
      <Route path="ai" element={<AiAssistantPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
