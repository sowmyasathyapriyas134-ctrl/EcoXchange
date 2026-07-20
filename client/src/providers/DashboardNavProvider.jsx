import { DashboardNavContext } from "@/contexts/dashboard-nav.context";

export function DashboardNavProvider({ navItems, variant = "default", children }) {
  return (
    <DashboardNavContext.Provider value={{ navItems, variant }}>
      {children}
    </DashboardNavContext.Provider>
  );
}
