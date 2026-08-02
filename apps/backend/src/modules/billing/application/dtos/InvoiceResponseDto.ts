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
}

export interface InvoiceItemResponseDto {
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

export interface PaymentResponseDto {
  id: string;
  paymentMethodId: string;
  amount: number;
  paymentDate: string;
  referenceNo: string | null;
  receivedBy: string | null;
}

export interface InvoiceDetailResponseDto extends InvoiceSummaryResponseDto {
  items: InvoiceItemResponseDto[];
  payments: PaymentResponseDto[];
}

export interface GenerateInvoiceResponseDto {
  invoiceId: string;
  invoiceNumber: string;
}
