import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody, PaginationMeta } from "@/types/api";
import {
  AddManualChargeInput,
  ApplyDiscountInput,
  InvoiceDetail,
  InvoiceSummary,
  ListInvoicesParams,
  PaymentLineInput,
  RefundPaymentInput,
} from "../types/billing.types";

// docs/06-tasks/task-054.md..task-058.md, task-322.md..task-326.md
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

  // docs/06-tasks/task-322.md
  async applyDiscount(id: string, payload: ApplyDiscountInput): Promise<InvoiceSummary> {
    const response = await apiClient.post<ApiSuccessBody<InvoiceSummary>>(`/billing/invoices/${id}/discount`, payload);
    return response.data.data;
  },

  async removeDiscount(id: string): Promise<InvoiceSummary> {
    const response = await apiClient.delete<ApiSuccessBody<InvoiceSummary>>(`/billing/invoices/${id}/discount`);
    return response.data.data;
  },

  // docs/06-tasks/task-323.md
  async addManualCharge(id: string, payload: AddManualChargeInput): Promise<InvoiceSummary> {
    const response = await apiClient.post<ApiSuccessBody<InvoiceSummary>>(`/billing/invoices/${id}/items`, payload);
    return response.data.data;
  },

  // docs/06-tasks/task-324.md
  async cancel(id: string, reason: string): Promise<InvoiceSummary> {
    const response = await apiClient.post<ApiSuccessBody<InvoiceSummary>>(`/billing/invoices/${id}/cancel`, { reason });
    return response.data.data;
  },

  // docs/06-tasks/task-325.md
  async void(id: string, reason: string): Promise<InvoiceSummary> {
    const response = await apiClient.post<ApiSuccessBody<InvoiceSummary>>(`/billing/invoices/${id}/void`, { reason });
    return response.data.data;
  },

  // docs/06-tasks/task-326.md
  async refundPayment(paymentId: string, payload: RefundPaymentInput): Promise<InvoiceSummary> {
    const response = await apiClient.post<ApiSuccessBody<InvoiceSummary>>(`/billing/payments/${paymentId}/refund`, payload);
    return response.data.data;
  },
};
