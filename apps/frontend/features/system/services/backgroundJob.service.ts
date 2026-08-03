import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody, PaginationMeta } from "@/types/api";
import { BackgroundJob } from "../types/system.types";

export const backgroundJobService = {
  async list(params: Record<string, unknown> = {}): Promise<{ items: BackgroundJob[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiSuccessBody<BackgroundJob[]>>("/system/jobs", { params: { limit: 50, ...params } });
    return { items: response.data.data, meta: response.data.meta! };
  },
  async detail(jobId: string): Promise<BackgroundJob> {
    const response = await apiClient.get<ApiSuccessBody<BackgroundJob>>(`/system/jobs/${jobId}`);
    return response.data.data;
  },
  async retry(jobId: string): Promise<BackgroundJob> {
    const response = await apiClient.post<ApiSuccessBody<BackgroundJob>>(`/system/jobs/${jobId}/retry`);
    return response.data.data;
  },
  async cancel(jobId: string): Promise<BackgroundJob> {
    const response = await apiClient.post<ApiSuccessBody<BackgroundJob>>(`/system/jobs/${jobId}/cancel`);
    return response.data.data;
  },
};
