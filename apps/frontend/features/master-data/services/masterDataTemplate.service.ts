import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody, PaginationMeta } from "@/types/api";
import { MasterDataTemplate, TemplateDriftEntry, TemplatePushResult } from "../types/masterData.types";

// Phase 4, task-221/222/223. Not built on createCrudService -- push/drift
// don't fit that shell's list/create/update-only shape.
export const masterDataTemplateService = {
  async list(params: Record<string, unknown> = {}): Promise<{ items: MasterDataTemplate[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiSuccessBody<MasterDataTemplate[]>>("/masterdata/templates", { params: { limit: 100, ...params } });
    return { items: response.data.data, meta: response.data.meta! };
  },

  async get(templateId: string): Promise<MasterDataTemplate> {
    const response = await apiClient.get<ApiSuccessBody<MasterDataTemplate>>(`/masterdata/templates/${templateId}`);
    return response.data.data;
  },

  async create(payload: { entityType: string; templatePayload: Record<string, unknown>; ownerClinicId: string }): Promise<MasterDataTemplate> {
    const response = await apiClient.post<ApiSuccessBody<MasterDataTemplate>>("/masterdata/templates", payload);
    return response.data.data;
  },

  async update(templateId: string, payload: { templatePayload: Record<string, unknown> }): Promise<MasterDataTemplate> {
    const response = await apiClient.put<ApiSuccessBody<MasterDataTemplate>>(`/masterdata/templates/${templateId}`, payload);
    return response.data.data;
  },

  async push(templateId: string, branchIds: string[]): Promise<TemplatePushResult[]> {
    const response = await apiClient.post<ApiSuccessBody<TemplatePushResult[]>>(`/masterdata/templates/${templateId}/push`, { branchIds });
    return response.data.data;
  },

  async getDrift(templateId: string): Promise<TemplateDriftEntry[]> {
    const response = await apiClient.get<ApiSuccessBody<TemplateDriftEntry[]>>(`/masterdata/templates/${templateId}/drift`);
    return response.data.data;
  },
};
