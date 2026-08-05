import { ReferralSource } from '@prisma/client';

// task-287 (Epic PE4): read-only lookup catalog -- no Create/Update/
// Delete use case exists at launch (seeded reference data only).
export interface IReferralSourceRepository {
  list(): Promise<ReferralSource[]>;
  // Consumed by Patient's CreatePatientUseCase/UpdatePatientUseCase to
  // validate a submitted referralSourceId (module boundary honored --
  // Patient never queries `referral_sources` directly).
  findById(id: string): Promise<ReferralSource | null>;
}
