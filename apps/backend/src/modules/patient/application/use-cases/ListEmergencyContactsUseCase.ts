import { PatientEmergencyContact } from '@prisma/client';
import { PatientNotFoundException } from '../../domain/exceptions/PatientExceptions';
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { IPatientEmergencyContactRepository } from '../../domain/repositories/IPatientEmergencyContactRepository';

export class ListEmergencyContactsUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly patientEmergencyContactRepository: IPatientEmergencyContactRepository,
  ) {}

  async execute(patientId: string): Promise<PatientEmergencyContact[]> {
    const patient = await this.patientRepository.findById(patientId);
    if (!patient) {
      throw new PatientNotFoundException();
    }
    return this.patientEmergencyContactRepository.listForPatient(patientId);
  }
}
