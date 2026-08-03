import { Expense, FinanceExpenseStatus, Prisma } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import { CreateExpenseInput, ExpenseListFilter, IExpenseRepository, UpdateExpenseInput } from '../../domain/repositories/IExpenseRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'expenseDate', 'expenseNo'] as const;

export class ExpenseRepository implements IExpenseRepository {
  async create(input: CreateExpenseInput): Promise<Expense> {
    return prisma.expense.create({
      data: {
        expenseNo: input.expenseNo,
        branchId: input.branchId,
        expenseDate: input.expenseDate,
        category: input.category,
        expenseAccountId: input.expenseAccountId,
        amount: input.amount,
        payeeName: input.payeeName,
        description: input.description,
        evidenceUrl: input.evidenceUrl,
        createdBy: input.createdBy,
      },
    });
  }

  async list(query: ListQueryDto, filter: ExpenseListFilter): Promise<PagedResult<Expense>> {
    const where: Prisma.ExpenseWhereInput = {
      branchId: filter.branchId,
      category: filter.category,
      status: filter.status,
      expenseDate: filter.dateFrom || filter.dateTo ? { gte: filter.dateFrom, lte: filter.dateTo } : undefined,
    };
    const [items, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.expense.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<Expense | null> {
    return prisma.expense.findUnique({ where: { id } });
  }

  async update(id: string, input: UpdateExpenseInput): Promise<Expense> {
    return prisma.expense.update({
      where: { id },
      data: {
        expenseDate: input.expenseDate,
        category: input.category,
        expenseAccountId: input.expenseAccountId,
        amount: input.amount,
        payeeName: input.payeeName,
        description: input.description,
        evidenceUrl: input.evidenceUrl,
        updatedBy: input.updatedBy,
      },
    });
  }

  async updateStatus(
    id: string,
    status: FinanceExpenseStatus,
    fields: Partial<{
      submittedAt: Date;
      approvedBy: string;
      approvedAt: Date;
      approvedAmount: number;
      rejectedBy: string;
      rejectedAt: Date;
      rejectionReason: string;
      paidBy: string;
      paidAt: Date;
      paidAmount: number;
      paymentJournalId: string;
    }>,
  ): Promise<Expense> {
    return prisma.expense.update({ where: { id }, data: { status, ...fields } });
  }

  async count(): Promise<number> {
    return prisma.expense.count();
  }

  async findByNumber(expenseNo: string): Promise<Expense | null> {
    return prisma.expense.findUnique({ where: { expenseNo } });
  }
}
