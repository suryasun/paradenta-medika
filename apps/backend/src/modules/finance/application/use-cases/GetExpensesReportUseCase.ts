import { FinanceExpenseStatus } from '@prisma/client';
import { PagedResult } from '../../../../shared/http/pagination';
import { IExpenseRepository } from '../../domain/repositories/IExpenseRepository';
import { ReportDateRangeResolver } from '../services/ReportDateRangeResolver';
import { ExpensesReportQueryDto } from '../dtos/ReportQueryDto';
import { ExpenseResponseDto } from '../dtos/ExpenseResponseDto';
import { toExpenseResponseDto } from '../mappers/ExpenseMapper';

/**
 * docs/06-tasks/task-176.md: "Expense status/category/payee analysis" --
 * Expense's own fields (status, category, payeeName) already match this
 * shape (the same reuse-over-reinvent precedent as Warehouse's
 * GetStockBalanceReportUseCase), so this wraps IExpenseRepository.list
 * with a mandatory branchId and a resolved date range instead of
 * building a separate journal-derived aggregation.
 */
export class GetExpensesReportUseCase {
  constructor(
    private readonly expenseRepository: IExpenseRepository,
    private readonly dateRangeResolver: ReportDateRangeResolver,
  ) {}

  async execute(query: ExpensesReportQueryDto): Promise<PagedResult<ExpenseResponseDto>> {
    const { dateFrom, dateTo } = await this.dateRangeResolver.resolve(query);
    const { items, total } = await this.expenseRepository.list(query, {
      branchId: query.branchId,
      category: query.category,
      status: query.status as FinanceExpenseStatus | undefined,
      dateFrom,
      dateTo,
    });
    return { items: items.map(toExpenseResponseDto), total };
  }
}
