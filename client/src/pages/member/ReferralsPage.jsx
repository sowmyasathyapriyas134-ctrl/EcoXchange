import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { ApiError } from "@/components/errors/ApiError";
import { DashboardSkeleton } from "@/components/loading/DashboardSkeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth.store";
import { useWalletTransactions } from "@/hooks/queries/useMember";
import { Copy, Share2, Check, Gift, Users, Trophy } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export default function ReferralsPage() {
  const user = useAuthStore((s) => s.user);
  const txns = useWalletTransactions();
  const [copied, setCopied] = useState(false);

  if (txns.isLoading) return <DashboardSkeleton />;
  if (txns.isError) return <ApiError onRetry={txns.refetch} />;

  const referralTxns = (txns.data?.data ?? [])
    .filter((t) => t.type === "referral_bonus" || t.description?.toLowerCase().includes("referral"))
    .map((t) => ({
      ...t,
      id: t._id,
      date: t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-IN") : "—",
    }));

  const referralCode = user?.phone?.replace(/\D/g, "").slice(-10) || user?.id?.slice(-8) || "ECO-MEMBER";
  const inviteUrl = `${window.location.origin}/register?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success("Referral code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "EcoXchange Referral",
        text: `Join me on EcoXchange to recycle waste, earn cashbacks and win eco rewards! Use referral code: ${referralCode}`,
        url: inviteUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(inviteUrl);
      toast.success("Invite link copied to clipboard!");
    }
  };

  const totalEarnings = referralTxns.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Referrals"
        description="Invite friends to EcoXchange and earn bonus cashbacks in your wallet"
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Referral Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" /> Invite Friends
            </CardTitle>
            <CardDescription>
              Share your referral code. You and your friend both receive ₹50 cashback when they complete their first waste pickup!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Your Referral Code</label>
              <div className="flex gap-2">
                <Input
                  className="font-mono text-lg font-bold tracking-wider bg-muted/30 select-all"
                  readOnly
                  value={referralCode}
                />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" /> Share
                </Button>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Invite Link</label>
              <Input
                className="text-xs bg-muted/30 text-muted-foreground"
                readOnly
                value={inviteUrl}
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats card */}
        <Card className="bg-primary/5 border-primary/20 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Trophy className="h-4.5 w-4.5 text-primary" /> Referral Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div>
              <span className="text-xs text-muted-foreground block">Total Referrals</span>
              <span className="text-2xl font-extrabold text-foreground">{referralTxns.length}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Total Earnings</span>
              <span className="text-2xl font-extrabold text-primary">₹{totalEarnings}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral History table */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Referral Bonus Ledger</h2>
        </div>
        <DataTable
          columns={[
            { key: "date", header: "Date Received" },
            { key: "amount", header: "Bonus Earned", render: (r) => <span className="font-semibold text-primary">₹{r.amount}</span> },
            { key: "description", header: "Details" },
            { key: "status", header: "Status", render: (r) => <span className="capitalize font-medium text-green-600">{r.status}</span> },
          ]}
          data={referralTxns}
          emptyMessage="No referral bonuses yet — start sharing your invite code to earn cashback"
        />
      </section>
    </div>
  );
}
