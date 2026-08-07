"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { useInsuranceProviders } from "@/features/master-data/hooks/useInsuranceProviders";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/utils/currency";
import { useInvoice } from "../hooks/useInvoice";
import { useCancelInvoice, useCloseInvoice, useRemoveDiscount, useVoidInvoice } from "../hooks/useInvoiceMutations";
import { INVOICE_STATUS_TONE } from "./InvoiceListView";
import { CreatePaymentModal } from "./CreatePaymentModal";
import { ApplyDiscountModal } from "./ApplyDiscountModal";
import { AddManualChargeModal } from "./AddManualChargeModal";
import { InvoiceReasonModal } from "./InvoiceReasonModal";
import { RefundPaymentModal } from "./RefundPaymentModal";

type ModalState =
  | { type: "payment" }
  | { type: "discount" }
  | { type: "manualCharge" }
  | { type: "cancel" }
  | { type: "void" }
  | { type: "refund"; paymentId: string; remainingRefundable: number }
  | null;

export function InvoiceDetailView({ invoiceId }: { invoiceId: string }) {
  const { data: invoice, isLoading, isError, error, refetch } = useInvoice(invoiceId);
  const closeInvoice = useCloseInvoice(invoiceId);
  const removeDiscount = useRemoveDiscount(invoiceId);
  const cancelInvoice = useCancelInvoice(invoiceId);
  const voidInvoice = useVoidInvoice(invoiceId);
  const { data: insuranceProvidersData } = useInsuranceProviders();
  const [modal, setModal] = useState<ModalState>(null);

  if (isLoading) return <LoadingState label="Loading invoice..." />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;
  if (!invoice) return null;

  // docs/06-tasks/task-322.md/task-323.md: Discount and Manual Charge share
  // the same "not yet PAID/CLOSED/CANCELLED/VOID" editability window.
  const canEditItems = invoice.status === "UNPAID" || invoice.status === "PARTIALLY_PAID";
  const canPay = invoice.status === "UNPAID" || invoice.status === "PARTIALLY_PAID";
  const canClose = invoice.status === "PAID";
  // docs/06-tasks/task-324.md: only before any payment has been recorded.
  const canCancel = invoice.status === "UNPAID" && invoice.paidAmount === 0;
  // docs/06-tasks/task-325.md: not from CLOSED/CANCELLED/VOID.
  const canVoid = invoice.status === "UNPAID" || invoice.status === "PARTIALLY_PAID" || invoice.status === "PAID";
  // docs/06-tasks/task-326.md: refund is blocked only once CLOSED.
  const canRefund = invoice.status !== "CLOSED";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground">{invoice.invoiceNo}</h1>
          <Badge tone={INVOICE_STATUS_TONE[invoice.status]}>{invoice.status}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {canPay && (
            <PermissionGuard permission="billing.payment.create">
              <Button onClick={() => setModal({ type: "payment" })}>Record Payment</Button>
            </PermissionGuard>
          )}
          {canClose && (
            <PermissionGuard permission="billing.invoice.close">
              <Button variant="secondary" isLoading={closeInvoice.isPending} onClick={() => closeInvoice.mutate()}>
                Close Invoice
              </Button>
            </PermissionGuard>
          )}
          {canEditItems && (
            <PermissionGuard permission="billing.invoice.discount.apply">
              {invoice.discount > 0 ? (
                <Button variant="secondary" isLoading={removeDiscount.isPending} onClick={() => removeDiscount.mutate()}>
                  Remove Discount
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => setModal({ type: "discount" })}>
                  Apply Discount
                </Button>
              )}
            </PermissionGuard>
          )}
          {canEditItems && (
            <PermissionGuard permission="billing.invoice.manual-charge.add">
              <Button variant="secondary" onClick={() => setModal({ type: "manualCharge" })}>
                Add Manual Charge
              </Button>
            </PermissionGuard>
          )}
          {canCancel && (
            <PermissionGuard permission="billing.invoice.cancel">
              <Button variant="danger" onClick={() => setModal({ type: "cancel" })}>
                Cancel Invoice
              </Button>
            </PermissionGuard>
          )}
          {canVoid && (
            <PermissionGuard permission="billing.invoice.void">
              <Button variant="danger" onClick={() => setModal({ type: "void" })}>
                Void Invoice
              </Button>
            </PermissionGuard>
          )}
        </div>
      </div>

      {closeInvoice.isError && (
        <p role="alert" className="text-sm text-error">
          {getApiErrorMessage(closeInvoice.error)}
        </p>
      )}
      {removeDiscount.isError && (
        <p role="alert" className="text-sm text-error">
          {getApiErrorMessage(removeDiscount.error)}
        </p>
      )}

      {invoice.status === "CANCELLED" && invoice.cancelReason && (
        <p className="rounded-md border border-border bg-[var(--color-error-100)] px-3 py-2 text-sm text-foreground">
          Cancelled: {invoice.cancelReason}
        </p>
      )}
      {invoice.status === "VOID" && invoice.voidReason && (
        <p className="rounded-md border border-border bg-[var(--color-error-100)] px-3 py-2 text-sm text-foreground">
          Voided: {invoice.voidReason}
        </p>
      )}
      {invoice.discount > 0 && invoice.discountReason && (
        <p className="rounded-md border border-border bg-[var(--color-primary-100)] px-3 py-2 text-sm text-foreground">
          Discount applied ({invoice.discountSource}): {invoice.discountReason}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-surface p-4 sm:grid-cols-5">
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Subtotal</span>
          <p className="font-tabular text-sm text-foreground">{formatCurrency(invoice.subtotal)}</p>
        </div>
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Discount</span>
          <p className="font-tabular text-sm text-foreground">{formatCurrency(invoice.discount)}</p>
        </div>
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Grand Total</span>
          <p className="font-tabular text-sm text-foreground">{formatCurrency(invoice.grandTotal)}</p>
        </div>
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Paid</span>
          <p className="font-tabular text-sm text-foreground">{formatCurrency(invoice.paidAmount)}</p>
        </div>
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Outstanding</span>
          <p className="font-tabular text-sm font-semibold text-foreground">{formatCurrency(invoice.outstanding)}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted">Line Items</h2>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Item</TableHeaderCell>
              <TableHeaderCell>Qty</TableHeaderCell>
              <TableHeaderCell>Unit Price</TableHeaderCell>
              <TableHeaderCell>Total</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoice.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {item.itemName}
                  {item.referenceType === "ManualCharge" && (
                    <span className="ml-1.5 rounded bg-[var(--color-secondary-100)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                      Manual
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-tabular">{item.quantity}</TableCell>
                <TableCell className="font-tabular">{formatCurrency(item.unitPrice)}</TableCell>
                <TableCell className="font-tabular">{formatCurrency(item.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {invoice.payments.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-muted">Payments</h2>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Amount</TableHeaderCell>
                <TableHeaderCell>Payer</TableHeaderCell>
                <TableHeaderCell>Refunded</TableHeaderCell>
                <TableHeaderCell>Reference</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoice.payments.map((payment) => {
                const remainingRefundable = payment.amount - payment.refundedAmount;
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="font-tabular">{new Date(payment.paymentDate).toLocaleString()}</TableCell>
                    <TableCell className="font-tabular">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>
                      {payment.payerType === "INSURANCE" ? (
                        <Badge tone="info">
                          {insuranceProvidersData?.items.find((p) => p.id === payment.insuranceProviderId)?.providerName ?? "Insurance"}
                          {payment.policyNumber ? ` (${payment.policyNumber})` : ""}
                        </Badge>
                      ) : (
                        <Badge tone="neutral">Patient</Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-tabular">{formatCurrency(payment.refundedAmount)}</TableCell>
                    <TableCell>{payment.referenceNo ?? "-"}</TableCell>
                    <TableCell>
                      {canRefund && remainingRefundable > 0 && (
                        <PermissionGuard permission="billing.payment.refund">
                          <Button
                            variant="tertiary"
                            onClick={() => setModal({ type: "refund", paymentId: payment.id, remainingRefundable })}
                          >
                            Refund
                          </Button>
                        </PermissionGuard>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {modal?.type === "payment" && (
        <CreatePaymentModal invoiceId={invoiceId} outstanding={invoice.outstanding} onClose={() => setModal(null)} />
      )}
      {modal?.type === "discount" && (
        <ApplyDiscountModal invoiceId={invoiceId} subtotal={invoice.subtotal} onClose={() => setModal(null)} />
      )}
      {modal?.type === "manualCharge" && <AddManualChargeModal invoiceId={invoiceId} onClose={() => setModal(null)} />}
      {modal?.type === "cancel" && (
        <InvoiceReasonModal
          title="Cancel Invoice"
          submitLabel="Confirm Cancel"
          isSubmitting={cancelInvoice.isPending}
          submitError={cancelInvoice.isError ? getApiErrorMessage(cancelInvoice.error) : undefined}
          onClose={() => setModal(null)}
          onSubmit={(reason) => cancelInvoice.mutate(reason, { onSuccess: () => setModal(null) })}
        />
      )}
      {modal?.type === "void" && (
        <InvoiceReasonModal
          title="Void Invoice"
          submitLabel="Confirm Void"
          isSubmitting={voidInvoice.isPending}
          submitError={voidInvoice.isError ? getApiErrorMessage(voidInvoice.error) : undefined}
          onClose={() => setModal(null)}
          onSubmit={(reason) => voidInvoice.mutate(reason, { onSuccess: () => setModal(null) })}
        />
      )}
      {modal?.type === "refund" && (
        <RefundPaymentModal
          invoiceId={invoiceId}
          paymentId={modal.paymentId}
          remainingRefundable={modal.remainingRefundable}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
