export interface InvoiceSummaryResponseDto {
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
  status: string;
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

export interface InvoiceItemResponseDto {
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

export interface PaymentResponseDto {
  id: string;
  paymentMethodId: string;
  amount: number;
  paymentDate: string;
  referenceNo: string | null;
  receivedBy: string | null;
  // docs/06-tasks/task-326.md: sum of this Payment's Refund rows, so the
  // frontend can compute "remaining refundable" without a second call.
  refundedAmount: number;
  // docs/06-tasks/task-332.md, docs/adr/ADR-001-insurance-coverage-model.md
  payerType: string;
  insuranceProviderId: string | null;
  policyNumber: string | null;
}

export interface RefundResponseDto {
  id: string;
  paymentId: string;
  amount: number;
  reason: string;
  approvedBy: string | null;
  createdAt: string;
}

export interface InvoiceDetailResponseDto extends InvoiceSummaryResponseDto {
  items: InvoiceItemResponseDto[];
  payments: PaymentResponseDto[];
  refunds: RefundResponseDto[];
}

export interface GenerateInvoiceResponseDto {
  invoiceId: string;
  invoiceNumber: string;
}
