import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/reports.service";
import { DashboardKey } from "../types/reports.types";

export function useDashboard(key: DashboardKey, branchId?: string) {
  return useQuery({ queryKey: ["reports", "dashboards", key, branchId], queryFn: () => dashboardService.get(key, branchId) });
}
