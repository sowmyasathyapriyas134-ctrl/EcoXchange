import { create } from "zustand";

/**
 * Admin UI Store — stores ONLY client-side UI state.
 * Server state lives in React Query; never duplicate it here.
 */
export const useAdminStore = create((set) => ({
  // User management
  selectedUserId: null,
  setSelectedUserId: (id) => set({ selectedUserId: id }),

  // Drawers / modals
  userDetailOpen: false,
  setUserDetailOpen: (open) => set({ userDetailOpen: open }),

  createUserOpen: false,
  setCreateUserOpen: (open) => set({ createUserOpen: open }),

  rewardFormOpen: false,
  setRewardFormOpen: (open) => set({ rewardFormOpen: open }),

  selectedRewardId: null,
  setSelectedRewardId: (id) => set({ selectedRewardId: id }),

  confirmDeleteOpen: false,
  setConfirmDeleteOpen: (open) => set({ confirmDeleteOpen: open }),

  // Search
  userSearch: "",
  setUserSearch: (q) => set({ userSearch: q }),

  pickupSearch: "",
  setPickupSearch: (q) => set({ pickupSearch: q }),

  orderSearch: "",
  setOrderSearch: (q) => set({ orderSearch: q }),

  productSearch: "",
  setProductSearch: (q) => set({ productSearch: q }),

  // Filters
  userRoleFilter: "all",
  setUserRoleFilter: (role) => set({ userRoleFilter: role }),

  pickupStatusFilter: "all",
  setPickupStatusFilter: (status) => set({ pickupStatusFilter: status }),

  productStatusFilter: "all",
  setProductStatusFilter: (status) => set({ productStatusFilter: status }),

  // Pagination
  usersPage: 1,
  setUsersPage: (page) => set({ usersPage: page }),

  pickupsPage: 1,
  setPickupsPage: (page) => set({ pickupsPage: page }),

  ordersPage: 1,
  setOrdersPage: (page) => set({ ordersPage: page }),

  productsPage: 1,
  setProductsPage: (page) => set({ productsPage: page }),

  ledgerPage: 1,
  setLedgerPage: (page) => set({ ledgerPage: page }),

  notificationsPage: 1,
  setNotificationsPage: (page) => set({ notificationsPage: page }),

  // Reset all pagination (call when filters change)
  resetPagination: () =>
    set({
      usersPage: 1,
      pickupsPage: 1,
      ordersPage: 1,
      productsPage: 1,
      ledgerPage: 1,
      notificationsPage: 1,
    }),
}));
