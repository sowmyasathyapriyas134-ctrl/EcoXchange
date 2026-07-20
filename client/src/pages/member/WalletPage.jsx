import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { DataTable } from "@/components/common/DataTable";
import { ApiError } from "@/components/errors/ApiError";
import { DashboardSkeleton } from "@/components/loading/DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, Sparkles, Wallet } from "lucide-react";
import { useWallet, useWalletTransactions, useWithdraw } from "@/hooks/queries/useMember";

export default function WalletPage() {
  const wallet = useWallet();
  const txns = useWalletTransactions();
  const withdraw = useWithdraw();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("upi");
  const [upiId, setUpiId] = useState("");

  if (wallet.isLoading) return <DashboardSkeleton />;
  if (wallet.isError) return <ApiError onRetry={wallet.refetch} loading={wallet.isFetching} />;

  const w = wallet.data?.data ?? {};
  const rows = (txns.data?.data ?? []).map((t) => ({
    ...t,
    id: t._id,
    date: t.createdAt ? new Date(t.createdAt).toLocaleString() : "—",
  }));

  const submitWithdraw = (e) => {
    e.preventDefault();
    withdraw.mutate({
      amount: Number(amount),
      method,
      payoutDetails: method === "upi" ? { upiId } : {},
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Wallet" description="Balances, cashback, and withdrawals" />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Available" value={`₹${w.availableBalance ?? 0}`} icon={Wallet} />
        <StatCard label="Cashback" value={`₹${w.cashbackBalance ?? 0}`} icon={IndianRupee} />
        <StatCard label="Eco points" value={String(w.ecoPointsBalance ?? 0)} icon={Sparkles} />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Request withdrawal</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submitWithdraw} className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input type="number" min="100" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <select className="w-full h-10 rounded-md border px-3 text-sm" value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="upi">UPI</option>
                <option value="bank">Bank</option>
              </select>
            </div>
            {method === "upi" && (
              <div className="space-y-2">
                <Label>UPI ID</Label>
                <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="name@upi" />
              </div>
            )}
            <Button type="submit" disabled={withdraw.isPending} className="sm:col-span-3 w-fit">
              {withdraw.isPending ? "Submitting…" : "Withdraw"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <section>
        <h2 className="text-lg font-semibold mb-3">Transaction history</h2>
        {txns.isLoading ? (
          <DashboardSkeleton />
        ) : txns.isError ? (
          <ApiError onRetry={txns.refetch} />
        ) : (
          <DataTable
            columns={[
              { key: "date", header: "Date" },
              { key: "type", header: "Type" },
              { key: "amount", header: "Amount", render: (r) => `₹${r.amount}` },
              { key: "description", header: "Description" },
              { key: "status", header: "Status" },
            ]}
            data={rows}
            emptyMessage="No transactions yet"
          />
        )}
      </section>
    </div>
  );
}
