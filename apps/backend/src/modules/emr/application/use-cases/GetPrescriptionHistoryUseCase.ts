import { IPrescriptionRepository } from '../../domain/repositories/IPrescriptionRepository';
import { PrescriptionResponseDto } from '../dtos/PrescriptionResponseDto';
import { toPrescriptionResponseDto } from '../mappers/PrescriptionMapper';

/** docs/06-tasks/task-066.md: all prescriptions for a patient in chronological order, permanent. */
export class GetPrescriptionHistoryUseCase {
  constructor(private readonly prescriptionRepository: IPrescriptionRepository) {}

  async execute(patientId: string): Promise<PrescriptionResponseDto[]> {
    const prescriptions = await this.prescriptionRepository.findByPatientId(patientId);
    return prescriptions.map(toPrescriptionResponseDto);
  }
}
