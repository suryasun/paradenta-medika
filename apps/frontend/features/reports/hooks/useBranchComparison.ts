import { useQuery } from "@tanstack/react-query";
import { branchReportsService } from "../services/branchReports.service";

export function useBranchComparison(branchIds: string[]) {
  return useQuery({
    queryKey: ["reports", "branch-comparison", branchIds],
    queryFn: () => branchReportsService.getComparison(branchIds),
    enabled: branchIds.length > 0,
  });
}
