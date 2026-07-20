import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RetryButton({ onRetry, loading, label = "Try again", className }) {
  return (
    <Button variant="outline" onClick={onRetry} disabled={loading} className={cn(className)}>
      <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
      {label}
    </Button>
  );
}
