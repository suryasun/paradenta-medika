import { FinanceExpenseStatus } from '@prisma/client';
import { PagedResult } from '../../../../shared/http/pagination';
import { IExpenseRepository } from '../../domain/repositories/IExpenseRepository';
import { ListExpenseQueryDto } from '../dtos/ExpenseQueryDto';
import { ExpenseResponseDto } from '../dtos/ExpenseResponseDto';
import { toExpenseResponseDto } from '../mappers/ExpenseMapper';

export class ListExpensesUseCase {
  constructor(private readonly expenseRepository: IExpenseRepository) {}

  async execute(query: ListExpenseQueryDto): Promise<PagedResult<ExpenseResponseDto>> {
    const { items, total } = await this.expenseRepository.list(query, {
      branchId: query.branchId,
      category: query.category,
      status: query.status as FinanceExpenseStatus | undefined,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
    });
    return { items: items.map(toExpenseResponseDto), total };
  }
}
