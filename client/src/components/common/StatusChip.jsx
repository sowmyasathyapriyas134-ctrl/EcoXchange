import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_VARIANTS = {
  pending: "warning",
  assigned: "secondary",
  "in-transit": "default",
  completed: "success",
  verified: "success",
  cancelled: "destructive",
  failed: "destructive",
  active: "success",
  draft: "secondary",
};

export function StatusChip({ status, className }) {
  const normalized = String(status || "pending").toLowerCase();
  const variant = STATUS_VARIANTS[normalized] || "outline";

  return (
    <Badge variant={variant} className={cn("capitalize", className)}>
      {normalized.replace(/_/g, " ")}
    </Badge>
  );
}
