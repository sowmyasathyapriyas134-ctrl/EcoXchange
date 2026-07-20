import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recyclerApi } from "@/api/recycler.api";
import toast from "react-hot-toast";

// ─── Query Keys ─────────────────────────────────────────────────────────────
export const recyclerKeys = {
  dashboard: ["recycler", "dashboard"],
  incoming: ["recycler", "incoming"],
  processed: ["recycler", "processed"],
  payments: ["recycler", "payments"],
  schedules: ["recycler", "schedules"],
  report: ["recycler", "report"],
  myProducts: ["recycler", "myProducts"],
  salesReport: ["recycler", "salesReport"],
  shipments: ["recycler", "shipments"],
  shipment: (id) => ["recycler", "shipments", id],
  revenue: ["recycler", "revenue"],
  revenueHistory: ["recycler", "revenueHistory"],
};

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useRecyclerDashboard() {
  return useQuery({
    queryKey: recyclerKeys.dashboard,
    queryFn: async () => {
      const { data } = await recyclerApi.getDashboard();
      return data;
    },
    refetchInterval: 30000,
  });
}

export function useAvailablePickups() {
  return useQuery({
    queryKey: recyclerKeys.incoming,
    queryFn: async () => {
      const { data } = await recyclerApi.getAvailablePickups();
      return data;
    },
  });
}

export function useProcessedPickups() {
  return useQuery({
    queryKey: recyclerKeys.processed,
    queryFn: async () => {
      const { data } = await recyclerApi.getProcessedPickups();
      return data;
    },
  });
}

export function usePayments() {
  return useQuery({
    queryKey: recyclerKeys.payments,
    queryFn: async () => {
      const { data } = await recyclerApi.getPayments();
      return data;
    },
  });
}

export function useRecyclerSchedules() {
  return useQuery({
    queryKey: recyclerKeys.schedules,
    queryFn: async () => {
      const { data } = await recyclerApi.getSchedules();
      return data;
    },
  });
}

export function useRecyclerReport() {
  return useQuery({
    queryKey: recyclerKeys.report,
    queryFn: async () => {
      const { data } = await recyclerApi.getReport();
      return data;
    },
  });
}

export function useMyProducts() {
  return useQuery({
    queryKey: recyclerKeys.myProducts,
    queryFn: async () => {
      const { data } = await recyclerApi.getMyProducts();
      return data;
    },
  });
}

export function useSalesReport() {
  return useQuery({
    queryKey: recyclerKeys.salesReport,
    queryFn: async () => {
      const { data } = await recyclerApi.getSalesReport();
      return data;
    },
  });
}

export function useShipments() {
  return useQuery({
    queryKey: recyclerKeys.shipments,
    queryFn: async () => {
      const { data } = await recyclerApi.getShipments();
      return data;
    },
  });
}

export function useShipment(id) {
  return useQuery({
    queryKey: recyclerKeys.shipment(id),
    queryFn: async () => {
      const { data } = await recyclerApi.getShipment(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useRevenueSummary() {
  return useQuery({
    queryKey: recyclerKeys.revenue,
    queryFn: async () => {
      const { data } = await recyclerApi.getRevenueSummary();
      return data;
    },
  });
}

export function useRevenueHistory() {
  return useQuery({
    queryKey: recyclerKeys.revenueHistory,
    queryFn: async () => {
      const { data } = await recyclerApi.getRevenueHistory();
      return data;
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useAcceptPickupForRecycling() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pickupId) => recyclerApi.acceptPickup(pickupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recyclerKeys.incoming });
      qc.invalidateQueries({ queryKey: recyclerKeys.dashboard });
      qc.invalidateQueries({ queryKey: recyclerKeys.processed });
      toast.success("Pickup accepted for recycling!");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Failed to accept pickup"),
  });
}

export function useProcessPickup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pickupId, formData }) =>
      recyclerApi.processPickup(pickupId, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recyclerKeys.processed });
      qc.invalidateQueries({ queryKey: recyclerKeys.dashboard });
      qc.invalidateQueries({ queryKey: recyclerKeys.report });
      toast.success("Pickup processed successfully!");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Failed to process pickup"),
  });
}

export function useCreateRecyclerPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pickupId) => recyclerApi.createPayment(pickupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recyclerKeys.payments });
      qc.invalidateQueries({ queryKey: recyclerKeys.dashboard });
      qc.invalidateQueries({ queryKey: recyclerKeys.processed });
      toast.success("Payment issued and member notified!");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Failed to create payment"),
  });
}

export function useCreateRecyclerSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => recyclerApi.createSchedule(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recyclerKeys.schedules });
      toast.success("Schedule created successfully!");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Failed to create schedule"),
  });
}

export function useUpdateRecyclerSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => recyclerApi.updateSchedule(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recyclerKeys.schedules });
      toast.success("Schedule updated successfully!");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Failed to update schedule"),
  });
}

export function useDeleteRecyclerSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => recyclerApi.deleteSchedule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recyclerKeys.schedules });
      toast.success("Schedule deleted!");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Failed to delete schedule"),
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData) => recyclerApi.createProduct(formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recyclerKeys.myProducts });
      qc.invalidateQueries({ queryKey: recyclerKeys.dashboard });
      toast.success("Product created! Awaiting admin approval.");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Failed to create product"),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => recyclerApi.updateProduct(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recyclerKeys.myProducts });
      toast.success("Product updated!");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Failed to update product"),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => recyclerApi.deleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recyclerKeys.myProducts });
      qc.invalidateQueries({ queryKey: recyclerKeys.dashboard });
      toast.success("Product deleted!");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Failed to delete product"),
  });
}

export function useCreateShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => recyclerApi.createShipment(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recyclerKeys.shipments });
      qc.invalidateQueries({ queryKey: recyclerKeys.dashboard });
      toast.success("Shipment created!");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Failed to create shipment"),
  });
}

export function useUpdateShipmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) =>
      recyclerApi.updateShipmentStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recyclerKeys.shipments });
      toast.success("Shipment status updated!");
    },
    onError: (err) =>
      toast.error(
        err?.response?.data?.message || "Failed to update shipment status"
      ),
  });
}

export function useConfirmReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => recyclerApi.confirmReceipt(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recyclerKeys.shipments });
      qc.invalidateQueries({ queryKey: recyclerKeys.dashboard });
      toast.success("Receipt confirmed!");
    },
    onError: (err) =>
      toast.error(
        err?.response?.data?.message || "Failed to confirm receipt"
      ),
  });
}
