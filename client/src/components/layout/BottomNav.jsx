import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { NavIcon } from "./NavIcon";

export function BottomNav({ items }) {
  const location = useLocation();

  if (!items?.length) return null;

  const mobileItems = items.slice(0, 5);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur">
      <ul className="grid grid-cols-5">
        {mobileItems.map((item) => {
          const active = location.pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                to={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-[10px]",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <NavIcon name={item.icon} className="h-4 w-4" />
                <span className="truncate max-w-[4.5rem]">{item.label.split(" ")[0]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
