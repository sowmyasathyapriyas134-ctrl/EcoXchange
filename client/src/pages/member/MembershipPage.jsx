import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMyMembership, useMembershipPlans, useSubscribeMembership, useWalletTransactions } from "@/hooks/queries/useMember";
import { Award, CheckCircle2, ShieldCheck, Sparkles, ArrowRight, Info, HelpCircle } from "lucide-react";
import { useState } from "react";

export default function MembershipPage() {
  const myMembership = useMyMembership();
  const plans = useMembershipPlans();
  const subscribe = useSubscribeMembership();
  const txns = useWalletTransactions();
  const [selectedToolkit, setSelectedToolkit] = useState("standard_bin");

  const current = myMembership.data?.data ?? myMembership.data ?? {};
  const planList = plans.data?.data ?? plans.data ?? [];
  const payments = (txns.data?.data ?? [])
    .filter((t) => t.description?.toLowerCase().includes("membership") || t.type === "membership_upgrade");

  const handleSubscribe = (planId) => {
    subscribe.mutate(planId);
  };

  const isSubscribed = current && Object.keys(current).length > 0 && current.membershipStatus === "member";

  return (
    <div className="space-y-6">
      <PageHeader title="Membership" description="Upgrade or manage your EcoXchange membership" />

      {/* Info Callout */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="flex items-start gap-3 py-4">
          <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-primary text-sm">Why Upgrade to Premium?</h4>
            <p className="text-xs text-muted-foreground">
              Unlock priority pickups, detailed waste analysis reports, a free EcoXchange toolkit, and a 1.5x EcoPoints multiplier on all your recycling contributions.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Membership Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Current Plan & Details</CardTitle>
              </div>
              <CardDescription>Your active benefits and renewal settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {myMembership.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading status...</p>
              ) : isSubscribed ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge className="bg-green-100 text-green-800 border-green-300">
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="text-sm text-muted-foreground">Current Plan</span>
                    <span className="font-semibold text-sm capitalize">{current.membershipPlan || "Premium"}</span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="text-sm text-muted-foreground">Start Date</span>
                    <span className="text-sm font-medium">
                      {current.membershipStartDate ? new Date(current.membershipStartDate).toLocaleDateString() : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="text-sm text-muted-foreground">Expiry / Renewal</span>
                    <span className="text-sm font-medium">
                      {current.membershipEndDate ? new Date(current.membershipEndDate).toLocaleDateString() : "—"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 py-2">
                  <div className="flex items-center gap-2 text-amber-600 font-semibold">
                    <Info className="h-5 w-5" />
                    <span>Free Trial Plan</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You are currently using a standard account. Upgrade to a premium membership to receive full member privileges.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Toolkit Selection Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" /> Welcome Toolkit Selection
              </CardTitle>
              <CardDescription>Choose your complementary eco-kit (included with premium upgrade)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div
                  onClick={() => setSelectedToolkit("standard_bin")}
                  className={`border p-4 rounded-lg cursor-pointer transition-all ${
                    selectedToolkit === "standard_bin"
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <p className="font-medium text-sm">Dual Color Waste Bins</p>
                  <p className="text-xs text-muted-foreground mt-1">Set of Blue (dry) & Green (wet) bins for easy home segregation.</p>
                </div>
                <div
                  onClick={() => setSelectedToolkit("home_compost")}
                  className={`border p-4 rounded-lg cursor-pointer transition-all ${
                    selectedToolkit === "home_compost"
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <p className="font-medium text-sm">Home Composter Kit</p>
                  <p className="text-xs text-muted-foreground mt-1">Convert organic kitchen waste into rich natural garden fertilizer.</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <HelpCircle className="h-3.5 w-3.5" /> Selection applies automatically upon successful membership payment.
              </p>
            </CardContent>
          </Card>

          {/* Invoices & History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Membership Payment History</CardTitle>
              <CardDescription>View your past receipts and invoice records</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No billing records found</p>
              ) : (
                <div className="space-y-3">
                  {payments.map((p) => (
                    <div key={p._id} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium">{p.description || "Membership Upgrade"}</p>
                        <p className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">₹{p.amount}</p>
                        <Badge className="text-[10px] bg-green-50 text-green-700 hover:bg-green-100 border border-green-200">
                          Paid
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upgrade Card / Plan Sidebar */}
        <div className="space-y-6">
          {planList.map((plan) => (
            <Card key={plan._id} className="border-primary/30 shadow-md relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl uppercase">
                Best Value
              </div>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription>{plan.description || "Premium eco privileges pack"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-extrabold text-primary">
                  ₹{plan.price}{" "}
                  <span className="text-xs text-muted-foreground font-normal">/ {plan.durationDays} days</span>
                </div>

                <ul className="space-y-2.5 text-sm pt-2">
                  {(plan.features || [
                    "Priority pickup request routing",
                    "1.5x EcoPoints earning multiplier",
                    "Free Segregation Bin or Composter Toolkit",
                    "Detailed digital monthly waste metrics",
                  ]).map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <ShieldCheck className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
                      <span className="text-xs">{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <div className="p-6 pt-0">
                <Button
                  className="w-full h-11 text-sm font-semibold"
                  onClick={() => handleSubscribe(plan._id)}
                  disabled={subscribe.isPending || (isSubscribed && current.membershipPlan === plan.name)}
                >
                  {subscribe.isPending ? (
                    "Processing Checkout..."
                  ) : isSubscribed && current.membershipPlan === plan.name ? (
                    "Current Plan Active"
                  ) : (
                    <>
                      Upgrade Now <ArrowRight className="ml-1 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
