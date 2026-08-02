import { AllergySeverity, AllergyType } from '@prisma/client';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { IPatientRepository } from '../../../patient/domain/repositories/IPatientRepository';
import { PatientNotFoundException } from '../../../patient/domain/exceptions/PatientExceptions';
import { IAllergyRepository } from '../../domain/repositories/IAllergyRepository';
import { AllergyResponseDto } from '../dtos/AllergyResponseDto';
import { toAllergyResponseDto } from '../mappers/AllergyMapper';

export interface RecordAllergyInput {
  patientId: string;
  visitId?: string;
  type: AllergyType;
  allergen: string;
  severity: AllergySeverity;
  reaction?: string;
  notes?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-062.md: patient-safety-critical -- every allergy entry
 * is audit-logged, and each recorded Drug allergy becomes input to
 * AllergyCheckService (below) which task-065 (Create Prescription) must
 * consult before persisting any prescription.
 */
export class RecordAllergyUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly allergyRepository: IAllergyRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: RecordAllergyInput): Promise<AllergyResponseDto> {
    const patient = await this.patientRepository.findById(input.patientId);
    if (!patient) {
      throw new PatientNotFoundException();
    }

    const entry = await this.allergyRepository.create({
      patientId: input.patientId,
      visitId: input.visitId,
      type: input.type,
      allergen: input.allergen,
      severity: input.severity,
      reaction: input.reaction,
      notes: input.notes,
      createdBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Allergy',
      entry.id,
      'CREATE',
      null,
      { patientId: input.patientId, type: input.type, allergen: input.allergen, severity: input.severity },
      auditContext,
    );

    return toAllergyResponseDto(entry);
  }
}
