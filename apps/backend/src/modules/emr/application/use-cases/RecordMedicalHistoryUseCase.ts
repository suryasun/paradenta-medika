import { MedicalHistoryCategory } from '@prisma/client';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { IPatientRepository } from '../../../patient/domain/repositories/IPatientRepository';
import { PatientNotFoundException } from '../../../patient/domain/exceptions/PatientExceptions';
import { IMedicalHistoryRepository } from '../../domain/repositories/IMedicalHistoryRepository';
import { MedicalHistoryResponseDto } from '../dtos/MedicalHistoryResponseDto';
import { toMedicalHistoryResponseDto } from '../mappers/MedicalHistoryMapper';

export interface RecordMedicalHistoryInput {
  patientId: string;
  visitId?: string;
  category: MedicalHistoryCategory;
  description: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-061.md: "Sistem menyimpan histori perubahan" -- a new
 * entry for the same (patientId, category) does not overwrite the prior
 * one; the prior active row is deactivated (isActive=false) and a new row
 * is inserted, preserving the full change history rather than mutating it.
 */
export class RecordMedicalHistoryUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly medicalHistoryRepository: IMedicalHistoryRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: RecordMedicalHistoryInput): Promise<MedicalHistoryResponseDto> {
    const patient = await this.patientRepository.findById(input.patientId);
    if (!patient) {
      throw new PatientNotFoundException();
    }

    await this.medicalHistoryRepository.deactivateByCategory(input.patientId, input.category);

    const entry = await this.medicalHistoryRepository.create({
      patientId: input.patientId,
      visitId: input.visitId,
      category: input.category,
      description: input.description,
      createdBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'MedicalHistory',
      entry.id,
      'CREATE',
      null,
      { patientId: input.patientId, category: input.category },
      auditContext,
    );

    return toMedicalHistoryResponseDto(entry);
  }
}
