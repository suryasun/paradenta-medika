import { IMedicalCertificateRepository } from '../../domain/repositories/IMedicalCertificateRepository';

const MAX_ATTEMPTS = 5;

/**
 * No literal format is specified in docs/03-sad/15-module-emr.md Section 25
 * (only that the number is "auto-generated" and unique). Mirrors
 * ReservationNumberGenerator's established date-prefixed sequential-counter
 * convention for consistency: "MC-YYYYMMDD-0001".
 */
export class CertificateNumberGenerator {
  constructor(private readonly medicalCertificateRepository: IMedicalCertificateRepository) {}

  async generate(issuedAt: Date): Promise<string> {
    const datePart = issuedAt.toISOString().slice(0, 10).replace(/-/g, '');
    const baseCount = await this.medicalCertificateRepository.count();

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const candidate = `MC-${datePart}-${String(baseCount + 1 + attempt).padStart(4, '0')}`;
      const existing = await this.medicalCertificateRepository.findByCertificateNumber(candidate);
      if (!existing) {
        return candidate;
      }
    }

    throw new Error('Unable to generate a unique Certificate Number');
  }
}
