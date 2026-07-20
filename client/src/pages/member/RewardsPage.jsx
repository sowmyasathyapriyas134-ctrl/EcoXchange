import { PageHeader } from "@/components/common/PageHeader";
import { ApiError } from "@/components/errors/ApiError";
import { EmptyState } from "@/components/common/EmptyState";
import { DashboardSkeleton } from "@/components/loading/DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useEcoPoints, useRedeemReward, useRewards, useRedemptions } from "@/hooks/queries/useMember";
import { Sparkles, Award, Eye } from "lucide-react";
import { useState } from "react";

const CATEGORIES = {
  all: "All Rewards",
  voucher: "Vouchers",
  product: "Eco Products",
  coupon: "Partner Coupons",
};

export default function RewardsPage() {
  const [activeTab, setActiveTab] = useState("browse");
  const [catFilter, setCatFilter] = useState("all");
  const rewards = useRewards();
  const points = useEcoPoints();
  const redeem = useRedeemReward();
  const redemptions = useRedemptions();

  if (rewards.isLoading || points.isLoading || redemptions.isLoading) return <DashboardSkeleton />;
  if (rewards.isError) return <ApiError onRetry={rewards.refetch} loading={rewards.isFetching} />;

  const balance = points.data?.data?.ecoPoints ?? points.data?.ecoPoints ?? 0;
  const list = rewards.data?.data ?? [];
  const myRedemptionsList = redemptions.data?.data ?? [];

  const filtered = catFilter === "all"
    ? list
    : list.filter((r) => r.category === catFilter);

  // Mock Achievements for Gamification
  const achievements = [
    { title: "First Batch", desc: "Recycle your first 5kg of waste", progress: "100%", unlocked: true },
    { title: "Eco Warrior", desc: "Accumulate 500 EcoPoints", progress: `${Math.min(100, Math.round((balance / 500) * 100))}%`, unlocked: balance >= 500 },
    { title: "Waste Buster", desc: "Complete 10 pickup collections", progress: "80%", unlocked: false },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Rewards Hub" description="Redeem your hard-earned EcoPoints for sustainable goodies" />

      {/* Point Balance Header */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardContent className="flex flex-col sm:flex-row justify-between items-center py-6 gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Available Balance</span>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-3xl font-extrabold text-primary">{balance}</span>
              <span className="text-sm font-medium text-muted-foreground">EcoPoints</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setActiveTab("history")}>
              Redemption History
            </Button>
            <Button size="sm" onClick={() => setActiveTab("achievements")}>
              View Achievements
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="browse">Browse Rewards</TabsTrigger>
          <TabsTrigger value="history">Redeemed Items</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        {/* Browse Rewards */}
        <TabsContent value="browse" className="space-y-6 mt-4">
          {/* Category Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {Object.entries(CATEGORIES).map(([key, label]) => (
              <Button
                key={key}
                variant={catFilter === key ? "default" : "outline"}
                size="sm"
                className="rounded-full text-xs"
                onClick={() => setCatFilter(key)}
              >
                {label}
              </Button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="No rewards found in this category" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((r) => {
                const canAfford = balance >= r.pointsRequired;
                return (
                  <Card key={r._id} className="flex flex-col border border-border/80 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-base font-semibold">{r.title}</CardTitle>
                        <Badge variant={canAfford ? "default" : "secondary"} className="shrink-0">
                          {r.pointsRequired} pts
                        </Badge>
                      </div>
                      <Badge variant="outline" className="w-fit text-[10px] capitalize">
                        {r.category}
                      </Badge>
                    </CardHeader>
                    <CardContent className="flex-1 text-xs text-muted-foreground pb-4">
                      {r.description}
                      {r.stock !== undefined && (
                        <p className="text-[10px] text-amber-600 mt-2 font-medium">
                          Only {r.stock} left in stock
                        </p>
                      )}
                    </CardContent>
                    <CardFooter className="pt-0 border-t p-4 bg-muted/20">
                      <Button
                        size="sm"
                        className="w-full text-xs font-semibold"
                        disabled={!canAfford || redeem.isPending || r.stock === 0}
                        onClick={() => redeem.mutate(r._id)}
                      >
                        {r.stock === 0 ? "Out of Stock" : !canAfford ? "Insufficient Points" : "Redeem Reward"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Redemption History */}
        <TabsContent value="history" className="mt-4">
          {myRedemptionsList.length === 0 ? (
            <EmptyState title="No rewards redeemed yet" description="Redeem eco points to grab shopping coupons and vouchers" />
          ) : (
            <div className="border rounded-lg divide-y">
              {myRedemptionsList.map((item) => (
                <div key={item._id} className="flex justify-between items-center p-4 hover:bg-muted/10 transition-colors">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{item.reward?.title || "Special Reward"}</p>
                    <div className="flex gap-2 items-center text-xs text-muted-foreground">
                      <span>Spent {item.pointsSpent} pts</span>
                      <span>•</span>
                      <span>{new Date(item.redeemedAt || item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize text-green-700 bg-green-50 border-green-200">
                      {item.status || "Completed"}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Achievements / Gamification Tab */}
        <TabsContent value="achievements" className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {achievements.map((ach, idx) => (
              <Card key={idx} className={ach.unlocked ? "border-primary/20 bg-primary/5" : "opacity-75"}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                      <Award className={`h-4 w-4 ${ach.unlocked ? "text-primary" : "text-muted-foreground"}`} />
                      {ach.title}
                    </CardTitle>
                    {ach.unlocked && <Badge className="text-[9px] h-4">Unlocked</Badge>}
                  </div>
                  <CardDescription className="text-xs">{ach.desc}</CardDescription>
                </CardHeader>
                <CardContent className="pb-3 text-xs">
                  <div className="w-full bg-muted rounded-full h-1.5 mt-1 overflow-hidden">
                    <div
                      className="bg-primary h-1.5 rounded-full"
                      style={{ width: ach.progress }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground block mt-1 text-right">
                    Progress: {ach.progress}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
