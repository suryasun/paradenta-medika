import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { systemParameterService } from "../services/systemParameter.service";
import { SystemParameterValueType } from "../types/system.types";

export function useSystemParameters(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ["system", "parameters", "list", params], queryFn: () => systemParameterService.list(params) });
}

export function useParameterVersions(parameterKey: string | null) {
  return useQuery({
    queryKey: ["system", "parameters", "versions", parameterKey],
    queryFn: () => systemParameterService.versions(parameterKey as string),
    enabled: !!parameterKey,
  });
}

export function useCreateSystemParameter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      key: string;
      scope?: { type?: string; id?: string };
      valueType: SystemParameterValueType;
      value: unknown;
      effectiveFrom?: string;
      isHighRisk?: boolean;
      reason?: string;
    }) => systemParameterService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["system", "parameters"] }),
  });
}

export function useCreateChangeRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      parameterKey,
      payload,
    }: {
      parameterKey: string;
      payload: { scope?: { type?: string; id?: string }; valueType: SystemParameterValueType; value: unknown; reason?: string };
    }) => systemParameterService.createChangeRequest(parameterKey, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["system", "parameters"] }),
  });
}

export function useApproveChangeRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => systemParameterService.approveChangeRequest(requestId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["system", "parameters"] }),
  });
}

export function useRollbackParameter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ parameterKey, payload }: { parameterKey: string; payload: { scope?: { type?: string; id?: string }; version: number; reason: string } }) =>
      systemParameterService.rollback(parameterKey, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["system", "parameters"] }),
  });
}
