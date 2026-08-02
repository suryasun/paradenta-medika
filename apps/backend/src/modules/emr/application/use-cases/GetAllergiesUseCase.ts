import { IPatientRepository } from '../../../patient/domain/repositories/IPatientRepository';
import { PatientNotFoundException } from '../../../patient/domain/exceptions/PatientExceptions';
import { IAllergyRepository } from '../../domain/repositories/IAllergyRepository';
import { AllergyResponseDto } from '../dtos/AllergyResponseDto';
import { toAllergyResponseDto } from '../mappers/AllergyMapper';

export class GetAllergiesUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly allergyRepository: IAllergyRepository,
  ) {}

  async execute(patientId: string): Promise<AllergyResponseDto[]> {
    const patient = await this.patientRepository.findById(patientId);
    if (!patient) {
      throw new PatientNotFoundException();
    }

    const entries = await this.allergyRepository.findByPatientId(patientId);
    return entries.map(toAllergyResponseDto);
  }
}
