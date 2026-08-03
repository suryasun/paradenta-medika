import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody, PaginationMeta } from "@/types/api";
import { FeatureFlag, FeatureFlagRiskClass } from "../types/system.types";

export const featureFlagService = {
  async list(params: Record<string, unknown> = {}): Promise<{ items: FeatureFlag[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiSuccessBody<FeatureFlag[]>>("/system/feature-flags", { params: { limit: 100, ...params } });
    return { items: response.data.data, meta: response.data.meta! };
  },
  async create(payload: {
    flagKey: string;
    ownerModule: string;
    targetScope?: string;
    enabled?: boolean;
    riskClass?: FeatureFlagRiskClass;
    effectiveFrom?: string;
    effectiveUntil?: string;
    reviewDate?: string;
    description?: string;
  }): Promise<FeatureFlag> {
    const response = await apiClient.post<ApiSuccessBody<FeatureFlag>>("/system/feature-flags", payload);
    return response.data.data;
  },
  async update(flagKey: string, payload: Record<string, unknown>): Promise<FeatureFlag> {
    const response = await apiClient.patch<ApiSuccessBody<FeatureFlag>>(`/system/feature-flags/${flagKey}`, payload);
    return response.data.data;
  },
};
