import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody, PaginationMeta } from "@/types/api";
import { ConfigurationChangeRequest, SystemParameter, SystemParameterValueType } from "../types/system.types";

export const systemParameterService = {
  async list(params: Record<string, unknown> = {}): Promise<{ items: SystemParameter[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiSuccessBody<SystemParameter[]>>("/system/parameters", { params: { limit: 100, ...params } });
    return { items: response.data.data, meta: response.data.meta! };
  },
  async create(payload: {
    key: string;
    scope?: { type?: string; id?: string };
    valueType: SystemParameterValueType;
    value: unknown;
    effectiveFrom?: string;
    isHighRisk?: boolean;
    reason?: string;
  }): Promise<SystemParameter> {
    const response = await apiClient.post<ApiSuccessBody<SystemParameter>>("/system/parameters", payload);
    return response.data.data;
  },
  async versions(parameterKey: string, params: Record<string, unknown> = {}): Promise<{ items: SystemParameter[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiSuccessBody<SystemParameter[]>>(`/system/parameters/${parameterKey}/versions`, { params: { limit: 50, ...params } });
    return { items: response.data.data, meta: response.data.meta! };
  },
  async createChangeRequest(
    parameterKey: string,
    payload: { scope?: { type?: string; id?: string }; valueType: SystemParameterValueType; value: unknown; reason?: string },
  ): Promise<ConfigurationChangeRequest> {
    const response = await apiClient.post<ApiSuccessBody<ConfigurationChangeRequest>>(`/system/parameters/${parameterKey}/change-requests`, payload);
    return response.data.data;
  },
  async approveChangeRequest(requestId: string): Promise<ConfigurationChangeRequest> {
    const response = await apiClient.post<ApiSuccessBody<ConfigurationChangeRequest>>(`/system/configuration-change-requests/${requestId}/approve`);
    return response.data.data;
  },
  async rollback(
    parameterKey: string,
    payload: { scope?: { type?: string; id?: string }; version: number; reason: string },
  ): Promise<ConfigurationChangeRequest> {
    const response = await apiClient.post<ApiSuccessBody<ConfigurationChangeRequest>>(`/system/parameters/${parameterKey}/rollback`, payload);
    return response.data.data;
  },
};
