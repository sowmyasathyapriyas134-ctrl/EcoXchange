import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/api/dashboard.api";

export const dashboardKeys = {
  citizen: ["dashboard", "citizen"],
  supervisor: ["dashboard", "supervisor"],
  recycler: ["dashboard", "recycler"],
  admin: ["dashboard", "admin"],
};

export function useCitizenDashboard() {
  return useQuery({
    queryKey: dashboardKeys.citizen,
    queryFn: () => dashboardApi.getCitizen(),
  });
}

export function useSupervisorDashboard() {
  return useQuery({
    queryKey: dashboardKeys.supervisor,
    queryFn: () => dashboardApi.getSupervisor(),
  });
}

export function useRecyclerDashboard() {
  return useQuery({
    queryKey: dashboardKeys.recycler,
    queryFn: () => dashboardApi.getRecycler(),
  });
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: dashboardKeys.admin,
    queryFn: () => dashboardApi.getAdmin(),
  });
}
