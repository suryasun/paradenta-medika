import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { FinancialPeriodOverlapException } from '../../domain/exceptions/FinanceExceptions';
import { IFinancialPeriodRepository } from '../../domain/repositories/IFinancialPeriodRepository';
import { FinancialPeriodResponseDto } from '../dtos/FinancialPeriodResponseDto';
import { toFinancialPeriodResponseDto } from '../mappers/FinancialPeriodMapper';

export interface CreatePeriodInput {
  branchId: string;
  periodName: string;
  startDate: string;
  endDate: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-168.md AC: "Periods for a branch cannot overlap." Folded into Epic AC per this phase's documented sequencing (Post Journal's FIN_PERIOD_CLOSED check needs this to exist). */
export class CreatePeriodUseCase {
  constructor(
    private readonly financialPeriodRepository: IFinancialPeriodRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: CreatePeriodInput): Promise<FinancialPeriodResponseDto> {
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    const overlapping = await this.financialPeriodRepository.findOverlapping(input.branchId, startDate, endDate);
    if (overlapping.length > 0) {
      throw new FinancialPeriodOverlapException();
    }

    const period = await this.financialPeriodRepository.create({
      branchId: input.branchId,
      periodName: input.periodName,
      startDate,
      endDate,
      createdBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'FinancialPeriod',
      period.id,
      'CREATE',
      null,
      { branchId: input.branchId, periodName: input.periodName, startDate: input.startDate, endDate: input.endDate },
      auditContext,
    );

    return toFinancialPeriodResponseDto(period);
  }
}
