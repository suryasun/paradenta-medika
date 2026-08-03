import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { IVisitTreatmentRepository } from '../../../emr/domain/repositories/IVisitTreatmentRepository';
import { AccountNotPostableException } from '../../domain/exceptions/FinanceExceptions';
import { IAccountRepository } from '../../domain/repositories/IAccountRepository';
import { IDoctorFeeSettlementRepository } from '../../domain/repositories/IDoctorFeeSettlementRepository';
import { DoctorFeeSettlementNumberGenerator } from '../services/DoctorFeeSettlementNumberGenerator';
import { DoctorFeeSettlementResponseDto } from '../dtos/DoctorFeeSettlementResponseDto';
import { toDoctorFeeSettlementResponseDto } from '../mappers/DoctorFeeSettlementMapper';

export interface GenerateDoctorFeeSettlementInput {
  branchId: string;
  doctorId: string;
  periodStart: string;
  periodEnd: string;
  feeAccountId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-166.md; docs/03-sad/17-module-finance.md UC-FIN-006
 * step 1-2. Aggregates unsettled doctor-fee source lines (EMR
 * `VisitTreatment` rows on finalized visits whose `Treatment.doctorFee`
 * is configured) for one doctor/branch/period into a draft settlement.
 * `FIN_SETTLEMENT_SOURCE_USED` is enforced by excluding every
 * `visitTreatmentId` already present in a prior settlement (queried via
 * this module's own `IDoctorFeeSettlementRepository`, not EMR's) before
 * asking EMR for the unsettled set; `DoctorFeeSettlementItem.
 * visitTreatmentId`'s DB-level unique constraint is the backstop against
 * a concurrent double-include.
 */
export class GenerateDoctorFeeSettlementUseCase {
  constructor(
    private readonly settlementRepository: IDoctorFeeSettlementRepository,
    private readonly visitTreatmentRepository: IVisitTreatmentRepository,
    private readonly accountRepository: IAccountRepository,
    private readonly numberGenerator: DoctorFeeSettlementNumberGenerator,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: GenerateDoctorFeeSettlementInput): Promise<DoctorFeeSettlementResponseDto> {
    const feeAccount = await this.accountRepository.findById(input.feeAccountId);
    if (!feeAccount || !feeAccount.isPostable || !feeAccount.isActive) {
      throw new AccountNotPostableException();
    }

    const alreadySettled = await this.settlementRepository.findSettledVisitTreatmentIds(input.doctorId);
    const sources = await this.visitTreatmentRepository.findUnsettledDoctorFeeSources(
      input.doctorId,
      input.branchId,
      new Date(input.periodStart),
      new Date(input.periodEnd),
      alreadySettled,
    );

    const grossAmount = sources.reduce((sum, line) => sum + line.amount, 0);
    const settlementNo = await this.numberGenerator.generate(new Date());
    const settlement = await this.settlementRepository.create({
      settlementNo,
      branchId: input.branchId,
      doctorId: input.doctorId,
      periodStart: new Date(input.periodStart),
      periodEnd: new Date(input.periodEnd),
      feeAccountId: input.feeAccountId,
      grossAmount,
      netAmount: grossAmount,
      items: sources.map((line) => ({ visitTreatmentId: line.visitTreatmentId, amount: line.amount })),
      createdBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'DoctorFeeSettlement',
      settlement.id,
      'CREATE',
      null,
      { settlementNo, doctorId: input.doctorId, grossAmount, lineCount: sources.length },
      auditContext,
    );

    return toDoctorFeeSettlementResponseDto(settlement);
  }
}
