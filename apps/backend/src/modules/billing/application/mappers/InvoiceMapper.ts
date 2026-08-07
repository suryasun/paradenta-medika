import { Invoice, InvoiceItem, Payment, Refund } from '@prisma/client';
import {
  InvoiceDetailResponseDto,
  InvoiceItemResponseDto,
  InvoiceSummaryResponseDto,
  PaymentResponseDto,
  RefundResponseDto,
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
    discountReason: invoice.discountReason,
    discountSource: invoice.discountSource,
    discountApprovedBy: invoice.discountApprovedBy,
    cancelReason: invoice.cancelReason,
    cancelledBy: invoice.cancelledBy,
    cancelledAt: invoice.cancelledAt ? invoice.cancelledAt.toISOString() : null,
    voidReason: invoice.voidReason,
    voidedBy: invoice.voidedBy,
    voidedAt: invoice.voidedAt ? invoice.voidedAt.toISOString() : null,
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
    reason: item.reason,
  };
}

function toPaymentResponse(payment: Payment, refundedAmount: number): PaymentResponseDto {
  return {
    id: payment.id,
    paymentMethodId: payment.paymentMethodId,
    amount: Number(payment.amount),
    paymentDate: payment.paymentDate.toISOString(),
    referenceNo: payment.referenceNo,
    receivedBy: payment.receivedBy,
    refundedAmount,
    payerType: payment.payerType,
    insuranceProviderId: payment.insuranceProviderId,
    policyNumber: payment.policyNumber,
  };
}

function toRefundResponse(refund: Refund): RefundResponseDto {
  return {
    id: refund.id,
    paymentId: refund.paymentId,
    amount: Number(refund.amount),
    reason: refund.reason,
    approvedBy: refund.approvedBy,
    createdAt: refund.createdAt.toISOString(),
  };
}

export function toInvoiceDetailResponse(
  invoice: Invoice,
  items: InvoiceItem[],
  payments: Payment[],
  refunds: Refund[],
): InvoiceDetailResponseDto {
  const refundedByPaymentId = new Map<string, number>();
  for (const refund of refunds) {
    refundedByPaymentId.set(refund.paymentId, (refundedByPaymentId.get(refund.paymentId) ?? 0) + Number(refund.amount));
  }

  return {
    ...toInvoiceSummaryResponse(invoice),
    items: items.map(toInvoiceItemResponse),
    payments: payments.map((payment) => toPaymentResponse(payment, refundedByPaymentId.get(payment.id) ?? 0)),
    refunds: refunds.map(toRefundResponse),
  };
}
