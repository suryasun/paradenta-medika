import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { ExpenseNotFoundException, ExpenseNotInStatusException } from '../../domain/exceptions/FinanceExceptions';
import { IExpenseRepository } from '../../domain/repositories/IExpenseRepository';
import { ExpenseResponseDto } from '../dtos/ExpenseResponseDto';
import { toExpenseResponseDto } from '../mappers/ExpenseMapper';

export interface RejectExpenseInput {
  expenseId: string;
  reason: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-160.md AC: "Reject requires a reason" (enforced by RejectExpenseRequestDto's own @IsString @MinLength(1) validation). */
export class RejectExpenseUseCase {
  constructor(
    private readonly expenseRepository: IExpenseRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: RejectExpenseInput): Promise<ExpenseResponseDto> {
    const existing = await this.expenseRepository.findById(input.expenseId);
    if (!existing) {
      throw new ExpenseNotFoundException();
    }
    if (existing.status !== 'SUBMITTED') {
      throw new ExpenseNotInStatusException('SUBMITTED');
    }

    const updated = await this.expenseRepository.updateStatus(input.expenseId, 'REJECTED', {
      rejectedBy: input.actorUserId,
      rejectedAt: new Date(),
      rejectionReason: input.reason,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Expense',
      input.expenseId,
      'UPDATE',
      { status: 'SUBMITTED' },
      { status: 'REJECTED', reason: input.reason },
      auditContext,
    );

    return toExpenseResponseDto(updated);
  }
}
