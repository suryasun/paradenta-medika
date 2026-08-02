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
  status: "UNPAID" | "PARTIALLY_PAID" | "PAID" | "CLOSED";
}

export interface InvoiceItem {
  id: string;
  referenceType: string;
  referenceId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
}

export interface Payment {
  id: string;
  paymentMethodId: string;
  amount: number;
  paymentDate: string;
  referenceNo: string | null;
  receivedBy: string | null;
}

export interface InvoiceDetail extends InvoiceSummary {
  items: InvoiceItem[];
  payments: Payment[];
}

export interface PaymentLineInput {
  paymentMethodId: string;
  amount: number;
  referenceNo?: string;
  note?: string;
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
