import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function InfiniteLoader({ className, label = "Loading more…" }) {
  return (
    <div className={cn("flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground", className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}
