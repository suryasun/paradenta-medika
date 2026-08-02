import { Invoice, InvoiceItem, Payment } from '@prisma/client';
import {
  InvoiceDetailResponseDto,
  InvoiceItemResponseDto,
  InvoiceSummaryResponseDto,
  PaymentResponseDto,
} from '../dtos/InvoiceResponseDto';

export function toInvoiceSummaryResponse(invoice: Invoice): InvoiceSummaryResponseDto {
  const grandTotal = Number(invoice.grandTotal);
  const paidAmount = Number(invoice.paidAmount);
  return {
    id: invoice.id,
    invoiceNo: invoice.invoiceNo,
    visitId: invoice.visitId,
    patientId: invoice.patientId,
    branchId: invoice.branchId,
    invoiceDate: invoice.invoiceDate.toISOString(),
    subtotal: Number(invoice.subtotal),
    discount: Number(invoice.discount),
    tax: Number(invoice.tax),
    grandTotal,
    paidAmount,
    outstanding: grandTotal - paidAmount,
    status: invoice.status,
  };
}

function toInvoiceItemResponse(item: InvoiceItem): InvoiceItemResponseDto {
  return {
    id: item.id,
    referenceType: item.referenceType,
    referenceId: item.referenceId,
    itemName: item.itemName,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    discount: Number(item.discount),
    tax: Number(item.tax),
    total: Number(item.total),
  };
}

function toPaymentResponse(payment: Payment): PaymentResponseDto {
  return {
    id: payment.id,
    paymentMethodId: payment.paymentMethodId,
    amount: Number(payment.amount),
    paymentDate: payment.paymentDate.toISOString(),
    referenceNo: payment.referenceNo,
    receivedBy: payment.receivedBy,
  };
}

export function toInvoiceDetailResponse(invoice: Invoice, items: InvoiceItem[], payments: Payment[]): InvoiceDetailResponseDto {
  return {
    ...toInvoiceSummaryResponse(invoice),
    items: items.map(toInvoiceItemResponse),
    payments: payments.map(toPaymentResponse),
  };
}
