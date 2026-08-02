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
}

export type UpdateBranchInput = Partial<CreateBranchInput> & { isActive?: boolean };

export interface IBranchRepository extends IMasterDataRepository<Branch, CreateBranchInput, UpdateBranchInput> {
  findByCode(branchCode: string): Promise<Branch | null>;
}
