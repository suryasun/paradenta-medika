import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody, PaginationMeta } from "@/types/api";
import { createCrudService } from "../lib/createCrudService";
import { ToothCondition } from "../types/masterData.types";

const crud = createCrudService<ToothCondition>("/tooth-conditions");

// docs/06-tasks/task-067.md. `list` keeps its narrower signature for the
// Odontogram entry form's condition dropdown; create/update come from the
// shared factory for the admin CRUD screen.
export const toothConditionService = {
  async list(params: { limit?: number } = {}): Promise<{ items: ToothCondition[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiSuccessBody<ToothCondition[]>>("/tooth-conditions", { params: { limit: 100, ...params } });
    return { items: response.data.data, meta: response.data.meta! };
  },
  create: crud.create,
  update: crud.update,
};
