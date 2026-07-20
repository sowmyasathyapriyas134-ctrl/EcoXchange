import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deliveryApi } from "@/api/delivery.api";
import toast from "react-hot-toast";

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useDeliveryTasks(params) {
  return useQuery({
    queryKey: ["delivery", "tasks", params],
    queryFn: async () => {
      const { data } = await deliveryApi.getTasks(params);
      return data;
    },
  });
}

export function useDeliveryTask(id) {
  return useQuery({
    queryKey: ["delivery", "task", id],
    queryFn: async () => {
      const { data } = await deliveryApi.getTask(id);
      return data;
    },
    enabled: Boolean(id),
    refetchInterval: 10000, // poll every 10s for live status
  });
}

export function useDeliveryProofs(params) {
  return useQuery({
    queryKey: ["delivery", "proofs", params],
    queryFn: async () => {
      const { data } = await deliveryApi.getProofs(params);
      return data;
    },
  });
}

export function useDeliveryAnalytics() {
  return useQuery({
    queryKey: ["delivery", "analytics"],
    queryFn: async () => {
      const { data } = await deliveryApi.getAnalytics();
      return data;
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useAcceptTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deliveryApi.acceptTask(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["delivery", "tasks"] });
      qc.invalidateQueries({ queryKey: ["delivery", "task", id] });
      qc.invalidateQueries({ queryKey: ["delivery", "analytics"] });
      toast.success("✅ Task accepted! Navigate to the member location.");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to accept task"),
  });
}

export function useRejectTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => deliveryApi.rejectTask(id, { reason }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["delivery", "tasks"] });
      qc.invalidateQueries({ queryKey: ["delivery", "task", id] });
      qc.invalidateQueries({ queryKey: ["delivery", "analytics"] });
      toast.success("Task rejected.");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to reject task"),
  });
}

export function useStartTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deliveryApi.startTask(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["delivery", "tasks"] });
      qc.invalidateQueries({ queryKey: ["delivery", "task", id] });
      toast.success("🚗 Task started! GPS tracking active.");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to start task"),
  });
}

export function usePauseTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => deliveryApi.pauseTask(id, { reason }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["delivery", "tasks"] });
      qc.invalidateQueries({ queryKey: ["delivery", "task", id] });
      toast.success("Task paused.");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to pause task"),
  });
}

export function useResumeTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deliveryApi.resumeTask(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["delivery", "tasks"] });
      qc.invalidateQueries({ queryKey: ["delivery", "task", id] });
      toast.success("Task resumed.");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to resume task"),
  });
}

export function useCompleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actualWeight, completionNotes }) =>
      deliveryApi.completeTask(id, { actualWeight, completionNotes }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["delivery", "tasks"] });
      qc.invalidateQueries({ queryKey: ["delivery", "task", id] });
      qc.invalidateQueries({ queryKey: ["delivery", "analytics"] });
      toast.success("🎉 Pickup completed! Submitted for supervisor verification.");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to complete task"),
  });
}

export function useScanQr() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => deliveryApi.scanQr(payload),
    onSuccess: (_, payload) => {
      qc.invalidateQueries({ queryKey: ["delivery", "task", payload.taskId] });
      qc.invalidateQueries({ queryKey: ["delivery", "tasks"] });
      toast.success("✅ Customer QR verified!");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "QR validation failed"),
  });
}

export function useUploadProof() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData) => deliveryApi.uploadProof(formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["delivery", "proofs"] });
      toast.success("📷 Proof photo uploaded successfully.");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Photo upload failed"),
  });
}

export function useDeleteProof() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deliveryApi.deleteProof(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["delivery", "proofs"] });
      toast.success("Proof deleted.");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to delete proof"),
  });
}

export function useSendLocation() {
  return useMutation({
    mutationFn: (coords) => deliveryApi.sendLocation(coords),
    // Silent — no toast for background GPS updates
  });
}
