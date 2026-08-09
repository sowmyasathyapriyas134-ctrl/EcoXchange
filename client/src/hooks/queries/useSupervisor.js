import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supervisorApi } from "@/api/supervisor.api";
import toast from "react-hot-toast";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const supervisorKeys = {
  dashboardStats: ["supervisor", "dashboardStats"],
  agents: ["supervisor", "agents"],
  agentLocations: ["supervisor", "agentLocations"],
  agentHistory: (id) => ["supervisor", "agentHistory", id],
  pickups: (params) => ["supervisor", "pickups", params],
  pendingPickups: ["supervisor", "pendingPickups"],
  proofs: (params) => ["supervisor", "proofs", params],
  analytics: ["supervisor", "analytics"],
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Rich dashboard stats — includes recentPickups[] array */
export function useSupervisorDashboardStats() {
  return useQuery({
    queryKey: supervisorKeys.dashboardStats,
    queryFn: async () => {
      const { data } = await supervisorApi.getDashboardStats();
      return data;
    },
    refetchInterval: 30000, // auto-refresh every 30s
  });
}

/** All delivery agents with task counts */
export function useSupervisorAgents() {
  return useQuery({
    queryKey: supervisorKeys.agents,
    queryFn: async () => {
      const { data } = await supervisorApi.getAgents();
      return data;
    },
    refetchInterval: 15000,
  });
}

/** Live agent GPS locations */
export function useSupervisorAgentLocations() {
  return useQuery({
    queryKey: supervisorKeys.agentLocations,
    queryFn: async () => {
      const { data } = await supervisorApi.getAgentLocations();
      return data;
    },
    refetchInterval: 10000,
  });
}

/** Location history for a specific agent */
export function useSupervisorAgentHistory(id) {
  return useQuery({
    queryKey: supervisorKeys.agentHistory(id),
    queryFn: async () => {
      const { data } = await supervisorApi.getAgentHistory(id);
      return data;
    },
    enabled: Boolean(id),
  });
}

/** All pickups with optional filters (status, agentId, verificationStatus) */
export function useSupervisorPickups(params) {
  return useQuery({
    queryKey: supervisorKeys.pickups(params),
    queryFn: async () => {
      const { data } = await supervisorApi.getPickups(params);
      return data;
    },
    keepPreviousData: true,
  });
}

/** Pending pickups only — uses existing /api/pickups/supervisor/pending */
export function usePendingPickups() {
  return useQuery({
    queryKey: supervisorKeys.pendingPickups,
    queryFn: async () => {
      const { data } = await supervisorApi.getPendingPickups();
      return data;
    },
    refetchInterval: 15000,
  });
}

/** Completed pickups with embedded proofs awaiting supervisor verification */
export function useSupervisorProofs(params) {
  return useQuery({
    queryKey: supervisorKeys.proofs(params),
    queryFn: async () => {
      const { data } = await supervisorApi.getProofsForVerification(params);
      return data;
    },
    refetchInterval: 20000,
  });
}

/** Full analytics breakdown */
export function useSupervisorAnalytics() {
  return useQuery({
    queryKey: supervisorKeys.analytics,
    queryFn: async () => {
      const { data } = await supervisorApi.getAnalytics();
      return data;
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Assign agent to a pending pickup — reuses /api/pickups/:id/assign-agent */
export function useAssignAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pickupId, agentId }) =>
      supervisorApi.assignAgent(pickupId, agentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supervisorKeys.pendingPickups });
      qc.invalidateQueries({ queryKey: ["supervisor", "pickups"] });
      qc.invalidateQueries({ queryKey: supervisorKeys.dashboardStats });
      qc.invalidateQueries({ queryKey: supervisorKeys.agents });
      toast.success("✅ Agent assigned successfully");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Failed to assign agent"),
  });
}

/** Reassign agent — same endpoint as assign (audit: PATCH /pickups/:id/assign-agent) */
export function useReassignAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pickupId, agentId }) =>
      supervisorApi.reassignAgent(pickupId, agentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supervisor", "pickups"] });
      qc.invalidateQueries({ queryKey: supervisorKeys.agents });
      toast.success("🔄 Agent reassigned successfully");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Failed to reassign agent"),
  });
}

/** Approve initial pickup request — uses /api/pickups/:id/approve */
export function useApprovePickup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pickupId) => supervisorApi.approvePickup(pickupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supervisorKeys.pendingPickups });
      qc.invalidateQueries({ queryKey: ["supervisor", "pickups"] });
      toast.success("✅ Pickup approved");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Failed to approve pickup"),
  });
}

/** Reject initial pickup — uses /api/pickups/:id/reject */
export function useRejectPickup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pickupId, rejectionReason }) =>
      supervisorApi.rejectPickup(pickupId, rejectionReason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supervisorKeys.pendingPickups });
      qc.invalidateQueries({ queryKey: ["supervisor", "pickups"] });
      toast.success("Pickup rejected");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Failed to reject pickup"),
  });
}

/** Verify a completed pickup's proof — POST-COMPLETION verification */
export function useVerifyPickup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pickupId) => supervisorApi.verifyPickup(pickupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supervisor", "proofs"] });
      qc.invalidateQueries({ queryKey: supervisorKeys.dashboardStats });
      qc.invalidateQueries({ queryKey: ["supervisor", "pickups"] });
      toast.success("✅ Pickup verified! Member notified.");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Failed to verify pickup"),
  });
}

/** Reject a completed pickup's verification with reason */
export function useRejectVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pickupId, rejectionReason }) =>
      supervisorApi.rejectVerification(pickupId, rejectionReason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supervisor", "proofs"] });
      qc.invalidateQueries({ queryKey: supervisorKeys.dashboardStats });
      qc.invalidateQueries({ queryKey: ["supervisor", "pickups"] });
      toast.success("Pickup returned to pending queue");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Failed to reject verification"),
  });
}

/** Create a new delivery agent (supervisor portal) */
export function useCreateDeliveryAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => supervisorApi.createDeliveryAgent(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supervisorKeys.agents });
      toast.success("Delivery agent created successfully");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Failed to create delivery agent"),
  });
}

/** Update delivery agent suspension status */
export function useUpdateDeliveryAgentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) =>
      supervisorApi.updateDeliveryAgentStatus(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supervisorKeys.agents });
      toast.success("Agent status updated");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Failed to update agent status"),
  });
}
