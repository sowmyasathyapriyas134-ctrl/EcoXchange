import { apiClient } from "./axios";

/**
 * supervisorApi
 * ─────────────
 * Frontend API client for the Supervisor module.
 * All reassign calls use pickupApi.assignAgent (pickupRoutes) per audit.
 */
export const supervisorApi = {
  // ── Dashboard ────────────────────────────────────────────────────────────
  // /api/supervisor/dashboard  — richer; includes recentPickups[]
  getDashboardStats: () => apiClient.get("/supervisor/dashboard"),
  // /api/dashboard/supervisor  — lighter; used by useSupervisorDashboard hook
  getDashboard: () => apiClient.get("/dashboard/supervisor"),

  // ── Agents ───────────────────────────────────────────────────────────────
  getAgents: () => apiClient.get("/supervisor/agents"),
  getAgentLocations: () => apiClient.get("/supervisor/agent-locations"),
  getAgentHistory: (id) => apiClient.get(`/supervisor/agents/${id}/history`),

  // ── Pickups (all statuses, filterable) ───────────────────────────────────
  getPickups: (params) => apiClient.get("/supervisor/pickups", { params }),
  // Pending-only (pre-existing contract)
  getPendingPickups: () => apiClient.get("/pickups/supervisor/pending"),

  // ── Assign / Approve / Reject — reuse existing pickupRoutes ─────────────
  assignAgent: (pickupId, agentId) =>
    apiClient.patch(`/pickups/${pickupId}/assign-agent`, { assignedAgent: agentId }),
  // Reassign = same endpoint as assign (audit confirmed)
  reassignAgent: (pickupId, agentId) =>
    apiClient.patch(`/pickups/${pickupId}/assign-agent`, { assignedAgent: agentId }),
  approvePickup: (pickupId) =>
    apiClient.patch(`/pickups/${pickupId}/approve`),
  rejectPickup: (pickupId, rejectionReason) =>
    apiClient.patch(`/pickups/${pickupId}/reject`, { rejectionReason }),

  // ── Proof Verification (NEW endpoints — audit justified) ─────────────────
  getProofsForVerification: (params) =>
    apiClient.get("/supervisor/proofs", { params }),
  verifyPickup: (pickupId) =>
    apiClient.patch(`/supervisor/pickups/${pickupId}/verify`),
  rejectVerification: (pickupId, rejectionReason) =>
    apiClient.patch(`/supervisor/pickups/${pickupId}/reject-verification`, {
      rejectionReason,
    }),

  // ── Analytics ────────────────────────────────────────────────────────────
  // /api/supervisor/analytics — full breakdown (new)
  getAnalytics: () => apiClient.get("/supervisor/analytics"),
  // /api/analytics/supervisor — ecoPoints scalar (pre-existing)
  getAnalyticsOverview: () => apiClient.get("/analytics/supervisor"),

  // ── Delivery Agent Management ─────────────────────────────────────────────
  createDeliveryAgent: (payload) =>
    apiClient.post("/supervisor/delivery-agents", payload),
  updateDeliveryAgent: (id, payload) =>
    apiClient.patch(`/supervisor/delivery-agents/${id}`, payload),
  updateDeliveryAgentStatus: (id, payload) =>
    apiClient.patch(`/supervisor/delivery-agents/${id}/status`, payload),
};
