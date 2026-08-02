import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { VisitNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { IVisitRepository } from '../../domain/repositories/IVisitRepository';
import { IVitalSignRepository } from '../../domain/repositories/IVitalSignRepository';
import { assertVisitOpen } from '../services/assertVisitOpen';
import { VitalSignResponseDto } from '../dtos/VisitResponseDto';

export interface RecordVitalSignInput {
  visitId: string;
  bloodPressure?: string;
  heartRate?: number;
  respiratoryRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  oxygenSaturation?: number;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-049.md. */
export class RecordVitalSignUseCase {
  constructor(
    private readonly visitRepository: IVisitRepository,
    private readonly vitalSignRepository: IVitalSignRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: RecordVitalSignInput): Promise<VitalSignResponseDto> {
    const visit = await this.visitRepository.findById(input.visitId);
    if (!visit) {
      throw new VisitNotFoundException();
    }
    assertVisitOpen(visit);

    const vitalSign = await this.vitalSignRepository.create({
      visitId: input.visitId,
      bloodPressure: input.bloodPressure,
      heartRate: input.heartRate,
      respiratoryRate: input.respiratoryRate,
      temperature: input.temperature,
      weight: input.weight,
      height: input.height,
      oxygenSaturation: input.oxygenSaturation,
      recordedBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('VitalSign', vitalSign.id, 'CREATE', null, { visitId: input.visitId }, auditContext);

    return {
      id: vitalSign.id,
      bloodPressure: vitalSign.bloodPressure,
      heartRate: vitalSign.heartRate,
      respiratoryRate: vitalSign.respiratoryRate,
      temperature: vitalSign.temperature ? Number(vitalSign.temperature) : null,
      weight: vitalSign.weight ? Number(vitalSign.weight) : null,
      height: vitalSign.height ? Number(vitalSign.height) : null,
      oxygenSaturation: vitalSign.oxygenSaturation,
      recordedAt: vitalSign.recordedAt.toISOString(),
    };
  }
}
