"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/utils/currency";
import { useInvoices } from "../hooks/useInvoices";
import { InvoiceSummary, ListInvoicesParams } from "../types/billing.types";

export const INVOICE_STATUS_TONE: Record<InvoiceSummary["status"], "neutral" | "success" | "warning" | "error" | "info"> = {
  UNPAID: "error",
  PARTIALLY_PAID: "warning",
  PAID: "success",
  CLOSED: "neutral",
};

// docs/06-tasks/task-054.md: "Invoice auto-appears in the Cashier's Billing
// queue once generated; no manual creation form needed for the primary
// flow" -- this is a read/action list only, no "New Invoice" button.
export function InvoiceListView() {
  const [filters, setFilters] = useState<ListInvoicesParams>({ page: 1, limit: 20 });
  const { data, isLoading, isError, error, refetch } = useInvoices(filters);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-foreground">Billing</h1>

      <div className="flex flex-wrap gap-3">
        <Select value={filters.status ?? ""} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined, page: 1 }))}>
          <option value="">All statuses</option>
          {Object.keys(INVOICE_STATUS_TONE).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
        <Input
          type="date"
          value={filters.dateFrom ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value || undefined, page: 1 }))}
        />
        <Input
          type="date"
          value={filters.dateTo ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value || undefined, page: 1 }))}
        />
      </div>

      {isLoading && <LoadingState label="Loading invoices..." />}
      {isError && <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />}
      {!isLoading && !isError && data && data.items.length === 0 && (
        <EmptyState title="No invoices found" description="Invoices appear automatically once a Visit is closed." />
      )}
      {!isLoading && !isError && data && data.items.length > 0 && (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Invoice No.</TableHeaderCell>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Grand Total</TableHeaderCell>
              <TableHeaderCell>Outstanding</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.items.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.invoiceNo}</TableCell>
                <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString()}</TableCell>
                <TableCell>{formatCurrency(invoice.grandTotal)}</TableCell>
                <TableCell>{formatCurrency(invoice.outstanding)}</TableCell>
                <TableCell>
                  <Badge tone={INVOICE_STATUS_TONE[invoice.status]}>{invoice.status}</Badge>
                </TableCell>
                <TableCell>
                  <Link href={`/billing/${invoice.id}`} className="text-sm font-medium text-primary hover:underline">
                    View
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {data && <Pagination meta={data.meta} onPageChange={(page) => setFilters((f) => ({ ...f, page }))} />}
    </div>
  );
}
