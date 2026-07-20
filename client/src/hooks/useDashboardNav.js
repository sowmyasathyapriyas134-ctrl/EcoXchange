import { useContext } from "react";
import { DashboardNavContext } from "@/contexts/dashboard-nav.context";

export function useDashboardNav() {
  return useContext(DashboardNavContext);
}
