import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody, PaginationMeta } from "@/types/api";
import { createCrudService } from "../lib/createCrudService";
import { PaymentMethod } from "../types/masterData.types";

const crud = createCrudService<PaymentMethod>("/payment-methods");

// docs/06-tasks/task-026.md. `list` keeps its narrower signature for the
// Billing payment form; create/update come from the shared factory for
// the admin CRUD screen.
export const paymentMethodService = {
  async list(params: { limit?: number } = {}): Promise<{ items: PaymentMethod[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiSuccessBody<PaymentMethod[]>>("/payment-methods", { params: { limit: 100, ...params } });
    return { items: response.data.data, meta: response.data.meta! };
  },
  create: crud.create,
  update: crud.update,
};
