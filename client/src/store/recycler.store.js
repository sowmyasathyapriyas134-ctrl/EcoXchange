import { create } from "zustand";

/**
 * useRecyclerStore
 * ────────────────
 * Zustand owns ONLY ephemeral UI state — never server state.
 */
export const useRecyclerStore = create((set) => ({
  selectedBatch: null,
  setSelectedBatch: (batch) => set({ selectedBatch: batch }),
  clearSelectedBatch: () => set({ selectedBatch: null }),

  selectedShipment: null,
  setSelectedShipment: (shipment) => set({ selectedShipment: shipment }),
  clearSelectedShipment: () => set({ selectedShipment: null }),

  selectedInventory: null,
  setSelectedInventory: (inventory) => set({ selectedInventory: inventory }),
  clearSelectedInventory: () => set({ selectedInventory: null }),

  drawerOpen: null, // 'create_listing' | 'process_batch' | 'create_shipment' | null
  openDrawer: (type) => set({ drawerOpen: type }),
  closeDrawer: () => set({ drawerOpen: null }),

  modalOpen: null, // 'schedule_modal' | 'confirm_receipt' | null
  openModal: (type) => set({ modalOpen: type }),
  closeModal: () => set({ modalOpen: null }),

  filters: {
    status: "",
    material: "",
    search: "",
  },
  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),
  resetFilters: () =>
    set({
      filters: {
        status: "",
        material: "",
        search: "",
      },
    }),
}));
