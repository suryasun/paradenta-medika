import { Branch } from '@prisma/client';
import { IMasterDataRepository } from './IMasterDataRepository';

export interface CreateBranchInput {
  clinicId: string;
  branchCode: string;
  branchName: string;
  phone: string;
  email: string;
  address: string;
  timezone?: string;
  // MRN scheme hardening: short, unique prefix used by
  // MedicalRecordNumberGenerator (see the Branch Prisma model's own comment).
  mrnPrefix?: string;
}

export type UpdateBranchInput = Partial<CreateBranchInput> & { isActive?: boolean };

export interface IBranchRepository extends IMasterDataRepository<Branch, CreateBranchInput, UpdateBranchInput> {
  findByCode(branchCode: string): Promise<Branch | null>;
  findByMrnPrefix(mrnPrefix: string): Promise<Branch | null>;
}
