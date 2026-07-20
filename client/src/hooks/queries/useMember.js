import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  analyticsApi,
  cartApi,
  membershipApi,
  ordersApi,
  paymentsApi,
  pickupsApi,
  profileApi,
  rewardsApi,
  schedulesApi,
  walletApi,
  marketplaceApi,
} from "@/api/member.api";
import { dashboardApi } from "@/api/dashboard.api";
import { queryKeys } from "@/lib/query-client";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { useAuthStore } from "@/store/auth.store";
import toast from "react-hot-toast";

export function useMemberDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard.citizen,
    queryFn: async () => {
      const { data } = await dashboardApi.getCitizen();
      return data;
    },
  });
}

export function useMemberAnalytics() {
  return useQuery({
    queryKey: queryKeys.member.analytics,
    queryFn: async () => {
      const { data } = await analyticsApi.memberOverview();
      return data;
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile.me,
    queryFn: async () => {
      const { data } = await profileApi.getProfile();
      return data;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => profileApi.updateProfile(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.profile.me });
      qc.invalidateQueries({ queryKey: queryKeys.auth.me });
      toast.success("Profile updated");
    },
  });
}

export function useWallet() {
  return useQuery({
    queryKey: queryKeys.wallet.me,
    queryFn: async () => {
      const { data } = await walletApi.getWallet();
      return data;
    },
  });
}

export function useWalletTransactions() {
  return useQuery({
    queryKey: queryKeys.wallet.transactions,
    queryFn: async () => {
      const { data } = await walletApi.getTransactions();
      return data;
    },
  });
}

export function useWithdraw() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => walletApi.withdraw(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.wallet.me });
      qc.invalidateQueries({ queryKey: queryKeys.wallet.transactions });
      toast.success("Withdrawal requested");
    },
  });
}

export function useEcoPoints() {
  return useQuery({
    queryKey: queryKeys.rewards.points,
    queryFn: async () => {
      const { data } = await rewardsApi.myPoints();
      return data;
    },
  });
}

export function useRewards() {
  return useQuery({
    queryKey: queryKeys.rewards.list,
    queryFn: async () => {
      const { data } = await rewardsApi.list();
      return data;
    },
  });
}

export function useRedemptions() {
  return useQuery({
    queryKey: queryKeys.rewards.redemptions,
    queryFn: async () => {
      const { data } = await rewardsApi.myRedemptions();
      return data;
    },
  });
}

export function useRedeemReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rewardId) => rewardsApi.redeem(rewardId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.rewards.points });
      qc.invalidateQueries({ queryKey: queryKeys.rewards.redemptions });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.citizen });
      toast.success("Reward redeemed");
    },
  });
}

export function useProducts() {
  return useQuery({
    queryKey: queryKeys.marketplace.products,
    queryFn: async () => {
      const { data } = await marketplaceApi.getProducts();
      return data;
    },
  });
}

export function useProduct(id) {
  return useQuery({
    queryKey: queryKeys.marketplace.product(id),
    queryFn: async () => {
      const { data } = await marketplaceApi.getProduct(id);
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useCart() {
  return useQuery({
    queryKey: queryKeys.cart.current,
    queryFn: async () => {
      const { data } = await cartApi.get();
      return data;
    },
  });
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, quantity }) => cartApi.add(productId, quantity),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cart.current });
      toast.success("Added to cart");
    },
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quantity }) => cartApi.updateItem(id, quantity),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cart.current }),
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => cartApi.removeItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.cart.current });
      toast.success("Removed from cart");
    },
  });
}

export function useOrders() {
  return useQuery({
    queryKey: queryKeys.orders.list,
    queryFn: async () => {
      const { data } = await ordersApi.myOrders();
      return data;
    },
  });
}

export function useOrder(id) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: async () => {
      const { data } = await ordersApi.getOrder(id);
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useCheckout() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({ fromCart = true, items, shippingAddress }) => {
      const { data } = await ordersApi.checkout({ fromCart, items, shippingAddress });
      return data;
    },
    onSuccess: async (res) => {
      const payload = res?.data ?? res;
      const order = payload?.order ?? payload;
      const razorpayOrderId = payload?.razorpayOrderId ?? order?.razorpayOrderId;
      const amount = payload?.amount ?? Math.round((order?.total ?? 0) * 100);

      if (!razorpayOrderId) {
        toast.error("Checkout created but payment order missing");
        return;
      }

      await openRazorpayCheckout({
        orderId: razorpayOrderId,
        amount,
        description: "Marketplace order",
        user,
        onSuccess: async (payment) => {
          await paymentsApi.verify({
            razorpay_order_id: payment.razorpay_order_id,
            razorpay_payment_id: payment.razorpay_payment_id,
            razorpay_signature: payment.razorpay_signature,
          });
          qc.invalidateQueries({ queryKey: queryKeys.cart.current });
          qc.invalidateQueries({ queryKey: queryKeys.orders.list });
          toast.success("Payment successful");
        },
        onFailure: (err) => toast.error(err.message),
      });
    },
  });
}

export function usePickups() {
  return useQuery({
    queryKey: queryKeys.pickups.list,
    queryFn: async () => {
      const { data } = await pickupsApi.myPickups();
      return data;
    },
  });
}

export function usePickup(id) {
  return useQuery({
    queryKey: queryKeys.pickups.detail(id),
    queryFn: async () => {
      const { data } = await pickupsApi.getPickup(id);
      return data;
    },
    enabled: Boolean(id),
  });
}

export function usePickupQr(id) {
  return useQuery({
    queryKey: queryKeys.pickups.qr(id),
    queryFn: async () => {
      const { data } = await pickupsApi.qrToken(id);
      return data;
    },
    enabled: Boolean(id),
    retry: false,
  });
}

export function useCreatePickup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData) => pickupsApi.create(formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.pickups.list });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.citizen });
      toast.success("Pickup request submitted");
    },
  });
}

export function useCancelPickup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => pickupsApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.pickups.list });
      toast.success("Pickup cancelled");
    },
  });
}

export function useMembershipPlans() {
  return useQuery({
    queryKey: queryKeys.membership.plans,
    queryFn: async () => {
      const { data } = await membershipApi.plans();
      return data;
    },
  });
}

export function useMyMembership() {
  return useQuery({
    queryKey: queryKeys.membership.mine,
    queryFn: async () => {
      const { data } = await membershipApi.myMembership();
      return data;
    },
  });
}

export function useSubscribeMembership() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (planId) => membershipApi.createOrder(planId),
    onSuccess: async (res) => {
      const payload = res?.data?.data ?? res?.data ?? res;
      const razorpayOrderId = payload?.id ?? payload?.razorpayOrderId;
      const amount = payload?.amount;

      if (!razorpayOrderId) {
        toast.error("Could not create membership order");
        return;
      }

      await openRazorpayCheckout({
        orderId: razorpayOrderId,
        amount,
        description: "EcoXchange membership",
        user,
        onSuccess: async (payment) => {
          await membershipApi.verifyPayment({
            razorpayOrderId: payment.razorpay_order_id,
            razorpayPaymentId: payment.razorpay_payment_id,
            razorpaySignature: payment.razorpay_signature,
          });
          qc.invalidateQueries({ queryKey: queryKeys.membership.mine });
          qc.invalidateQueries({ queryKey: queryKeys.auth.me });
          toast.success("Membership activated");
        },
        onFailure: (err) => toast.error(err.message),
      });
    },
  });
}

export function useAvailableSchedules() {
  return useQuery({
    queryKey: queryKeys.schedules.available,
    queryFn: async () => {
      const { data } = await schedulesApi.available();
      return data;
    },
  });
}
