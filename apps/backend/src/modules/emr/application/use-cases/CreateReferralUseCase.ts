import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { VisitNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { IVisitRepository } from '../../domain/repositories/IVisitRepository';
import { IReferralRepository } from '../../domain/repositories/IReferralRepository';
import { assertVisitOpen } from '../services/assertVisitOpen';
import { ReferralTargetTypeDto } from '../dtos/CreateReferralRequestDto';
import { ReferralResponseDto } from '../dtos/ReferralResponseDto';
import { toReferralResponseDto } from '../mappers/ReferralMapper';

export interface CreateReferralInput {
  visitId: string;
  targetType: ReferralTargetTypeDto;
  reason: string;
  note?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-089.md: refer the patient to a Specialist/Hospital/Laboratory/Radiology provider. */
export class CreateReferralUseCase {
  constructor(
    private readonly visitRepository: IVisitRepository,
    private readonly referralRepository: IReferralRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: CreateReferralInput): Promise<ReferralResponseDto> {
    const visit = await this.visitRepository.findById(input.visitId);
    if (!visit) {
      throw new VisitNotFoundException();
    }
    assertVisitOpen(visit);

    const referral = await this.referralRepository.create({
      visitId: input.visitId,
      patientId: visit.patientId,
      targetType: input.targetType,
      reason: input.reason,
      note: input.note,
      createdBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Referral',
      referral.id,
      'CREATE',
      null,
      { visitId: input.visitId, targetType: input.targetType },
      auditContext,
    );

    return toReferralResponseDto(referral);
  }
}
