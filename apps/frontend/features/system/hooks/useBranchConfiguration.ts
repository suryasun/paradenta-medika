import { useQuery } from "@tanstack/react-query";
import { branchConfigurationService } from "../services/branchConfiguration.service";

// Phase 4, task-213.
export function useBranchConfiguration(branchId: string) {
  return useQuery({
    queryKey: ["system", "branches", "configuration", branchId],
    queryFn: () => branchConfigurationService.get(branchId),
    enabled: Boolean(branchId),
  });
}
