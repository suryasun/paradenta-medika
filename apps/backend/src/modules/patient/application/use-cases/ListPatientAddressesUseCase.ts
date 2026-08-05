import { PatientNotFoundException } from '../../domain/exceptions/PatientExceptions';
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { IPatientAddressRepository } from '../../domain/repositories/IPatientAddressRepository';
import { PatientAddressMapper } from '../mappers/PatientAddressMapper';
import { PatientAddressResponseDto } from '../dtos/PatientAddressResponseDto';

export class ListPatientAddressesUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly patientAddressRepository: IPatientAddressRepository,
    private readonly mapper: PatientAddressMapper,
  ) {}

  async execute(patientId: string): Promise<PatientAddressResponseDto[]> {
    const patient = await this.patientRepository.findById(patientId);
    if (!patient) {
      throw new PatientNotFoundException();
    }
    const addresses = await this.patientAddressRepository.listForPatient(patientId);
    return this.mapper.toResponseList(addresses);
  }
}
