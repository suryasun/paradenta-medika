import { IPatientRepository } from '../../domain/repositories/IPatientRepository';

const MAX_ATTEMPTS = 5;

/**
 * docs/03-sad/03-clean-architecture.md Section 41.3: "Generate Medical
 * Record Number" step. Exact format is NOT DEFINED IN SAD beyond the
 * example "MRN000001" (Section 19.4); a sequential MRN + zero-padded
 * counter is used, with a re-check loop to guard against a race between
 * concurrent registrations.
 */
export class MedicalRecordNumberGenerator {
  constructor(private readonly patientRepository: IPatientRepository) {}

  async generate(): Promise<string> {
    const baseCount = await this.patientRepository.count();

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const candidate = `MRN${String(baseCount + 1 + attempt).padStart(6, '0')}`;
      const existing = await this.patientRepository.findByMRN(candidate);
      if (!existing) {
        return candidate;
      }
    }

    throw new Error('Unable to generate a unique Medical Record Number');
  }
}
