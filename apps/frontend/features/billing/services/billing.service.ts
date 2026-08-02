import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody, PaginationMeta } from "@/types/api";
import { InvoiceDetail, InvoiceSummary, ListInvoicesParams, PaymentLineInput } from "../types/billing.types";

// docs/06-tasks/task-054.md..task-058.md
export const billingService = {
  async list(params: ListInvoicesParams): Promise<{ items: InvoiceSummary[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiSuccessBody<InvoiceSummary[]>>("/billing/invoices", { params });
    return { items: response.data.data, meta: response.data.meta! };
  },

  async detail(id: string): Promise<InvoiceDetail> {
    const response = await apiClient.get<ApiSuccessBody<InvoiceDetail>>(`/billing/invoices/${id}`);
    return response.data.data;
  },

  async close(id: string): Promise<InvoiceSummary> {
    const response = await apiClient.post<ApiSuccessBody<InvoiceSummary>>(`/billing/invoices/${id}/close`);
    return response.data.data;
  },

  async createPayment(invoiceId: string, payments: PaymentLineInput[]): Promise<InvoiceSummary> {
    const response = await apiClient.post<ApiSuccessBody<InvoiceSummary>>("/billing/payments", { invoiceId, payments });
    return response.data.data;
  },
};
