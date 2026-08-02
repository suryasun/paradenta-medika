import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody } from "@/types/api";
import { OperationsDashboard } from "../types/dashboard.types";

// docs/06-tasks/task-059.md: GET /reports/dashboards/operations
export const dashboardService = {
  async getOperationsDashboard(branchId?: string): Promise<OperationsDashboard> {
    const response = await apiClient.get<ApiSuccessBody<OperationsDashboard>>("/reports/dashboards/operations", {
      params: branchId ? { branchId } : undefined,
    });
    return response.data.data;
  },
};
