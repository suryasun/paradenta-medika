import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody } from "@/types/api";
import { BranchConfigurationEntry } from "../types/system.types";

// Phase 4, task-213 (docs/06-tasks/phase-4-documentation/epic-ba-branch-assignment.md).
export const branchConfigurationService = {
  async get(branchId: string): Promise<BranchConfigurationEntry[]> {
    const response = await apiClient.get<ApiSuccessBody<BranchConfigurationEntry[]>>(`/system/branches/${branchId}/configuration`);
    return response.data.data;
  },
};
