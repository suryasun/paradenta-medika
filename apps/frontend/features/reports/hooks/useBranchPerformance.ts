import { useQuery } from "@tanstack/react-query";
import { branchReportsService } from "../services/branchReports.service";

export function useBranchPerformance(branchId: string, dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ["reports", "branch-performance", branchId, dateFrom, dateTo],
    queryFn: () => branchReportsService.getPerformance(branchId, dateFrom, dateTo),
    enabled: Boolean(branchId && dateFrom && dateTo),
  });
}
