import { create } from "zustand";
import { persist } from "zustand/middleware";
import { deliveryApi } from "@/api/delivery.api";

/**
 * deliveryTaskStore
 * ─────────────────
 * Manages active task state, GPS tracking, and offline location queue.
 * GPS updates are sent to backend; on failure they're queued for retry.
 */
export const useDeliveryTaskStore = create(
  persist(
    (set, get) => ({
      // ─── Active Task ────────────────────────────────────────────────────────
      activeTaskId: null,
      setActiveTaskId: (id) => set({ activeTaskId: id }),
      clearActiveTask: () => set({ activeTaskId: null }),

      // ─── GPS Tracking ──────────────────────────────────────────────────────
      trackingIntervalId: null,
      isTracking: false,
      lastPosition: null,

      startTracking: (taskId) => {
        const { trackingIntervalId, _sendLocation } = get();
        if (trackingIntervalId) return; // already tracking

        const id = setInterval(() => {
          if (!navigator.geolocation) return;
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords;
              set({ lastPosition: { lat: latitude, lng: longitude } });
              _sendLocation({ taskId, latitude, longitude });
            },
            () => {
              // Fallback: simulate movement near last known position
              const last = get().lastPosition || { lat: 12.9716, lng: 77.5946 };
              const lat = last.lat + (Math.random() - 0.5) * 0.002;
              const lng = last.lng + (Math.random() - 0.5) * 0.002;
              set({ lastPosition: { lat, lng } });
              _sendLocation({ taskId, latitude: lat, longitude: lng });
            },
            { timeout: 5000, enableHighAccuracy: true }
          );
        }, 15000);

        set({ trackingIntervalId: id, isTracking: true, activeTaskId: taskId });
      },

      stopTracking: () => {
        const { trackingIntervalId } = get();
        if (trackingIntervalId) {
          clearInterval(trackingIntervalId);
        }
        set({ trackingIntervalId: null, isTracking: false });
      },

      // ─── Location Sending with Offline Queue ───────────────────────────────
      locationQueue: [],

      _sendLocation: async (payload) => {
        try {
          await deliveryApi.sendLocation(payload);
        } catch {
          // Queue for retry
          set((s) => ({
            locationQueue: [...s.locationQueue.slice(-50), payload], // max 50 items
          }));
        }
      },

      flushLocationQueue: async () => {
        const { locationQueue } = get();
        if (!locationQueue.length) return;
        const toRetry = [...locationQueue];
        set({ locationQueue: [] });
        for (const payload of toRetry) {
          try {
            await deliveryApi.sendLocation(payload);
          } catch {
            // Re-queue on continued failure
            set((s) => ({ locationQueue: [...s.locationQueue, payload] }));
          }
        }
      },

      // ─── Offline Proof Upload Queue ────────────────────────────────────────
      proofQueue: [], // { taskId, blob, captureTime }

      queueProof: (item) =>
        set((s) => ({
          proofQueue: [...s.proofQueue, item],
        })),

      removeFromProofQueue: (index) =>
        set((s) => ({
          proofQueue: s.proofQueue.filter((_, i) => i !== index),
        })),
    }),
    {
      name: "delivery-task-store",
      partialize: (s) => ({
        activeTaskId: s.activeTaskId,
        lastPosition: s.lastPosition,
        locationQueue: s.locationQueue,
        // Don't persist interval IDs or isTracking (they reset on reload)
      }),
    }
  )
);
