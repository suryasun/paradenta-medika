import { useQuery } from "@tanstack/react-query";
import { branchReportsService } from "../services/branchReports.service";

export function useBranchDashboard(branchId: string) {
  return useQuery({
    queryKey: ["reports", "dashboards", "branch", branchId],
    queryFn: () => branchReportsService.getDashboard(branchId),
    enabled: Boolean(branchId),
  });
}
