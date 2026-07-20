import { Link, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useUiStore } from "@/store/ui.store";
import { cn } from "@/lib/utils";
import { NavIcon } from "./NavIcon";

export function MobileSidebar({ items, variant = "default" }) {
  const open = useUiStore((s) => s.mobileSidebarOpen);
  const setOpen = useUiStore((s) => s.setMobileSidebarOpen);
  const location = useLocation();
  const isAdmin = variant === "admin";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className={cn("w-72 p-0", isAdmin && "bg-slate-950 text-slate-100 border-slate-800")}>
        <SheetHeader className="p-4 border-b">
          <SheetTitle className={isAdmin ? "text-slate-100" : ""}>Menu</SheetTitle>
        </SheetHeader>
        <nav className="p-2 space-y-1">
          {items.map((item) => {
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                  active
                    ? isAdmin
                      ? "bg-slate-800 text-white"
                      : "bg-primary/10 text-primary font-medium"
                    : isAdmin
                      ? "text-slate-400 hover:bg-slate-900"
                      : "text-muted-foreground hover:bg-accent",
                )}
              >
                <NavIcon name={item.icon} className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
