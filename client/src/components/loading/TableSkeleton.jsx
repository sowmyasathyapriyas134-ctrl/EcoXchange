import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="rounded-md border overflow-hidden">
      <div className="flex gap-4 p-4 border-b bg-muted/30">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 p-4 border-b last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
