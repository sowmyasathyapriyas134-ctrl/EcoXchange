import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDashboardNav } from "@/hooks/useDashboardNav";
import { marketplaceApi } from "@/api/member.api";
import { queryKeys } from "@/lib/query-client";
import { cn } from "@/lib/utils";

export function GlobalSearch({ className }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { navItems } = useDashboardNav();

  const { data: productsRes } = useQuery({
    queryKey: queryKeys.marketplace.products,
    queryFn: async () => {
      const { data } = await marketplaceApi.getProducts();
      return data;
    },
    enabled: open && query.length >= 2,
    staleTime: 120_000,
  });

  const navResults = useMemo(() => {
    if (!query.trim()) return navItems.slice(0, 6);
    const q = query.toLowerCase();
    return navItems.filter((item) => item.label.toLowerCase().includes(q));
  }, [navItems, query]);

  const productResults = useMemo(() => {
    const products = productsRes?.data ?? [];
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    return products
      .filter((p) => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
      .slice(0, 5);
  }, [productsRes, query]);

  const go = (href) => {
    setOpen(false);
    setQuery("");
    navigate(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-accent w-full max-w-xs",
          className,
        )}
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search…</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            placeholder="Search navigation or marketplace…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {navResults.length > 0 && (
              <section>
                <p className="text-xs font-medium text-muted-foreground mb-2">Navigation</p>
                <ul className="space-y-1">
                  {navResults.map((item) => (
                    <li key={item.href}>
                      <button
                        type="button"
                        className="w-full text-left rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                        onClick={() => go(item.href)}
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {productResults.length > 0 && (
              <section>
                <p className="text-xs font-medium text-muted-foreground mb-2">Products</p>
                <ul className="space-y-1">
                  {productResults.map((product) => (
                    <li key={product._id}>
                      <button
                        type="button"
                        className="w-full text-left rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                        onClick={() => go(`/member/marketplace?product=${product._id}`)}
                      >
                        {product.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {!navResults.length && !productResults.length && query && (
              <p className="text-sm text-muted-foreground text-center py-4">No results found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
