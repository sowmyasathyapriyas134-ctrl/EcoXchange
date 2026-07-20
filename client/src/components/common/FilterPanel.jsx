import { cn } from "@/lib/utils";

export function FilterPanel({ title = "Filters", children, className }) {
  return (
    <div className={cn("rounded-lg border bg-card p-4 space-y-4", className)}>
      <h3 className="text-sm font-medium">{title}</h3>
      {children}
    </div>
  );
}
