import { Link, useParams } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusChip } from "@/components/common/StatusChip";
import { Timeline } from "@/components/common/Timeline";
import { ApiError } from "@/components/errors/ApiError";
import { DashboardSkeleton } from "@/components/loading/DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAddToCart, useOrder } from "@/hooks/queries/useMember";
import { ArrowLeft, RefreshCw, Download, Truck } from "lucide-react";
import toast from "react-hot-toast";

export default function OrderDetailPage() {
  const { id } = useParams();
  const { data, isLoading, isError, refetch } = useOrder(id);
  const addToCart = useAddToCart();
  const order = data?.data ?? data;

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !order) return <ApiError onRetry={refetch} message="Order not found" />;

  const refill = () => {
    order.items?.forEach((it) => {
      const productId = it.product?._id ?? it.product;
      if (productId) {
        addToCart.mutate({ productId, quantity: it.quantity ?? 1 });
      }
    });
  };

  const handleDownloadInvoice = () => {
    toast.success("Downloading invoice...");
    // Mock download behavior or file system creation
    const element = document.createElement("a");
    const file = new Blob([
      `EcoXchange Marketplace Invoice\nOrder ID: ${order._id}\nTotal: ₹${order.total}\nPayment Status: ${order.paymentStatus}\nDelivery: ${order.deliveryStatus}`
    ], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Invoice-${String(order._id).slice(-6)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Generate timeline milestones
  const deliveryMilestones = [
    { title: "Order Created", time: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "", description: "Order received & payment verified." },
    { title: "Processing", time: order.updatedAt ? new Date(order.updatedAt).toLocaleDateString() : "", description: "Recycler is packaging items." }
  ];

  if (order.deliveryStatus === "shipped") {
    deliveryMilestones.push({ title: "Shipped", time: "In Transit", description: "Package dispatched with our agent." });
  } else if (order.deliveryStatus === "delivered") {
    deliveryMilestones.push({ title: "Shipped", time: "Completed", description: "Package dispatched." });
    deliveryMilestones.push({ title: "Delivered", time: "Completed", description: "Delivered to your address." });
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/member/orders" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Orders
          </Link>
        </Button>
      </div>

      <PageHeader
        title={`Order Details`}
        description={`ID: #${String(order._id)}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadInvoice}>
              <Download className="h-4 w-4 mr-2" /> Download Invoice
            </Button>
            <Button size="sm" onClick={refill} disabled={addToCart.isPending}>
              <RefreshCw className="h-4 w-4 mr-2" /> Buy Items Again
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Items Purchased</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items?.map((it, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm border-b pb-3 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="font-semibold">{it.product?.name || "Marketplace Product"}</p>
                    <p className="text-xs text-muted-foreground">₹{it.unitPrice ?? it.product?.price ?? 0} each × {it.quantity}</p>
                  </div>
                  <span className="font-bold">₹{(it.unitPrice ?? it.product?.price ?? 0) * (it.quantity ?? 1)}</span>
                </div>
              ))}
              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal ?? order.total}</span>
                </div>
                {order.shipping !== undefined && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>₹{order.shipping}</span>
                  </div>
                )}
                {order.taxes !== undefined && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>GST & Fees</span>
                    <span>₹{order.taxes}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base border-t pt-2 text-primary">
                  <span>Total Paid</span>
                  <span>₹{order.total}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Shipping & Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Delivery Address</span>
                <p className="font-medium flex items-center gap-1">
                  <Truck className="h-4 w-4 text-primary shrink-0" />
                  {order.shippingAddress || "Registered profile address"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t pt-3">
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Payment Status</span>
                  <StatusChip status={order.paymentStatus} />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Delivery Status</span>
                  <StatusChip status={order.deliveryStatus} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Delivery Tracker</CardTitle>
              <CardDescription>Track package updates</CardDescription>
            </CardHeader>
            <CardContent>
              <Timeline items={deliveryMilestones} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
