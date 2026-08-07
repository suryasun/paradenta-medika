import { Invoice } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

export interface CreateInvoiceInput {
  invoiceNo: string;
  visitId: string;
  patientId: string;
  branchId: string;
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  createdBy: string;
}

export interface ListInvoiceFilter extends ListQueryDto {
  status?: string;
  patientId?: string;
  branchId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface UpdateInvoicePaymentInput {
  paidAmount: number;
  status: string;
  updatedBy: string;
}

/** docs/06-tasks/task-320.md: recalculated totals after a new Treatment
 * (recorded post-Invoice-generation) is synced in as an additional
 * InvoiceItem -- a narrow sibling to updatePayment/close, not a general
 * Invoice-edit method. */
export interface UpdateInvoiceTotalsInput {
  subtotal: number;
  grandTotal: number;
  updatedBy: string;
}

/** docs/06-tasks/task-322.md: UC-BIL-005 Apply Discount. */
export interface ApplyDiscountInput {
  discount: number;
  grandTotal: number;
  discountReason: string;
  discountSource: string;
  discountApprovedBy: string;
}

/** docs/06-tasks/task-324.md: UC-BIL-014 Cancel Invoice. */
export interface CancelInvoiceInput {
  reason: string;
  cancelledBy: string;
}

/** docs/06-tasks/task-325.md: UC-BIL-015 Void Invoice. */
export interface VoidInvoiceInput {
  reason: string;
  voidedBy: string;
}

export interface IInvoiceRepository {
  create(input: CreateInvoiceInput): Promise<Invoice>;
  findById(id: string): Promise<Invoice | null>;
  findByVisitId(visitId: string): Promise<Invoice | null>;
  findByInvoiceNo(invoiceNo: string): Promise<Invoice | null>;
  list(query: ListInvoiceFilter): Promise<PagedResult<Invoice>>;
  countByInvoiceNoPrefix(prefix: string): Promise<number>;
  updatePayment(id: string, input: UpdateInvoicePaymentInput): Promise<Invoice>;
  updateTotals(id: string, input: UpdateInvoiceTotalsInput): Promise<Invoice>;
  close(id: string, updatedBy: string): Promise<Invoice>;
  /** docs/06-tasks/task-322.md */
  applyDiscount(id: string, input: ApplyDiscountInput): Promise<Invoice>;
  /** docs/06-tasks/task-322.md: clears discount fields, restores grandTotal = subtotal + tax. */
  removeDiscount(id: string, input: { grandTotal: number; updatedBy: string }): Promise<Invoice>;
  /** docs/06-tasks/task-324.md */
  cancel(id: string, input: CancelInvoiceInput): Promise<Invoice>;
  /** docs/06-tasks/task-325.md */
  void(id: string, input: VoidInvoiceInput): Promise<Invoice>;
  /** Sum of (grandTotal - paidAmount) across UNPAID/PARTIALLY_PAID invoices for a branch -- docs/03-sad/20-module-report.md Section 4.2 "Outstanding" KPI. */
  sumOutstandingByBranch(branchId: string): Promise<number>;
}
