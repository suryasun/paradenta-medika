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

export interface IInvoiceRepository {
  create(input: CreateInvoiceInput): Promise<Invoice>;
  findById(id: string): Promise<Invoice | null>;
  findByVisitId(visitId: string): Promise<Invoice | null>;
  findByInvoiceNo(invoiceNo: string): Promise<Invoice | null>;
  list(query: ListInvoiceFilter): Promise<PagedResult<Invoice>>;
  countByInvoiceNoPrefix(prefix: string): Promise<number>;
  updatePayment(id: string, input: UpdateInvoicePaymentInput): Promise<Invoice>;
  close(id: string, updatedBy: string): Promise<Invoice>;
  /** Sum of (grandTotal - paidAmount) across UNPAID/PARTIALLY_PAID invoices for a branch -- docs/03-sad/20-module-report.md Section 4.2 "Outstanding" KPI. */
  sumOutstandingByBranch(branchId: string): Promise<number>;
}
