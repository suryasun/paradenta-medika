import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody, PaginationMeta } from "@/types/api";
import { createCrudService } from "../lib/createCrudService";
import { ConsentTemplate } from "../types/masterData.types";

const crud = createCrudService<ConsentTemplate>("/consent-templates");

// docs/06-tasks/task-085.md. `list` keeps its narrower signature for the
// Create Consent form's template dropdown; create/update come from the
// shared factory for the admin CRUD screen.
export const consentTemplateService = {
  async list(params: { limit?: number } = {}): Promise<{ items: ConsentTemplate[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiSuccessBody<ConsentTemplate[]>>("/consent-templates", { params: { limit: 100, ...params } });
    return { items: response.data.data, meta: response.data.meta! };
  },
  create: crud.create,
  update: crud.update,
};
