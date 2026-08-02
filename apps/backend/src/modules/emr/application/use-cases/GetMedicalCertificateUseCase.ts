import { MedicalCertificateNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { IMedicalCertificateRepository } from '../../domain/repositories/IMedicalCertificateRepository';
import { MedicalCertificateResponseDto } from '../dtos/MedicalCertificateResponseDto';
import { toMedicalCertificateResponseDto } from '../mappers/MedicalCertificateMapper';

export class GetMedicalCertificateUseCase {
  constructor(private readonly medicalCertificateRepository: IMedicalCertificateRepository) {}

  async execute(id: string): Promise<MedicalCertificateResponseDto> {
    const certificate = await this.medicalCertificateRepository.findById(id);
    if (!certificate) {
      throw new MedicalCertificateNotFoundException();
    }
    return toMedicalCertificateResponseDto(certificate);
  }
}
