import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth.store";
import { connectSocket, disconnectSocket, getSocket, subscribeSocketStatus } from "@/lib/socket";
import { invalidateNotifications, queryKeys } from "@/lib/query-client";
import { SocketContext } from "@/hooks/useSocket";

function SocketContextBridge({ status, children }) {
  return (
    <SocketContext.Provider value={{ socket: getSocket(), status }}>
      {children}
    </SocketContext.Provider>
  );
}

export function SocketProvider({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);
  const [status, setStatus] = useState("disconnected");
  const qc = useQueryClient();

  useEffect(() => subscribeSocketStatus(setStatus), []);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket();
    if (!socket) return;

    const onNotification = (payload) => {
      invalidateNotifications(qc);
      if (payload?.message) toast(payload.message);
    };

    const onPickupUpdate = () => {
      qc.invalidateQueries({ queryKey: ["pickups"] });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.citizen });
    };

    const onOrderUpdate = () => qc.invalidateQueries({ queryKey: ["orders"] });

    const onPaymentUpdate = () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
    };

    const onShipmentUpdate = () => {
      qc.invalidateQueries({ queryKey: ["shipments"] });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.recycler });
    };

    // Recycler Specific Listeners
    const onRecyclerIncomingUpdate = () => {
      qc.invalidateQueries({ queryKey: ["recycler", "incoming"] });
      qc.invalidateQueries({ queryKey: ["recycler", "dashboard"] });
    };

    const onRecyclerProcessingUpdate = () => {
      qc.invalidateQueries({ queryKey: ["recycler", "processed"] });
      qc.invalidateQueries({ queryKey: ["recycler", "dashboard"] });
    };

    const onRecyclerShipmentUpdate = () => {
      qc.invalidateQueries({ queryKey: ["recycler", "shipments"] });
      qc.invalidateQueries({ queryKey: ["recycler", "dashboard"] });
    };

    const onRecyclerInventoryUpdate = () => {
      qc.invalidateQueries({ queryKey: ["recycler", "myProducts"] });
      qc.invalidateQueries({ queryKey: ["recycler", "dashboard"] });
    };

    const onRecyclerMarketplaceUpdate = () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["recycler", "salesReport"] });
      qc.invalidateQueries({ queryKey: ["recycler", "dashboard"] });
    };

    const onRecyclerNotificationUpdate = () => {
      invalidateNotifications(qc);
    };

    // Admin Listeners
    const onAdminUserUpdate = () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.users });
    };
    const onAdminPickupUpdate = () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.pickups });
    };
    const onAdminOrderUpdate = () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.marketplaceOrders });
    };
    const onAdminPaymentUpdate = () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.revenueSummary });
      qc.invalidateQueries({ queryKey: queryKeys.admin.revenueHistory });
      qc.invalidateQueries({ queryKey: queryKeys.admin.revenueAnalytics });
    };
    const onAdminWalletUpdate = () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.walletLedger });
    };
    const onAdminRewardUpdate = () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.rewards });
      qc.invalidateQueries({ queryKey: queryKeys.admin.rewardsLeaderboard });
    };
    const onAdminAnalyticsUpdate = () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.analyticsOverview });
      qc.invalidateQueries({ queryKey: queryKeys.admin.wasteByType });
      qc.invalidateQueries({ queryKey: queryKeys.admin.monthlyTrends });
    };
    const onAdminNotificationUpdate = () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.notifications });
    };

    socket.on("notification", onNotification);
    socket.on("pickup_update", onPickupUpdate);
    socket.on("order_update", onOrderUpdate);
    socket.on("payment_update", onPaymentUpdate);
    socket.on("shipment_update", onShipmentUpdate);
    
    // Recycler Listeners registration
    socket.on("incoming:update", onRecyclerIncomingUpdate);
    socket.on("processing:update", onRecyclerProcessingUpdate);
    socket.on("shipment:update", onRecyclerShipmentUpdate);
    socket.on("inventory:update", onRecyclerInventoryUpdate);
    socket.on("marketplace:update", onRecyclerMarketplaceUpdate);
    socket.on("notification:update", onRecyclerNotificationUpdate);

    // Admin Listeners registration
    socket.on("user:update", onAdminUserUpdate);
    socket.on("pickup:update", onAdminPickupUpdate);
    socket.on("order:update", onAdminOrderUpdate);
    socket.on("payment:update", onAdminPaymentUpdate);
    socket.on("wallet:update", onAdminWalletUpdate);
    socket.on("reward:update", onAdminRewardUpdate);
    socket.on("analytics:update", onAdminAnalyticsUpdate);
    socket.on("notification:update", onAdminNotificationUpdate);

    return () => {
      socket.off("notification", onNotification);
      socket.off("pickup_update", onPickupUpdate);
      socket.off("order_update", onOrderUpdate);
      socket.off("payment_update", onPaymentUpdate);
      socket.off("shipment_update", onShipmentUpdate);

      // Recycler Listeners cleanup
      socket.off("incoming:update", onRecyclerIncomingUpdate);
      socket.off("processing:update", onRecyclerProcessingUpdate);
      socket.off("shipment:update", onRecyclerShipmentUpdate);
      socket.off("inventory:update", onRecyclerInventoryUpdate);
      socket.off("marketplace:update", onRecyclerMarketplaceUpdate);
      socket.off("notification:update", onRecyclerNotificationUpdate);

      // Admin Listeners cleanup
      socket.off("user:update", onAdminUserUpdate);
      socket.off("pickup:update", onAdminPickupUpdate);
      socket.off("order:update", onAdminOrderUpdate);
      socket.off("payment:update", onAdminPaymentUpdate);
      socket.off("wallet:update", onAdminWalletUpdate);
      socket.off("reward:update", onAdminRewardUpdate);
      socket.off("analytics:update", onAdminAnalyticsUpdate);
      socket.off("notification:update", onAdminNotificationUpdate);
    };
  }, [isAuthenticated, token, qc]);

  return <SocketContextBridge status={status}>{children}</SocketContextBridge>;
}
