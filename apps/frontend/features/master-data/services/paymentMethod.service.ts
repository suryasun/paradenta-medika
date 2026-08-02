import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody, PaginationMeta } from "@/types/api";
import { PaymentMethod } from "../types/masterData.types";

// docs/06-tasks/task-026.md: GET /payment-methods. Read-only lookup for
// the Billing payment form -- not the full Payment Method admin CRUD
// feature.
export const paymentMethodService = {
  async list(params: { limit?: number } = {}): Promise<{ items: PaymentMethod[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiSuccessBody<PaymentMethod[]>>("/payment-methods", { params: { limit: 100, ...params } });
    return { items: response.data.data, meta: response.data.meta! };
  },
};
