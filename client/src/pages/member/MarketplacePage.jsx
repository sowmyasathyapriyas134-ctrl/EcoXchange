import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchBar } from "@/components/common/SearchBar";
import { ApiError } from "@/components/errors/ApiError";
import { EmptyState } from "@/components/common/EmptyState";
import { DashboardSkeleton } from "@/components/loading/DashboardSkeleton";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAddToCart, useProducts } from "@/hooks/queries/useMember";

export default function MarketplacePage() {
  const [q, setQ] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("latest");
  const { data, isLoading, isError, refetch, isFetching } = useProducts();
  const addToCart = useAddToCart();

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <ApiError onRetry={refetch} loading={isFetching} />;

  const rawProducts = data?.data ?? [];

  // Extract unique categories dynamically
  const categories = ["All", ...new Set(rawProducts.map((p) => p.category).filter(Boolean))];

  // Search, Filter
  let products = rawProducts.filter((p) => {
    const matchesSearch = !q || p.name?.toLowerCase().includes(q.toLowerCase()) || p.description?.toLowerCase().includes(q.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Sorting
  if (sortBy === "price_asc") {
    products.sort((a, b) => a.price - b.price);
  } else if (sortBy === "price_desc") {
    products.sort((a, b) => b.price - a.price);
  } else if (sortBy === "latest") {
    products.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace"
        description="Buy recycled products from verified recyclers"
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/member/orders">My Orders</Link>
            </Button>
            <Button asChild>
              <Link to="/member/cart">View Cart</Link>
            </Button>
          </div>
        }
      />

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <SearchBar value={q} onChange={setQ} placeholder="Search products…" className="w-full md:max-w-md" />
        
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <select
            className="h-10 rounded-md border px-3 text-sm"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            className="h-10 rounded-md border px-3 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="latest">Latest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {products.length === 0 ? (
        <EmptyState title="No products found" description="Try adjusting your filters or search term." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Card key={p._id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
              {p.images?.[0] ? (
                <img src={p.images[0]} alt={p.name} className="h-48 w-full object-cover" />
              ) : (
                <div className="h-48 w-full bg-muted flex items-center justify-center text-muted-foreground">No image</div>
              )}
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-base line-clamp-1">{p.name}</CardTitle>
                  <Badge variant="secondary" className="shrink-0">{p.category}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 pb-2 flex-1">
                <p className="text-lg font-bold text-primary">₹{p.price}</p>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.description}</p>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex gap-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link to={`/member/marketplace/${p._id}`}>Details</Link>
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={addToCart.isPending || p.status === "out_of_stock"}
                  onClick={() => addToCart.mutate({ productId: p._id, quantity: 1 })}
                >
                  {p.status === "out_of_stock" ? "Out of Stock" : "Add to Cart"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
