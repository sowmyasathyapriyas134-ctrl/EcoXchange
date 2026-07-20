import { Link, useParams } from "react-router-dom";
import { ApiError } from "@/components/errors/ApiError";
import { DashboardSkeleton } from "@/components/loading/DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAddToCart, useProduct } from "@/hooks/queries/useMember";
import { ArrowLeft, ShoppingCart, Sparkles, Shield, Tag } from "lucide-react";

export default function ProductDetailPage() {
  const { id } = useParams();
  const { data, isLoading, isError, refetch } = useProduct(id);
  const addToCart = useAddToCart();
  const product = data?.data ?? data;

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !product) return <ApiError onRetry={refetch} message="Product not found" />;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/member/marketplace" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Marketplace
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Images */}
        <div className="space-y-4">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-80 object-cover rounded-lg border shadow-sm"
            />
          ) : (
            <div className="w-full h-80 bg-muted flex items-center justify-center text-muted-foreground rounded-lg border">
              No image available
            </div>
          )}
          {product.images?.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(1).map((img, idx) => (
                <img key={idx} src={img} alt="" className="h-16 w-full object-cover rounded border" />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{product.category}</Badge>
              <Badge variant={product.status === "active" ? "default" : "secondary"}>
                {product.status === "active" ? "In Stock" : "Out of Stock"}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-primary">₹{product.price}</span>
            <span className="text-sm text-muted-foreground">inclusive of all taxes</span>
          </div>

          <p className="text-muted-foreground leading-relaxed">{product.description}</p>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-primary" /> Sustainability Score
                </span>
                <p className="font-semibold">{product.sustainabilityScore ?? 80}/100</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Shield className="h-3 w-3 text-primary" /> Carbon Saved
                </span>
                <p className="font-semibold">{product.carbonSavedKg ?? 2.5} kg CO₂</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Tag className="h-3 w-3 text-primary" /> Materials Used
                </span>
                <p className="font-semibold">{product.materialsUsed?.join(", ") || "Recycled Plastics"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <ShoppingCart className="h-3 w-3 text-primary" /> Available Stock
                </span>
                <p className="font-semibold">{product.quantityAvailable ?? product.stock ?? 0} units</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              className="flex-1 h-12"
              onClick={() => addToCart.mutate({ productId: product._id, quantity: 1 })}
              disabled={addToCart.isPending || product.status === "out_of_stock"}
            >
              <ShoppingCart className="h-5 w-5 mr-2" /> Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
