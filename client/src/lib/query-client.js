import { QueryClient } from "@tanstack/react-query";
import { parseApiError } from "@/api/axios";
import toast from "react-hot-toast";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60_000,
    },
    mutations: {
      retry: 0,
      onError: (error) => {
        toast.error(parseApiError(error));
      },
    },
  },
});

export const queryKeys = {
  auth: {
    me: ["auth", "me"],
  },
  dashboard: {
    citizen: ["dashboard", "citizen"],
    supervisor: ["dashboard", "supervisor"],
    recycler: ["dashboard", "recycler"],
    admin: ["dashboard", "admin"],
    delivery: ["dashboard", "delivery"],
  },
  notifications: {
    all: ["notifications"],
    unreadCount: ["notifications", "unread-count"],
  },
  marketplace: {
    products: ["marketplace", "products"],
    product: (id) => ["marketplace", "product", id],
  },
  wallet: {
    me: ["wallet", "me"],
    transactions: ["wallet", "transactions"],
  },
  profile: {
    me: ["profile", "me"],
  },
  member: {
    analytics: ["member", "analytics"],
  },
  rewards: {
    list: ["rewards", "list"],
    points: ["rewards", "points"],
    redemptions: ["rewards", "redemptions"],
    leaderboard: ["rewards", "leaderboard"],
  },
  cart: {
    current: ["cart"],
  },
  orders: {
    list: ["orders", "list"],
    detail: (id) => ["orders", id],
  },
  pickups: {
    list: ["pickups", "list"],
    detail: (id) => ["pickups", id],
    qr: (id) => ["pickups", id, "qr"],
  },
  membership: {
    plans: ["membership", "plans"],
    mine: ["membership", "mine"],
  },
  schedules: {
    available: ["schedules", "available"],
  },
  ai: {
    history: ["ai", "history"],
  },
  admin: {
    users: ["admin", "users"],
    user: (id) => ["admin", "users", id],
    analyticsOverview: ["admin", "analytics", "overview"],
    wasteByType: ["admin", "analytics", "waste-by-type"],
    monthlyTrends: ["admin", "analytics", "monthly-trends"],
    revenueSummary: ["admin", "revenue", "summary"],
    revenueHistory: ["admin", "revenue", "history"],
    revenueAnalytics: ["admin", "revenue", "analytics"],
    marketplaceProducts: ["admin", "marketplace", "products"],
    marketplaceOrders: ["admin", "marketplace", "orders"],
    marketplaceAnalytics: ["admin", "marketplace", "analytics"],
    pickups: ["admin", "pickups"],
    rewards: ["admin", "rewards"],
    rewardsLeaderboard: ["admin", "rewards", "leaderboard"],
    notifications: ["admin", "notifications"],
    walletLedger: ["admin", "wallet", "ledger"],
  },
};

export function invalidateNotifications(qc) {
  return qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
}

export function invalidateDashboard(qc, role) {
  const key = queryKeys.dashboard[role];
  if (key) qc.invalidateQueries({ queryKey: key });
}
