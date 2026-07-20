import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { RetryButton } from "./RetryButton";

export function ApiError({ message = "Failed to load data", onRetry, loading, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-12 text-center", className)}>
      <AlertCircle className="h-10 w-10 text-destructive" />
      <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
      {onRetry && <RetryButton onRetry={onRetry} loading={loading} />}
    </div>
  );
}
