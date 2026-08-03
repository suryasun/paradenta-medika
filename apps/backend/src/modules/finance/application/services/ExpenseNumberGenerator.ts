import { IExpenseRepository } from '../../domain/repositories/IExpenseRepository';

const MAX_ATTEMPTS = 5;

export class ExpenseNumberGenerator {
  constructor(private readonly expenseRepository: IExpenseRepository) {}

  async generate(date: Date): Promise<string> {
    const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
    const baseCount = await this.expenseRepository.count();

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const candidate = `EXP-${datePart}-${String(baseCount + 1 + attempt).padStart(4, '0')}`;
      const existing = await this.expenseRepository.findByNumber(candidate);
      if (!existing) {
        return candidate;
      }
    }

    throw new Error('Unable to generate a unique Expense Number');
  }
}
