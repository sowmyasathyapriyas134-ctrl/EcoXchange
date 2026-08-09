import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Flame, Package, ShoppingBag, Sparkles, Truck, QrCode, Box, ShieldCheck, Tag } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { AnalyticsCard } from "@/components/common/AnalyticsCard";
import { ApiError } from "@/components/errors/ApiError";
import { DashboardSkeleton } from "@/components/loading/DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMemberAnalytics, useMemberDashboard } from "@/hooks/queries/useMember";
import { useAuthStore } from "@/store/auth.store";
import { membershipApi } from "@/api/membership.api";

export default function MemberDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const dash = useMemberDashboard();
  const analytics = useMemberAnalytics();

  const [membershipData, setMembershipData] = useState(null);

  useEffect(() => {
    membershipApi.getStatus().then((res) => {
      if (res.data?.success) {
        setMembershipData(res.data.data);
      }
    }).catch(() => {});
  }, []);

  if (dash.isLoading) return <DashboardSkeleton />;
  if (dash.isError) return <ApiError onRetry={dash.refetch} loading={dash.isFetching} />;

  const stats = dash.data?.data ?? {};
  const overview = analytics.data?.data ?? {};
  const toolkit = membershipData?.toolkit;
  const qrCode = membershipData?.qrCode;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.fullName || user?.name || "Member"}`}
        description="Your permanent sustainability hub & identity"
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/member/pickups/new">Schedule pickup</Link>
            </Button>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <Link to="/member/marketplace">Shop marketplace</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Eco points" value={String(stats.ecoPoints ?? user?.ecoPoints ?? 0)} icon={Sparkles} />
        <StatCard label="Streak" value={String(stats.streak ?? user?.streak ?? 0)} icon={Flame} />
        <StatCard label="Submissions" value={String(stats.totalSubmissions ?? overview.totalPickups ?? 0)} icon={Package} />
        <StatCard label="Orders" value={String(stats.totalOrders ?? 0)} icon={ShoppingBag} />
      </div>

      {/* Permanent Membership Card & QR Identity Banner */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Digital Identity & Member QR Code Card */}
        <Card className="md:col-span-1 border-emerald-200 shadow-md bg-gradient-to-b from-white to-emerald-50/30 dark:from-slate-900 dark:to-slate-900">
          <CardHeader className="pb-3 text-center">
            <Badge className="w-fit mx-auto bg-emerald-600 hover:bg-emerald-700 text-white mb-1">
              <ShieldCheck className="h-3 w-3 mr-1" /> Permanent Member Identity
            </Badge>
            <CardTitle className="text-base font-bold">My EcoXchange Member QR</CardTitle>
            <CardDescription className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
              Present this QR to the Delivery Agent during every pickup.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pb-6 space-y-3 text-center">
            {qrCode?.qrImage ? (
              <div className="p-3 bg-white rounded-xl shadow-inner border border-slate-200 text-center">
                <img src={qrCode.qrImage} alt="User QR Identity" className="w-40 h-40 object-contain mx-auto" />
                <p className="text-xs font-mono font-bold text-slate-800 mt-2">{qrCode.qrCodeId}</p>
              </div>
            ) : (
              <div className="w-40 h-40 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <QrCode className="h-12 w-12 opacity-40" />
              </div>
            )}
            <div className="w-full text-xs space-y-1 pt-2 border-t text-muted-foreground">
              <p className="flex justify-between"><span>Member:</span> <strong className="text-foreground">{user?.fullName || user?.name || "Member"}</strong></p>
              <p className="flex justify-between"><span>Status:</span> <strong className="text-emerald-600 capitalize">{user?.membershipStatus || "member"}</strong></p>
              <p className="flex justify-between"><span>Bin Size:</span> <strong className="text-foreground capitalize">{membershipData?.binSize || user?.binSize || "Medium"}</strong></p>
            </div>
          </CardContent>
        </Card>

        {/* Membership Details & Allocated Toolkit Card */}
        <Card className="md:col-span-2 border-emerald-100 shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" /> Membership & Toolkit Status
                </CardTitle>
                <CardDescription>Verified subscription & hardware allocation details</CardDescription>
              </div>
              <Badge variant="outline" className="border-emerald-500 text-emerald-700 dark:text-emerald-300 capitalize font-bold">
                Status: {membershipData?.membershipStatus || user?.membershipStatus || "member"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-xs text-muted-foreground block">Plan</span>
                <span className="font-bold capitalize">{membershipData?.membershipPlan || user?.membershipPlan || "Permanent"}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-xs text-muted-foreground block">Dustbin Size</span>
                <span className="font-bold capitalize">{membershipData?.binSize || user?.binSize || "Medium"}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-xs text-muted-foreground block">Toolkit Status</span>
                <span className="font-bold text-emerald-600 capitalize">{toolkit?.deliveryStatus || "Assigned"}</span>
              </div>
            </div>

            {/* Toolkit items */}
            <div className="space-y-2 pt-2 border-t">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Allocated Hardware Package</h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-2 p-2 rounded-md bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300">
                  <Box className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>3 Dustbins ({toolkit?.dustbins?.size || membershipData?.binSize || "medium"})</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-md bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300">
                  <Tag className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>100 Bin Covers</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-md bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300">
                  <QrCode className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>100 QR Stickers</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {!analytics.isError && (
        <div className="grid gap-4 md:grid-cols-2">
          <AnalyticsCard title="Impact" description="Your recycling contribution">
            <ul className="text-sm space-y-2">
              <li>Recycled: {overview.totalRecycledKg ?? 0} kg</li>
              <li>Carbon saved: {overview.carbonSavedKg ?? 0} kg CO₂</li>
              <li>Trees saved: {overview.treesSaved ?? 0}</li>
            </ul>
          </AnalyticsCard>
          <AnalyticsCard title="Quick actions" description="Manage your permanent member portal">
            <div className="flex flex-wrap gap-2 pt-2">
              <Button asChild variant="secondary" size="sm"><Link to="/member/wallet">Wallet</Link></Button>
              <Button asChild variant="secondary" size="sm"><Link to="/member/tracking">Track pickups</Link></Button>
              <Button asChild variant="secondary" size="sm"><Link to="/member/rewards">Rewards</Link></Button>
              <Button asChild variant="secondary" size="sm"><Link to="/member/calendar"><Truck className="h-3 w-3 mr-1 inline" />Calendar</Link></Button>
            </div>
          </AnalyticsCard>
        </div>
      )}
    </div>
  );
}
