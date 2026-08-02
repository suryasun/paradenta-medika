import { ConsentNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { IConsentRepository } from '../../domain/repositories/IConsentRepository';
import { ConsentResponseDto } from '../dtos/ConsentResponseDto';
import { toConsentResponseDto } from '../mappers/ConsentMapper';

export class GetConsentUseCase {
  constructor(private readonly consentRepository: IConsentRepository) {}

  async execute(id: string): Promise<ConsentResponseDto> {
    const consent = await this.consentRepository.findById(id);
    if (!consent) {
      throw new ConsentNotFoundException();
    }
    return toConsentResponseDto(consent);
  }
}
