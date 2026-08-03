import { Expense, FinanceExpenseStatus } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

export interface CreateExpenseInput {
  expenseNo: string;
  branchId: string;
  expenseDate: Date;
  category: string;
  expenseAccountId: string;
  amount: number;
  payeeName?: string;
  description?: string;
  evidenceUrl?: string;
  createdBy: string;
}

export interface UpdateExpenseInput {
  expenseDate?: Date;
  category?: string;
  expenseAccountId?: string;
  amount?: number;
  payeeName?: string;
  description?: string;
  evidenceUrl?: string;
  updatedBy: string;
}

export interface ExpenseListFilter {
  branchId?: string;
  category?: string;
  status?: FinanceExpenseStatus;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface IExpenseRepository {
  create(input: CreateExpenseInput): Promise<Expense>;
  list(query: ListQueryDto, filter: ExpenseListFilter): Promise<PagedResult<Expense>>;
  findById(id: string): Promise<Expense | null>;
  update(id: string, input: UpdateExpenseInput): Promise<Expense>;
  updateStatus(
    id: string,
    status: FinanceExpenseStatus,
    fields: {
      submittedAt?: Date;
      approvedBy?: string;
      approvedAt?: Date;
      approvedAmount?: number;
      rejectedBy?: string;
      rejectedAt?: Date;
      rejectionReason?: string;
      paidBy?: string;
      paidAt?: Date;
      paidAmount?: number;
      paymentJournalId?: string;
    },
  ): Promise<Expense>;
  count(): Promise<number>;
  findByNumber(expenseNo: string): Promise<Expense | null>;
}
