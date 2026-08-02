import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody, PaginationMeta } from "@/types/api";

// Mirrors apps/backend's crudUseCaseFactory/crudControllerFactory shape
// (task-021..026: all six Master Data entities expose an identical list/
// create/update contract) on the frontend, to avoid rewriting the same
// three fetch calls six times.
export function createCrudService<T>(resourcePath: string) {
  return {
    async list(params: Record<string, unknown> = {}): Promise<{ items: T[]; meta: PaginationMeta }> {
      const response = await apiClient.get<ApiSuccessBody<T[]>>(resourcePath, { params: { limit: 100, ...params } });
      return { items: response.data.data, meta: response.data.meta! };
    },
    async create(payload: Record<string, unknown>): Promise<T> {
      const response = await apiClient.post<ApiSuccessBody<T>>(resourcePath, payload);
      return response.data.data;
    },
    async update(id: string, payload: Record<string, unknown>): Promise<T> {
      const response = await apiClient.put<ApiSuccessBody<T>>(`${resourcePath}/${id}`, payload);
      return response.data.data;
    },
  };
}
