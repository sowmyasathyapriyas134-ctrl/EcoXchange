import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/queries/useNotifications";
import { Bell, BellOff, Check, Search, Award, CreditCard, ShoppingBag, Truck, Settings } from "lucide-react";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";

const CATEGORIES = [
  { value: "all", label: "All Alerts" },
  { value: "pickup", label: "Pickups", types: ["pickup_created", "pickup_assigned", "pickup_accepted", "pickup_started", "pickup_arrived", "pickup_completed", "pickup_verified", "pickup_rejected"] },
  { value: "order", label: "Orders", types: ["order_created", "order_completed", "order_status"] },
  { value: "reward", label: "Rewards & Points", types: ["reward_redeemed", "points_credited"] },
  { value: "payment", label: "Payments", types: ["payment_success", "payment_failed"] },
  { value: "membership", label: "Membership", types: ["membership_upgraded", "membership_expired"] },
];

function getCategoryIcon(type) {
  if (!type) return <Bell className="h-4 w-4 text-primary" />;
  const t = type.toLowerCase();
  if (t.includes("pickup")) return <Truck className="h-4 w-4 text-sky-600" />;
  if (t.includes("order")) return <ShoppingBag className="h-4 w-4 text-amber-600" />;
  if (t.includes("reward") || t.includes("points")) return <Award className="h-4 w-4 text-purple-600" />;
  if (t.includes("payment")) return <CreditCard className="h-4 w-4 text-green-600" />;
  if (t.includes("membership")) return <Settings className="h-4 w-4 text-indigo-600" />;
  return <Bell className="h-4 w-4 text-primary" />;
}

function getDeepLink(n) {
  if (!n.type) return "/member/dashboard";
  const t = n.type.toLowerCase();
  const id = n.metadata?.pickupId || n.metadata?.orderId || n.metadata?.paymentId || n.metadata?.rewardId;

  if (t.includes("pickup")) {
    return id ? `/member/pickups/${id}` : "/member/pickups";
  }
  if (t.includes("order")) {
    return id ? `/member/orders/${id}` : "/member/orders";
  }
  if (t.includes("reward") || t.includes("points")) {
    return "/member/rewards";
  }
  if (t.includes("payment") || t.includes("wallet")) {
    return "/member/wallet";
  }
  if (t.includes("membership")) {
    return "/member/membership";
  }
  return "/member/dashboard";
}

export default function NotificationsPage() {
  const { data: notificationsData, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  const list = useMemo(() => notificationsData?.data ?? notificationsData ?? [], [notificationsData]);

  // Filter & Search notifications
  const processedList = useMemo(() => {
    return list.filter((n) => {
      // Search match
      const titleMatch = n.title?.toLowerCase().includes(search.toLowerCase());
      const msgMatch = n.message?.toLowerCase().includes(search.toLowerCase());
      const searchMatch = !search || titleMatch || msgMatch;

      // Category match
      let catMatch = true;
      if (activeCat !== "all") {
        const categoryConfig = CATEGORIES.find((c) => c.value === activeCat);
        if (categoryConfig?.types) {
          catMatch = categoryConfig.types.includes(n.type);
        } else {
          catMatch = n.type?.toLowerCase().includes(activeCat);
        }
      }

      return searchMatch && catMatch;
    });
  }, [list, search, activeCat]);

  // Pagination logic
  const paginatedList = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return processedList.slice(start, start + itemsPerPage);
  }, [processedList, page]);

  const totalPages = Math.ceil(processedList.length / itemsPerPage);

  const unreadCount = useMemo(() => {
    return list.filter((n) => !n.read).length;
  }, [list]);

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Notification Center"
        description="Stay up to date with activity alerts and updates"
        actions={
          unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <Check className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )
        }
      />

      <div className="grid gap-6 md:grid-cols-4 items-start">
        {/* Left Column: Categories and Filters */}
        <div className="space-y-4 md:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Categories</CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {CATEGORIES.map((cat) => {
                const count = list.filter((n) => {
                  if (cat.value === "all") return !n.read;
                  return !n.read && cat.types?.includes(n.type);
                }).length;

                return (
                  <Button
                    key={cat.value}
                    variant={activeCat === cat.value ? "secondary" : "ghost"}
                    className="w-full justify-between text-xs font-medium h-9 px-3"
                    onClick={() => {
                      setActiveCat(cat.value);
                      setPage(1);
                    }}
                  >
                    <span>{cat.label}</span>
                    {count > 0 && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0">
                        {count} unread
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Search & List */}
        <div className="space-y-4 md:col-span-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                className="pl-9 text-sm"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Alerts</CardTitle>
                <CardDescription>Click a notification to navigate to details</CardDescription>
              </div>
              {unreadCount > 0 && (
                <Badge variant="outline" className="text-xs bg-primary/5 text-primary">
                  {unreadCount} Unread
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading notifications...</p>
              ) : paginatedList.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <BellOff className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No matching notifications found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {paginatedList.map((n) => (
                    <div
                      key={n._id}
                      className={`flex justify-between items-start py-4 gap-3 transition-colors hover:bg-muted/10 rounded px-2 -mx-2 ${
                        n.read ? "opacity-60" : "font-medium bg-primary/[0.01]"
                      }`}
                    >
                      <div className="flex gap-3 items-start flex-1 min-w-0">
                        <div className="bg-muted p-2 rounded-full mt-0.5 shrink-0">
                          {getCategoryIcon(n.type)}
                        </div>
                        <div className="space-y-1 flex-1 min-w-0">
                          <Link
                            to={getDeepLink(n)}
                            className="text-sm hover:underline cursor-pointer flex items-center gap-1.5 text-foreground leading-tight"
                          >
                            {n.title || n.message}
                          </Link>
                          {n.title && <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>}
                          <p className="text-[10px] text-muted-foreground">
                            {n.createdAt ? new Date(n.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : ""}
                          </p>
                        </div>
                      </div>
                      {!n.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs shrink-0 px-2"
                          onClick={() => markRead.mutate(n._id)}
                          disabled={markRead.isPending}
                        >
                          Mark read
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
