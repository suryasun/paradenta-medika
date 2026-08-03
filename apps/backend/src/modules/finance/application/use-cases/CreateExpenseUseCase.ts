import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { AccountNotPostableException } from '../../domain/exceptions/FinanceExceptions';
import { IAccountRepository } from '../../domain/repositories/IAccountRepository';
import { IExpenseRepository } from '../../domain/repositories/IExpenseRepository';
import { ExpenseNumberGenerator } from '../services/ExpenseNumberGenerator';
import { ExpenseResponseDto } from '../dtos/ExpenseResponseDto';
import { toExpenseResponseDto } from '../mappers/ExpenseMapper';

export interface CreateExpenseInput {
  branchId: string;
  expenseDate: string;
  category: string;
  expenseAccountId: string;
  amount: number;
  payeeName?: string;
  description?: string;
  evidenceUrl?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-156.md/task-157.md; docs/03-sad/17-module-finance.md UC-FIN-003 step 1. Creates a draft expense; the expense account must be active and postable. */
export class CreateExpenseUseCase {
  constructor(
    private readonly expenseRepository: IExpenseRepository,
    private readonly accountRepository: IAccountRepository,
    private readonly numberGenerator: ExpenseNumberGenerator,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: CreateExpenseInput): Promise<ExpenseResponseDto> {
    const account = await this.accountRepository.findById(input.expenseAccountId);
    if (!account || !account.isPostable || !account.isActive) {
      throw new AccountNotPostableException();
    }

    const expenseDate = new Date(input.expenseDate);
    const expenseNo = await this.numberGenerator.generate(expenseDate);
    const expense = await this.expenseRepository.create({
      expenseNo,
      branchId: input.branchId,
      expenseDate,
      category: input.category,
      expenseAccountId: input.expenseAccountId,
      amount: input.amount,
      payeeName: input.payeeName,
      description: input.description,
      evidenceUrl: input.evidenceUrl,
      createdBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Expense',
      expense.id,
      'CREATE',
      null,
      { expenseNo, category: input.category, amount: input.amount },
      auditContext,
    );

    return toExpenseResponseDto(expense);
  }
}
