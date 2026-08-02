import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody, PaginationMeta } from "@/types/api";
import { createCrudService } from "../lib/createCrudService";
import { Treatment } from "../types/masterData.types";

const crud = createCrudService<Treatment>("/treatments");

// docs/06-tasks/task-025.md. `list` keeps its narrower {search,limit}
// signature for the EMR Treatment-entry picker; create/update come from
// the shared factory for the admin CRUD screen.
export const treatmentService = {
  async list(params: { search?: string; limit?: number } = {}): Promise<{ items: Treatment[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiSuccessBody<Treatment[]>>("/treatments", { params: { limit: 100, ...params } });
    return { items: response.data.data, meta: response.data.meta! };
  },
  create: crud.create,
  update: crud.update,
};
