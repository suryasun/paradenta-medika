import { PatientNotFoundException } from '../../domain/exceptions/PatientExceptions';
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { PatientDetailResponseDto } from '../dtos/PatientResponseDto';
import { toPatientDetailResponse } from '../mappers/PatientMapper';

export class GetPatientUseCase {
  constructor(private readonly patientRepository: IPatientRepository) {}

  async execute(id: string): Promise<PatientDetailResponseDto> {
    const patient = await this.patientRepository.findById(id);
    if (!patient) {
      throw new PatientNotFoundException();
    }
    return toPatientDetailResponse(patient);
  }
}
