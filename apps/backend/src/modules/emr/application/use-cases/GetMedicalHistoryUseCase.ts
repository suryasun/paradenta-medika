import { IPatientRepository } from '../../../patient/domain/repositories/IPatientRepository';
import { PatientNotFoundException } from '../../../patient/domain/exceptions/PatientExceptions';
import { IMedicalHistoryRepository } from '../../domain/repositories/IMedicalHistoryRepository';
import { MedicalHistoryResponseDto } from '../dtos/MedicalHistoryResponseDto';
import { toMedicalHistoryResponseDto } from '../mappers/MedicalHistoryMapper';

/**
 * Returns only the currently-active entry per category (the Clinical Alert
 * view). The full change history remains queryable via the repository for
 * a future Clinical Timeline (task-091..094) but is not exposed by this
 * use case, since no task in this epic asks for it.
 */
export class GetMedicalHistoryUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly medicalHistoryRepository: IMedicalHistoryRepository,
  ) {}

  async execute(patientId: string): Promise<MedicalHistoryResponseDto[]> {
    const patient = await this.patientRepository.findById(patientId);
    if (!patient) {
      throw new PatientNotFoundException();
    }

    const entries = await this.medicalHistoryRepository.findActiveByPatientId(patientId);
    return entries.map(toMedicalHistoryResponseDto);
  }
}
