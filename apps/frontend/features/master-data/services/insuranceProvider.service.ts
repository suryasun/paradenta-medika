import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody, PaginationMeta } from "@/types/api";
import { createCrudService } from "../lib/createCrudService";
import { InsuranceProvider } from "../types/masterData.types";

const crud = createCrudService<InsuranceProvider>("/insurance-providers");

// docs/06-tasks/task-332.md, docs/adr/ADR-001-insurance-coverage-model.md.
// `list` keeps its narrower signature for the Billing payment form (mirrors
// paymentMethod.service.ts); create/update come from the shared factory for
// the admin CRUD screen.
export const insuranceProviderService = {
  async list(params: { limit?: number } = {}): Promise<{ items: InsuranceProvider[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiSuccessBody<InsuranceProvider[]>>("/insurance-providers", { params: { limit: 100, ...params } });
    return { items: response.data.data, meta: response.data.meta! };
  },
  create: crud.create,
  update: crud.update,
};
