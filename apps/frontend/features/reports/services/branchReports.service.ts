import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody } from "@/types/api";
import { BranchComparisonEntry, BranchDashboardResponse, BranchPerformancePeriodEntry } from "../types/reports.types";

// Phase 4, task-218/219/220. Distinct from dashboardService -- these
// endpoints require an explicit branchId (single-branch or multi-branch
// scope), unlike the 5 fixed dashboards which infer scope from the user.
export const branchReportsService = {
  async getDashboard(branchId: string): Promise<BranchDashboardResponse> {
    const response = await apiClient.get<ApiSuccessBody<BranchDashboardResponse>>("/reports/dashboards/branch", { params: { branchId } });
    return response.data.data;
  },

  async getComparison(branchIds: string[]): Promise<BranchComparisonEntry[]> {
    const response = await apiClient.get<ApiSuccessBody<BranchComparisonEntry[]>>("/reports/branch-comparison", {
      params: { branchIds: branchIds.join(",") },
    });
    return response.data.data;
  },

  async getPerformance(branchId: string, dateFrom: string, dateTo: string): Promise<BranchPerformancePeriodEntry[]> {
    const response = await apiClient.get<ApiSuccessBody<BranchPerformancePeriodEntry[]>>("/reports/branch-performance", {
      params: { branchId, dateFrom, dateTo },
    });
    return response.data.data;
  },
};
