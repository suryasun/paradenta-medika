import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { CashAccountNotFoundException, DailyClosingDuplicateException, DailyClosingVarianceReasonRequiredException } from '../../domain/exceptions/FinanceExceptions';
import { ICashAccountRepository } from '../../domain/repositories/ICashAccountRepository';
import { IDailyClosingRepository } from '../../domain/repositories/IDailyClosingRepository';
import { DenominationEntryDto } from '../dtos/DailyClosingRequestDto';
import { DailyClosingResponseDto } from '../dtos/DailyClosingResponseDto';
import { toDailyClosingResponseDto } from '../mappers/DailyClosingMapper';

export interface CreateDailyClosingInput {
  branchId: string;
  cashAccountId: string;
  cashierId: string;
  closingDate: string;
  countedBalance: number;
  denominations?: DenominationEntryDto[];
  varianceReason?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-163.md/task-164.md; docs/03-sad/17-module-finance.md
 * UC-FIN-005 steps 1-3. `expectedBalance` is read from `CashAccount.
 * currentBalance` at closing time (see the schema comment on
 * `DailyClosing` for why this collapses UC-FIN-005's "approved opening
 * balance and posted cash movements" language). Rejects a duplicate
 * closing for the same scope/date (`FIN_CLOSING_DUPLICATE`) and requires
 * a `varianceReason` whenever counted != expected
 * (`FIN_CLOSING_VARIANCE_REASON_REQUIRED`).
 */
export class CreateDailyClosingUseCase {
  constructor(
    private readonly dailyClosingRepository: IDailyClosingRepository,
    private readonly cashAccountRepository: ICashAccountRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: CreateDailyClosingInput): Promise<DailyClosingResponseDto> {
    const cashAccount = await this.cashAccountRepository.findById(input.cashAccountId);
    if (!cashAccount) {
      throw new CashAccountNotFoundException();
    }

    const closingDate = new Date(input.closingDate);
    const existing = await this.dailyClosingRepository.findExisting(input.branchId, input.cashAccountId, input.cashierId, closingDate);
    if (existing) {
      throw new DailyClosingDuplicateException();
    }

    const expectedBalance = Number(cashAccount.currentBalance);
    const variance = Math.round((input.countedBalance - expectedBalance) * 100) / 100;
    if (variance !== 0 && !input.varianceReason) {
      throw new DailyClosingVarianceReasonRequiredException();
    }

    const closing = await this.dailyClosingRepository.create({
      branchId: input.branchId,
      cashAccountId: input.cashAccountId,
      cashierId: input.cashierId,
      closingDate,
      expectedBalance,
      countedBalance: input.countedBalance,
      variance,
      varianceReason: input.varianceReason,
      denominations: input.denominations,
      createdBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'DailyClosing',
      closing.id,
      'CREATE',
      null,
      { cashAccountId: input.cashAccountId, closingDate: input.closingDate, expectedBalance, countedBalance: input.countedBalance, variance },
      auditContext,
    );

    return toDailyClosingResponseDto(closing);
  }
}
