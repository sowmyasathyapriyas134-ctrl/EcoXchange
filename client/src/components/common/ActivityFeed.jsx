import { cn } from "@/lib/utils";

export function ActivityFeed({ items, emptyMessage = "No recent activity", className }) {
  if (!items?.length) {
    return <p className="text-sm text-muted-foreground text-center py-6">{emptyMessage}</p>;
  }

  return (
    <ul className={cn("divide-y rounded-lg border", className)}>
      {items.map((item, i) => (
        <li key={item.id ?? i} className="flex gap-3 p-4">
          {item.icon && <div className="mt-0.5 text-muted-foreground">{item.icon}</div>}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{item.title}</p>
            {item.subtitle && <p className="text-sm text-muted-foreground">{item.subtitle}</p>}
            {item.time && <p className="text-xs text-muted-foreground mt-1">{item.time}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
