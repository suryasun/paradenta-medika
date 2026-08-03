import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody, PaginationMeta } from "@/types/api";
import { ActivityLog, AuditLog, OperationsHealthResult } from "../types/system.types";

export const auditLogService = {
  async list(params: Record<string, unknown> = {}): Promise<{ items: AuditLog[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiSuccessBody<AuditLog[]>>("/system/audit-logs", { params: { limit: 50, ...params } });
    return { items: response.data.data, meta: response.data.meta! };
  },
};

export const activityLogService = {
  async list(params: Record<string, unknown> = {}): Promise<{ items: ActivityLog[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiSuccessBody<ActivityLog[]>>("/system/activity-logs", { params: { limit: 50, ...params } });
    return { items: response.data.data, meta: response.data.meta! };
  },
};

export const operationsHealthService = {
  async get(): Promise<OperationsHealthResult> {
    const response = await apiClient.get<ApiSuccessBody<OperationsHealthResult>>("/system/health/operations");
    return response.data.data;
  },
};
