import { Menu, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useUiStore } from "@/store/ui.store";
import { useSocket } from "@/hooks/useSocket";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "./GlobalSearch";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Breadcrumbs } from "./Breadcrumbs";

export function Navbar({ variant = "default" }) {
  const setMobileSidebarOpen = useUiStore((s) => s.setMobileSidebarOpen);
  const { status } = useSocket();
  const isAdmin = variant === "admin";

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b backdrop-blur supports-[backdrop-filter]:bg-background/80",
        isAdmin && "bg-slate-950/90 border-slate-800 text-slate-100",
      )}
    >
      <div className="flex h-14 items-center gap-3 px-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden md:block flex-1">
          <Breadcrumbs />
        </div>
        <div className="flex-1 md:flex-none flex justify-end md:justify-start">
          <GlobalSearch />
        </div>
        <Separator orientation="vertical" className="h-6 hidden sm:block" />
        <div className="flex items-center gap-1">
          <span className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground mr-1">
            {status === "connected" ? (
              <Wifi className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-amber-500" />
            )}
            {status}
          </span>
          <NotificationBell />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
