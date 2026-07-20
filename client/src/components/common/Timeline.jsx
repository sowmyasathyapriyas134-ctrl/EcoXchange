import { cn } from "@/lib/utils";

export function Timeline({ items, className }) {
  if (!items?.length) return null;

  return (
    <ol className={cn("relative border-l border-border ml-3 space-y-6", className)}>
      {items.map((item, i) => (
        <li key={item.id ?? i} className="ml-6">
          <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-primary bg-background" />
          <time className="text-xs text-muted-foreground">{item.time}</time>
          <h4 className="text-sm font-medium">{item.title}</h4>
          {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
        </li>
      ))}
    </ol>
  );
}
