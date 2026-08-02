import { IMedicalCertificateRepository } from '../../domain/repositories/IMedicalCertificateRepository';
import { MedicalCertificateResponseDto } from '../dtos/MedicalCertificateResponseDto';
import { toMedicalCertificateResponseDto } from '../mappers/MedicalCertificateMapper';

/** docs/06-tasks/task-088.md AC: "stored as a retrievable Attachment" -- this lists the certificate records themselves, chronologically, for a patient. */
export class ListPatientMedicalCertificatesUseCase {
  constructor(private readonly medicalCertificateRepository: IMedicalCertificateRepository) {}

  async execute(patientId: string): Promise<MedicalCertificateResponseDto[]> {
    const certificates = await this.medicalCertificateRepository.findByPatientId(patientId);
    return certificates.map(toMedicalCertificateResponseDto);
  }
}
