import { create } from "zustand";

/**
 * useSupervisorStore
 * ──────────────────
 * Zustand owns ONLY ephemeral UI state — never server state.
 * Server state (agents, pickups, verifications, analytics) lives in React Query.
 *
 * Fields:
 *  selectedAgent      — agent clicked on Agents or Map page
 *  selectedPickup     — pickup opened in assignment / verification drawer
 *  filters            — filter panel state (status, area, agentId)
 *  mapState           — map center + zoom
 *  drawerOpen         — which drawer is open ("assignment" | "verification" | null)
 *  rejectModalOpen    — reject-with-reason modal
 *  rejectTarget       — pickupId being rejected
 */
export const useSupervisorStore = create((set) => ({
  // ── Selected Items ────────────────────────────────────────────────────────
  selectedAgent: null,
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),
  clearSelectedAgent: () => set({ selectedAgent: null }),

  selectedPickup: null,
  setSelectedPickup: (pickup) => set({ selectedPickup: pickup }),
  clearSelectedPickup: () => set({ selectedPickup: null }),

  // ── Filters ───────────────────────────────────────────────────────────────
  filters: {
    status: "",
    agentId: "",
    verificationStatus: "",
    area: "",
    search: "",
  },
  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),
  resetFilters: () =>
    set({
      filters: {
        status: "",
        agentId: "",
        verificationStatus: "",
        area: "",
        search: "",
      },
    }),

  // ── Map State ─────────────────────────────────────────────────────────────
  mapState: { center: { lat: 12.9716, lng: 77.5946 }, zoom: 12 },
  setMapState: (mapState) => set({ mapState }),

  // ── Drawer ────────────────────────────────────────────────────────────────
  drawerOpen: null, // "assignment" | "verification" | null
  openDrawer: (type) => set({ drawerOpen: type }),
  closeDrawer: () => set({ drawerOpen: null, selectedPickup: null }),

  // ── Reject Modal ──────────────────────────────────────────────────────────
  rejectModalOpen: false,
  rejectTarget: null, // pickupId
  openRejectModal: (pickupId) => set({ rejectModalOpen: true, rejectTarget: pickupId }),
  closeRejectModal: () => set({ rejectModalOpen: false, rejectTarget: null }),
}));
