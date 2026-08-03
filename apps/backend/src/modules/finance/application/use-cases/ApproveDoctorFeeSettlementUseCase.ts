import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import {
  DoctorFeeSettlementNotFoundException,
  DoctorFeeSettlementNotInStatusException,
  SettlementSegregationOfDutiesException,
} from '../../domain/exceptions/FinanceExceptions';
import { IDoctorFeeSettlementRepository } from '../../domain/repositories/IDoctorFeeSettlementRepository';
import { DoctorFeeSettlementResponseDto } from '../dtos/DoctorFeeSettlementResponseDto';
import { toDoctorFeeSettlementResponseDto } from '../mappers/DoctorFeeSettlementMapper';

export interface ApproveDoctorFeeSettlementInput {
  settlementId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-167.md: maker-checker, the same pattern as Journal/Expense approval. */
export class ApproveDoctorFeeSettlementUseCase {
  constructor(
    private readonly settlementRepository: IDoctorFeeSettlementRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: ApproveDoctorFeeSettlementInput): Promise<DoctorFeeSettlementResponseDto> {
    const existing = await this.settlementRepository.findById(input.settlementId);
    if (!existing) {
      throw new DoctorFeeSettlementNotFoundException();
    }
    if (existing.status !== 'DRAFT') {
      throw new DoctorFeeSettlementNotInStatusException('DRAFT');
    }
    if (existing.createdBy && existing.createdBy === input.actorUserId) {
      throw new SettlementSegregationOfDutiesException();
    }

    const approved = await this.settlementRepository.approve(input.settlementId, input.actorUserId, new Date());

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'DoctorFeeSettlement',
      input.settlementId,
      'UPDATE',
      { status: 'DRAFT' },
      { status: 'APPROVED', approvedBy: input.actorUserId },
      auditContext,
    );

    return toDoctorFeeSettlementResponseDto(approved);
  }
}
