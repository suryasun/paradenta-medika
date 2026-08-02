import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { ValidationException } from '../../../../shared/http/exceptions';
import { VisitNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { IVisitDiagnosisRepository } from '../../domain/repositories/IVisitDiagnosisRepository';
import { IVisitRepository } from '../../domain/repositories/IVisitRepository';
import { assertVisitOpen } from '../services/assertVisitOpen';
import { DiagnosisResponseDto } from '../dtos/VisitResponseDto';

export interface DiagnosisEntryInput {
  diagnosisType: 'PRIMARY' | 'SECONDARY' | 'DIFFERENTIAL';
  diagnosisName: string;
  notes?: string;
}

export interface RecordDiagnosisInput {
  visitId: string;
  diagnoses: DiagnosisEntryInput[];
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

const VALID_DIAGNOSIS_TYPES = ['PRIMARY', 'SECONDARY', 'DIFFERENTIAL'];

/**
 * docs/06-tasks/task-051.md + docs/03-sad/15-module-emr.md Section 21:
 * "Minimal satu Primary Diagnosis." Diagnosis Reference master data does
 * not exist in Phase 1 (see schema.prisma VisitDiagnosis note) -- entries
 * are recorded as free text rather than a catalog reference.
 */
export class RecordDiagnosisUseCase {
  constructor(
    private readonly visitRepository: IVisitRepository,
    private readonly diagnosisRepository: IVisitDiagnosisRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: RecordDiagnosisInput): Promise<DiagnosisResponseDto[]> {
    const visit = await this.visitRepository.findById(input.visitId);
    if (!visit) {
      throw new VisitNotFoundException();
    }
    assertVisitOpen(visit);

    const shapeErrors = input.diagnoses.flatMap((entry, index) => {
      const errors: Array<{ field: string; message: string }> = [];
      if (!VALID_DIAGNOSIS_TYPES.includes(entry.diagnosisType)) {
        errors.push({ field: `diagnoses[${index}].diagnosisType`, message: 'diagnosisType must be PRIMARY, SECONDARY, or DIFFERENTIAL' });
      }
      if (typeof entry.diagnosisName !== 'string' || entry.diagnosisName.trim().length === 0) {
        errors.push({ field: `diagnoses[${index}].diagnosisName`, message: 'diagnosisName is required' });
      }
      return errors;
    });
    if (shapeErrors.length > 0) {
      throw new ValidationException(shapeErrors);
    }

    if (!input.diagnoses.some((d) => d.diagnosisType === 'PRIMARY')) {
      throw new ValidationException([{ field: 'diagnoses', message: 'At least one Primary Diagnosis is required' }]);
    }

    const created = await this.diagnosisRepository.createMany(
      input.diagnoses.map((d) => ({
        visitId: input.visitId,
        diagnosisType: d.diagnosisType,
        diagnosisName: d.diagnosisName,
        notes: d.notes,
        createdBy: input.actorUserId,
      })),
    );

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('VisitDiagnosis', input.visitId, 'CREATE', null, { count: input.diagnoses.length }, auditContext);

    return created.map((d) => ({ id: d.id, diagnosisType: d.diagnosisType, diagnosisName: d.diagnosisName, notes: d.notes }));
  }
}
