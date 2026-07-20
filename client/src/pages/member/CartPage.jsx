import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { ApiError } from "@/components/errors/ApiError";
import { EmptyState } from "@/components/common/EmptyState";
import { DashboardSkeleton } from "@/components/loading/DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart, useCheckout, useRemoveCartItem, useUpdateCartItem } from "@/hooks/queries/useMember";
import { Trash2, ShieldCheck, Truck } from "lucide-react";

export default function CartPage() {
  const cart = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const checkout = useCheckout();

  const [shippingAddress, setShippingAddress] = useState("");

  if (cart.isLoading) return <DashboardSkeleton />;
  if (cart.isError) return <ApiError onRetry={cart.refetch} loading={cart.isFetching} />;

  const items = cart.data?.data?.items ?? [];
  const subtotal = items.reduce((sum, it) => sum + (it.product?.price ?? 0) * (it.quantity ?? 0), 0);
  const shipping = subtotal > 1000 ? 0 : 50;
  const taxes = Math.round(subtotal * 0.18);
  const total = subtotal + shipping + taxes;

  const handleCheckout = (e) => {
    e.preventDefault();
    checkout.mutate({ fromCart: true, shippingAddress });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="Shopping Cart" description="Review your selected items and complete your order" />
      {items.length === 0 ? (
        <EmptyState
          title="Your cart is empty"
          description="Browse the marketplace to discover eco-friendly and recycled products"
          action={<Button asChild><Link to="/member/marketplace">Shop Marketplace</Link></Button>}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Cart Items List */}
          <div className="md:col-span-2 space-y-4">
            {items.map((it) => (
              <Card key={it._id} className="overflow-hidden">
                <CardContent className="flex gap-4 p-4 items-center">
                  {it.product?.images?.[0] ? (
                    <img src={it.product.images[0]} alt="" className="h-20 w-20 rounded object-cover border" />
                  ) : (
                    <div className="h-20 w-20 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">No img</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm line-clamp-1">{it.product?.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{it.product?.category}</p>
                    <p className="text-sm font-bold text-primary mt-1">₹{it.product?.price}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={1}
                        className="w-16 h-8 text-center"
                        value={it.quantity}
                        onChange={(e) => updateItem.mutate({ id: it._id, quantity: Math.max(1, Number(e.target.value)) })}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive/80"
                        onClick={() => removeItem.mutate(it._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs font-semibold">Total: ₹{(it.product?.price ?? 0) * (it.quantity ?? 0)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Checkout Summary Card */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Truck className="h-3.5 w-3.5" /> Shipping
                    </span>
                    <span>{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST (18%)</span>
                    <span>₹{taxes}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span className="text-primary">₹{total}</span>
                  </div>
                </div>

                <form onSubmit={handleCheckout} className="space-y-4 border-t pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="shippingAddress" className="text-xs">Shipping Address</Label>
                    <Input
                      id="shippingAddress"
                      required
                      placeholder="Enter delivery address"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full h-11" disabled={checkout.isPending}>
                    {checkout.isPending ? "Processing checkout..." : "Proceed to Payment"}
                  </Button>
                </form>

                <div className="text-[10px] text-center text-muted-foreground flex justify-center items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-green-600" /> Secure payments powered by Razorpay
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
