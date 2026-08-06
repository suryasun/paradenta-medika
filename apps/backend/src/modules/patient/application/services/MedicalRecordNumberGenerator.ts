import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { IBranchRepository } from '../../../master-data/domain/repositories/IBranchRepository';
import { BranchMrnPrefixNotConfiguredException } from '../../domain/exceptions/PatientExceptions';

const MAX_ATTEMPTS = 5;
const SEQUENCE_DIGITS = 3;

/**
 * MRN scheme hardening: docs/03-sad/03-clean-architecture.md Section 41.3
 * ("Generate Medical Record Number" step) leaves the exact format
 * undefined beyond the example "MRN000001" -- per explicit direction,
 * this now builds a branch-prefixed, monthly-reset sequence:
 * `{branch.mrnPrefix}{YY}{MM}{seq}` (seq zero-padded to 3 digits,
 * e.g. "KM2608001" -- caps out at 999 registrations per branch per month,
 * see MAX_ATTEMPTS's re-check loop below for the overflow-collision case),
 * scoped and reset per calendar month per branch via
 * IPatientRepository.countRegisteredInBranchForPeriod. A branch with no
 * mrnPrefix configured is rejected explicitly
 * (BranchMrnPrefixNotConfiguredException), never silently defaulted.
 *
 * `IBranchRepository` (master-data module) is a sanctioned cross-module
 * channel per docs/04-ai-contract/07-module-contract.md MOD-003 -- the same
 * precedent CreatePatientUseCase already uses for IReferralSourceRepository.
 */
export class MedicalRecordNumberGenerator {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly branchRepository: IBranchRepository,
  ) {}

  async generate(branchId: string): Promise<string> {
    const branch = await this.branchRepository.findById(branchId);
    if (!branch?.mrnPrefix) {
      throw new BranchMrnPrefixNotConfiguredException(branchId);
    }

    const now = new Date();
    const yy = String(now.getUTCFullYear()).slice(-2);
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    const baseCount = await this.patientRepository.countRegisteredInBranchForPeriod(branchId, monthStart, monthEnd);

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const sequence = String(baseCount + 1 + attempt).padStart(SEQUENCE_DIGITS, '0');
      const candidate = `${branch.mrnPrefix}${yy}${mm}${sequence}`;
      const existing = await this.patientRepository.findByMRN(candidate);
      if (!existing) {
        return candidate;
      }
    }

    throw new Error('Unable to generate a unique Medical Record Number');
  }
}
