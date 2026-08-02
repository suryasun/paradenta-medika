import { IConsentRepository } from '../../domain/repositories/IConsentRepository';
import { ConsentResponseDto } from '../dtos/ConsentResponseDto';
import { toConsentResponseDto } from '../mappers/ConsentMapper';

/** docs/06-tasks/task-087.md: "all consents for a patient, signed and unsigned, in chronological order." */
export class ListPatientConsentsUseCase {
  constructor(private readonly consentRepository: IConsentRepository) {}

  async execute(patientId: string): Promise<ConsentResponseDto[]> {
    const consents = await this.consentRepository.findByPatientId(patientId);
    return consents.map(toConsentResponseDto);
  }
}
