import { Link, useLocation } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/store/ui.store";
import { NavIcon } from "./NavIcon";

export function Sidebar({ items, variant = "default", className }) {
  const location = useLocation();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const isAdmin = variant === "admin";

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r h-full transition-all duration-200",
        collapsed ? "w-[72px]" : "w-64",
        isAdmin ? "bg-slate-950 text-slate-100 border-slate-800" : "bg-card",
        className,
      )}
    >
      <div className={cn("flex items-center justify-between p-4", collapsed && "justify-center")}>
        {!collapsed && (
          <span className={cn("font-bold text-sm", isAdmin && "text-slate-200")}>EcoXchange</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={isAdmin ? "text-slate-400 hover:text-white" : ""}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>
      <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const active = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              to={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? isAdmin
                    ? "bg-slate-800 text-white"
                    : "bg-primary/10 text-primary font-medium"
                  : isAdmin
                    ? "text-slate-400 hover:bg-slate-900 hover:text-white"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                collapsed && "justify-center px-2",
              )}
            >
              <NavIcon name={item.icon} className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
