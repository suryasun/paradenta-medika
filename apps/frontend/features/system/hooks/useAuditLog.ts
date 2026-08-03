import { useQuery } from "@tanstack/react-query";
import { activityLogService, auditLogService, operationsHealthService } from "../services/auditLog.service";

export function useAuditLogs(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ["system", "audit-logs", "list", params], queryFn: () => auditLogService.list(params) });
}

export function useActivityLogs(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ["system", "activity-logs", "list", params], queryFn: () => activityLogService.list(params) });
}

export function useOperationsHealth() {
  return useQuery({ queryKey: ["system", "health", "operations"], queryFn: () => operationsHealthService.get() });
}
