// Mirrors apps/backend/src/modules/billing/application/dtos/InvoiceResponseDto.ts
export interface InvoiceSummary {
  id: string;
  invoiceNo: string;
  visitId: string;
  patientId: string;
  branchId: string;
  invoiceDate: string;
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  paidAmount: number;
  outstanding: number;
  status: "UNPAID" | "PARTIALLY_PAID" | "PAID" | "CLOSED" | "CANCELLED" | "VOID";
  // docs/06-tasks/task-322.md
  discountReason: string | null;
  discountSource: string | null;
  discountApprovedBy: string | null;
  // docs/06-tasks/task-324.md
  cancelReason: string | null;
  cancelledBy: string | null;
  cancelledAt: string | null;
  // docs/06-tasks/task-325.md
  voidReason: string | null;
  voidedBy: string | null;
  voidedAt: string | null;
}

export interface InvoiceItem {
  id: string;
  referenceType: string;
  referenceId: string | null;
  itemName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
  // docs/06-tasks/task-323.md
  reason: string | null;
}

export interface Payment {
  id: string;
  paymentMethodId: string;
  amount: number;
  paymentDate: string;
  referenceNo: string | null;
  receivedBy: string | null;
  // docs/06-tasks/task-326.md
  refundedAmount: number;
  // docs/06-tasks/task-332.md, docs/adr/ADR-001-insurance-coverage-model.md
  payerType: string;
  insuranceProviderId: string | null;
  policyNumber: string | null;
}

export interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  reason: string;
  approvedBy: string | null;
  createdAt: string;
}

export interface InvoiceDetail extends InvoiceSummary {
  items: InvoiceItem[];
  payments: Payment[];
  refunds: Refund[];
}

export interface PaymentLineInput {
  paymentMethodId: string;
  amount: number;
  referenceNo?: string;
  note?: string;
  // docs/06-tasks/task-332.md, docs/adr/ADR-001-insurance-coverage-model.md
  payerType?: "PATIENT" | "INSURANCE";
  insuranceProviderId?: string;
  policyNumber?: string;
}

export interface ListInvoicesParams {
  page?: number;
  limit?: number;
  status?: string;
  patientId?: string;
  branchId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// docs/06-tasks/task-322.md
export type DiscountSource = "DOCTOR" | "PROMOTION" | "MEMBERSHIP" | "MANUAL";
export const DISCOUNT_SOURCES: DiscountSource[] = ["DOCTOR", "PROMOTION", "MEMBERSHIP", "MANUAL"];

export interface ApplyDiscountInput {
  amount: number;
  source: DiscountSource;
  reason: string;
}

// docs/06-tasks/task-323.md
export interface AddManualChargeInput {
  itemName: string;
  amount: number;
  reason: string;
}

// docs/06-tasks/task-326.md
export interface RefundPaymentInput {
  amount: number;
  reason: string;
}
