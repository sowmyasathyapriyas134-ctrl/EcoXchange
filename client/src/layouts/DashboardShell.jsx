import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useDashboardNav } from "@/hooks/useDashboardNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import DashboardLayout from "@/layouts/DashboardLayout";
import { DashboardSkeleton } from "@/components/loading/DashboardSkeleton";
import { AiChatWidget } from "@/components/ai/AiChatWidget";
import { OfflineBanner } from "@/components/errors/OfflineBanner";

export default function DashboardShell() {
  const { navItems, variant } = useDashboardNav();
  const isAdmin = variant === "admin";

  return (
    <div className={cn("flex h-screen overflow-hidden", isAdmin && "bg-slate-950 text-slate-100")}>
      <Sidebar items={navItems} variant={variant} />
      <MobileSidebar items={navItems} variant={variant} />
      <div className="flex flex-1 flex-col min-w-0">
        <OfflineBanner />
        <Navbar variant={variant} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <DashboardLayout>
            <Suspense fallback={<DashboardSkeleton />}>
              <Outlet />
            </Suspense>
          </DashboardLayout>
        </main>
        <BottomNav items={navItems} />
      </div>
      <AiChatWidget />
    </div>
  );
}
