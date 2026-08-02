import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody, PaginationMeta } from "@/types/api";
import { Treatment } from "../types/masterData.types";

// docs/06-tasks/task-025.md: GET /treatments. Read-only lookup for the EMR
// Treatment-entry picker -- not the full Treatment admin CRUD feature.
export const treatmentService = {
  async list(params: { search?: string; limit?: number } = {}): Promise<{ items: Treatment[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiSuccessBody<Treatment[]>>("/treatments", { params: { limit: 100, ...params } });
    return { items: response.data.data, meta: response.data.meta! };
  },
};
