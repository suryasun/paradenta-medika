import { Treatment } from '@prisma/client';
import { IMasterDataRepository } from './IMasterDataRepository';

export interface CreateTreatmentInput {
  treatmentCode: string;
  treatmentName: string;
  treatmentCategoryId: string;
  durationMinute?: number;
  defaultPrice: number;
  doctorFee?: number;
  // Phase 4 hardening: omitted (or explicitly null) creates the existing
  // clinic-wide/global row every pre-Phase-4 caller already gets; a real
  // branchId creates a branch-specific override -- see the Treatment
  // Prisma model's own comment for the full design.
  branchId?: string | null;
}

export type UpdateTreatmentInput = Partial<CreateTreatmentInput> & { isActive?: boolean };

export interface ITreatmentRepository extends IMasterDataRepository<Treatment, CreateTreatmentInput, UpdateTreatmentInput> {
  findByCode(treatmentCode: string): Promise<Treatment | null>;
  /** Phase 4 hardening: the branch-specific override if one exists, else the clinic-wide global row (branchId IS NULL), else null. */
  findByCodeForBranch(treatmentCode: string, branchId: string): Promise<Treatment | null>;
  /** Phase 4 hardening: exact-scope existence check (branchId IS NULL vs a specific branchId are different scopes) used to enforce "at most one row per scope+code" at the application layer. */
  existsForBranch(treatmentCode: string, branchId: string | null): Promise<boolean>;
}
