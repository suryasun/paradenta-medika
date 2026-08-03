import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { ExpenseNotFoundException, ExpenseNotInStatusException, ExpenseSegregationOfDutiesException } from '../../domain/exceptions/FinanceExceptions';
import { IExpenseRepository } from '../../domain/repositories/IExpenseRepository';
import { ExpenseResponseDto } from '../dtos/ExpenseResponseDto';
import { toExpenseResponseDto } from '../mappers/ExpenseMapper';

export interface ApproveExpenseInput {
  expenseId: string;
  approvedAmount?: number;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-160.md AC: "FIN_SEGREGATION_OF_DUTIES (403) when approver == creator." */
export class ApproveExpenseUseCase {
  constructor(
    private readonly expenseRepository: IExpenseRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: ApproveExpenseInput): Promise<ExpenseResponseDto> {
    const existing = await this.expenseRepository.findById(input.expenseId);
    if (!existing) {
      throw new ExpenseNotFoundException();
    }
    if (existing.status !== 'SUBMITTED') {
      throw new ExpenseNotInStatusException('SUBMITTED');
    }
    if (existing.createdBy && existing.createdBy === input.actorUserId) {
      throw new ExpenseSegregationOfDutiesException();
    }

    const approvedAmount = input.approvedAmount ?? Number(existing.amount);
    const updated = await this.expenseRepository.updateStatus(input.expenseId, 'APPROVED', {
      approvedBy: input.actorUserId,
      approvedAt: new Date(),
      approvedAmount,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Expense',
      input.expenseId,
      'UPDATE',
      { status: 'SUBMITTED' },
      { status: 'APPROVED', approvedBy: input.actorUserId, approvedAmount },
      auditContext,
    );

    return toExpenseResponseDto(updated);
  }
}
