import { Routes, Route } from "react-router-dom";
import MemberDashboardPage from "@/pages/member/MemberDashboardPage";
import ProfilePage from "@/pages/member/ProfilePage";
import WalletPage from "@/pages/member/WalletPage";
import EcoPointsPage from "@/pages/member/EcoPointsPage";
import MarketplacePage from "@/pages/member/MarketplacePage";
import ProductDetailPage from "@/pages/member/ProductDetailPage";
import CartPage from "@/pages/member/CartPage";
import OrdersPage from "@/pages/member/OrdersPage";
import OrderDetailPage from "@/pages/member/OrderDetailPage";
import PickupsPage from "@/pages/member/PickupsPage";
import NewPickupPage from "@/pages/member/NewPickupPage";
import PickupDetailPage from "@/pages/member/PickupDetailPage";
import TrackingPage from "@/pages/member/TrackingPage";
import RewardsPage from "@/pages/member/RewardsPage";
import ReferralsPage from "@/pages/member/ReferralsPage";
import CalendarPage from "@/pages/member/CalendarPage";
import MembershipPage from "@/pages/member/MembershipPage";
import SettingsPage from "@/pages/member/SettingsPage";
import NotificationsPage from "@/pages/member/NotificationsPage";

export default function MemberRoutes() {
  return (
    <Routes>
      <Route path="dashboard" element={<MemberDashboardPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="wallet" element={<WalletPage />} />
      <Route path="ecopoints" element={<EcoPointsPage />} />
      <Route path="marketplace" element={<MarketplacePage />} />
      <Route path="marketplace/:id" element={<ProductDetailPage />} />
      <Route path="cart" element={<CartPage />} />
      <Route path="orders" element={<OrdersPage />} />
      <Route path="orders/:id" element={<OrderDetailPage />} />
      <Route path="pickups" element={<PickupsPage />} />
      <Route path="pickups/new" element={<NewPickupPage />} />
      <Route path="pickups/:id" element={<PickupDetailPage />} />
      <Route path="tracking" element={<TrackingPage />} />
      <Route path="tracking/:id" element={<TrackingPage />} />
      <Route path="rewards" element={<RewardsPage />} />
      <Route path="referrals" element={<ReferralsPage />} />
      <Route path="calendar" element={<CalendarPage />} />
      <Route path="membership" element={<MembershipPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
    </Routes>
  );
}
