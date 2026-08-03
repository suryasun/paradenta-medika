import { ExpenseNotFoundException } from '../../domain/exceptions/FinanceExceptions';
import { IExpenseRepository } from '../../domain/repositories/IExpenseRepository';
import { ExpenseResponseDto } from '../dtos/ExpenseResponseDto';
import { toExpenseResponseDto } from '../mappers/ExpenseMapper';

export class GetExpenseUseCase {
  constructor(private readonly expenseRepository: IExpenseRepository) {}

  async execute(expenseId: string): Promise<ExpenseResponseDto> {
    const expense = await this.expenseRepository.findById(expenseId);
    if (!expense) {
      throw new ExpenseNotFoundException();
    }
    return toExpenseResponseDto(expense);
  }
}
