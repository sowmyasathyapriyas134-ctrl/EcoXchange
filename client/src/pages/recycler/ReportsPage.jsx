import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { DataTable } from "@/components/common/DataTable";
import { ApiError } from "@/components/errors/ApiError";
import { DashboardSkeleton } from "@/components/loading/DashboardSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRecyclerReport, usePayments } from "@/hooks/queries/useRecycler";
import { FileText, Award, Scale, IndianRupee, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  const reportQuery = useRecyclerReport();
  const paymentsQuery = usePayments();

  const isLoading = reportQuery.isLoading || paymentsQuery.isLoading;
  const isError = reportQuery.isError || paymentsQuery.isError;
  const refetch = () => {
    reportQuery.refetch();
    paymentsQuery.refetch();
  };
  const isFetching = reportQuery.isFetching || paymentsQuery.isFetching;

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <ApiError onRetry={refetch} loading={isFetching} />;

  const report = reportQuery.data?.data ?? {
    totalProcessedPickups: 0,
    totalRecycledWeight: 0,
    totalPaidToMembers: 0,
    totalProductsListed: 0,
    totalSales: 0,
    estimatedProfit: 0,
  };

  const payments = paymentsQuery.data?.data ?? [];

  const columns = [
    { key: "_id", header: "Payment ID", render: (row) => <span className="font-mono text-xs">{row._id}</span> },
    { key: "wasteType", header: "Material", render: (row) => <span className="capitalize text-xs font-medium">{row.wasteType}</span> },
    { key: "weight", header: "Weight", render: (row) => <span>{row.weight} kg</span> },
    { key: "ratePerKg", header: "Rate/Kg", render: (row) => <span>₹{row.ratePerKg}</span> },
    { key: "totalAmount", header: "Total Paid", render: (row) => <span className="font-medium text-emerald-600">₹{row.totalAmount}</span> },
    { key: "paidAt", header: "Date Paid", render: (row) => <span>{row.paidAt ? new Date(row.paidAt).toLocaleDateString() : "—"}</span> },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations Report"
        description="Comprehensive summary of recycling volumes, member payouts, and revenue streams"
        actions={
          <Button onClick={handlePrint} className="bg-primary text-white text-xs flex items-center gap-1.5">
            <Printer className="h-4 w-4" /> Print Report
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Processed Batches" value={String(report.totalProcessedPickups)} icon={Award} hint="fully recycled collections" />
        <StatCard label="Recycled Weight" value={`${report.totalRecycledWeight} kg`} icon={Scale} hint="total mass redirected" />
        <StatCard label="Paid to Citizens" value={`₹${report.totalPaidToMembers}`} icon={IndianRupee} hint="outbound payments" className="border-red-200 dark:border-red-800" />
        <StatCard label="Marketplace Sales" value={`₹${report.totalSales}`} icon={FileText} hint="inbound order revenue" className="border-green-200 dark:border-green-800" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-white/20 dark:border-slate-800/50">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Summary Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between pb-2 border-b">
              <span className="text-muted-foreground">Operating Revenue</span>
              <span className="font-semibold">₹{report.totalSales.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between pb-2 border-b">
              <span className="text-muted-foreground">Citizen Payouts</span>
              <span className="font-semibold text-red-600">- ₹{report.totalPaidToMembers.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-muted-foreground font-medium">Estimated Net Margin</span>
              <span className="font-bold text-emerald-600">₹{(report.totalSales - report.totalPaidToMembers).toLocaleString("en-IN")}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-white/20 dark:border-slate-800/50">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recent Payout Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable columns={columns} data={payments.slice(0, 10)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
