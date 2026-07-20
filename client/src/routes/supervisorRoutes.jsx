import { lazy } from "react";
import { Routes, Route } from "react-router-dom";

const SupervisorDashboardPage = lazy(() =>
  import("@/pages/supervisor/SupervisorDashboardPage")
);
const SupervisorAgentsPage = lazy(() =>
  import("@/pages/supervisor/SupervisorAgentsPage")
);
const SupervisorAssignmentsPage = lazy(() =>
  import("@/pages/supervisor/SupervisorAssignmentsPage")
);
const SupervisorVerificationsPage = lazy(() =>
  import("@/pages/supervisor/SupervisorVerificationsPage")
);
const SupervisorMapPage = lazy(() =>
  import("@/pages/supervisor/SupervisorMapPage")
);
const SupervisorAnalyticsPage = lazy(() =>
  import("@/pages/supervisor/SupervisorAnalyticsPage")
);

export default function SupervisorRoutes() {
  return (
    <Routes>
      <Route index element={<SupervisorDashboardPage />} />
      <Route path="dashboard" element={<SupervisorDashboardPage />} />
      <Route path="agents" element={<SupervisorAgentsPage />} />
      <Route path="assignments" element={<SupervisorAssignmentsPage />} />
      <Route path="verifications" element={<SupervisorVerificationsPage />} />
      <Route path="map" element={<SupervisorMapPage />} />
      <Route path="analytics" element={<SupervisorAnalyticsPage />} />
    </Routes>
  );
}
