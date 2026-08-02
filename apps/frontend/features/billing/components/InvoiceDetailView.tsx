"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/utils/currency";
import { useInvoice } from "../hooks/useInvoice";
import { useCloseInvoice } from "../hooks/useInvoiceMutations";
import { INVOICE_STATUS_TONE } from "./InvoiceListView";
import { CreatePaymentModal } from "./CreatePaymentModal";

export function InvoiceDetailView({ invoiceId }: { invoiceId: string }) {
  const { data: invoice, isLoading, isError, error, refetch } = useInvoice(invoiceId);
  const closeInvoice = useCloseInvoice(invoiceId);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  if (isLoading) return <LoadingState label="Loading invoice..." />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;
  if (!invoice) return null;

  const canPay = invoice.status === "UNPAID" || invoice.status === "PARTIALLY_PAID";
  const canClose = invoice.status === "PAID";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground">{invoice.invoiceNo}</h1>
          <Badge tone={INVOICE_STATUS_TONE[invoice.status]}>{invoice.status}</Badge>
        </div>
        <div className="flex gap-2">
          {canPay && (
            <PermissionGuard permission="billing.payment.create">
              <Button onClick={() => setShowPaymentModal(true)}>Record Payment</Button>
            </PermissionGuard>
          )}
          {canClose && (
            <PermissionGuard permission="billing.invoice.close">
              <Button variant="secondary" isLoading={closeInvoice.isPending} onClick={() => closeInvoice.mutate()}>
                Close Invoice
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

      <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-surface p-4 sm:grid-cols-4">
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Subtotal</span>
          <p className="text-sm text-foreground">{formatCurrency(invoice.subtotal)}</p>
        </div>
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Grand Total</span>
          <p className="text-sm text-foreground">{formatCurrency(invoice.grandTotal)}</p>
        </div>
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Paid</span>
          <p className="text-sm text-foreground">{formatCurrency(invoice.paidAmount)}</p>
        </div>
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Outstanding</span>
          <p className="text-sm font-semibold text-foreground">{formatCurrency(invoice.outstanding)}</p>
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
                <TableCell>{item.itemName}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                <TableCell>{formatCurrency(item.total)}</TableCell>
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
                <TableHeaderCell>Reference</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoice.payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{new Date(payment.paymentDate).toLocaleString()}</TableCell>
                  <TableCell>{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>{payment.referenceNo ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {showPaymentModal && (
        <CreatePaymentModal invoiceId={invoiceId} outstanding={invoice.outstanding} onClose={() => setShowPaymentModal(false)} />
      )}
    </div>
  );
}
