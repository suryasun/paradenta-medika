import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { AccountNotPostableException, ExpenseNotFoundException, ExpenseNotInStatusException } from '../../domain/exceptions/FinanceExceptions';
import { IAccountRepository } from '../../domain/repositories/IAccountRepository';
import { IExpenseRepository } from '../../domain/repositories/IExpenseRepository';
import { ExpenseResponseDto } from '../dtos/ExpenseResponseDto';
import { toExpenseResponseDto } from '../mappers/ExpenseMapper';

export interface UpdateExpenseInput {
  expenseId: string;
  expenseDate?: string;
  category?: string;
  expenseAccountId?: string;
  amount?: number;
  payeeName?: string;
  description?: string;
  evidenceUrl?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-158.md AC: "Update rejected once submitted/approved/paid (must be draft)." */
export class UpdateExpenseUseCase {
  constructor(
    private readonly expenseRepository: IExpenseRepository,
    private readonly accountRepository: IAccountRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: UpdateExpenseInput): Promise<ExpenseResponseDto> {
    const existing = await this.expenseRepository.findById(input.expenseId);
    if (!existing) {
      throw new ExpenseNotFoundException();
    }
    if (existing.status !== 'DRAFT') {
      throw new ExpenseNotInStatusException('DRAFT');
    }

    if (input.expenseAccountId) {
      const account = await this.accountRepository.findById(input.expenseAccountId);
      if (!account || !account.isPostable || !account.isActive) {
        throw new AccountNotPostableException();
      }
    }

    const updated = await this.expenseRepository.update(input.expenseId, {
      expenseDate: input.expenseDate ? new Date(input.expenseDate) : undefined,
      category: input.category,
      expenseAccountId: input.expenseAccountId,
      amount: input.amount,
      payeeName: input.payeeName,
      description: input.description,
      evidenceUrl: input.evidenceUrl,
      updatedBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('Expense', input.expenseId, 'UPDATE', existing, updated, auditContext);

    return toExpenseResponseDto(updated);
  }
}
