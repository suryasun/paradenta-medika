import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { ExpenseNotFoundException, ExpenseNotInStatusException } from '../../domain/exceptions/FinanceExceptions';
import { IExpenseRepository } from '../../domain/repositories/IExpenseRepository';
import { ExpenseResponseDto } from '../dtos/ExpenseResponseDto';
import { toExpenseResponseDto } from '../mappers/ExpenseMapper';

export interface SubmitExpenseInput {
  expenseId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-159.md AC: "Only draft expenses can be submitted." */
export class SubmitExpenseUseCase {
  constructor(
    private readonly expenseRepository: IExpenseRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: SubmitExpenseInput): Promise<ExpenseResponseDto> {
    const existing = await this.expenseRepository.findById(input.expenseId);
    if (!existing) {
      throw new ExpenseNotFoundException();
    }
    if (existing.status !== 'DRAFT') {
      throw new ExpenseNotInStatusException('DRAFT');
    }

    const updated = await this.expenseRepository.updateStatus(input.expenseId, 'SUBMITTED', { submittedAt: new Date() });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('Expense', input.expenseId, 'UPDATE', { status: 'DRAFT' }, { status: 'SUBMITTED' }, auditContext);

    return toExpenseResponseDto(updated);
  }
}
