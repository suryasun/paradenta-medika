import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboard.service";

export function useOperationsDashboard(branchId?: string) {
  return useQuery({
    queryKey: ["dashboard", "operations", branchId ?? "all"],
    queryFn: () => dashboardService.getOperationsDashboard(branchId),
  });
}
