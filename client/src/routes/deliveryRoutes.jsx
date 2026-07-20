import { lazy } from "react";
import { Routes, Route } from "react-router-dom";

const DeliveryDashboardPage = lazy(() => import("@/pages/delivery/DeliveryDashboardPage"));
const DeliveryTasksPage = lazy(() => import("@/pages/delivery/DeliveryTasksPage"));
const DeliveryTaskDetailPage = lazy(() => import("@/pages/delivery/DeliveryTaskDetailPage"));
const DeliveryMapPage = lazy(() => import("@/pages/delivery/DeliveryMapPage"));
const DeliveryScannerPage = lazy(() => import("@/pages/delivery/DeliveryScannerPage"));
const DeliveryProofsPage = lazy(() => import("@/pages/delivery/DeliveryProofsPage"));
const DeliveryHistoryPage = lazy(() => import("@/pages/delivery/DeliveryHistoryPage"));

export default function DeliveryRoutes() {
  return (
    <Routes>
      <Route index element={<DeliveryDashboardPage />} />
      <Route path="dashboard" element={<DeliveryDashboardPage />} />
      <Route path="tasks" element={<DeliveryTasksPage />} />
      <Route path="tasks/:id" element={<DeliveryTaskDetailPage />} />
      <Route path="map" element={<DeliveryMapPage />} />
      <Route path="scanner" element={<DeliveryScannerPage />} />
      <Route path="proofs" element={<DeliveryProofsPage />} />
      <Route path="history" element={<DeliveryHistoryPage />} />
    </Routes>
  );
}
