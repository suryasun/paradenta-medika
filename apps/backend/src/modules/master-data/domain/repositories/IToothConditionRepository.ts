import { ToothCondition, ToothConditionCategory } from '@prisma/client';
import { IMasterDataRepository } from './IMasterDataRepository';

export interface CreateToothConditionInput {
  conditionCode: string;
  conditionName: string;
  category: ToothConditionCategory;
  colorCode?: string;
  // Phase 4 hardening: see ITreatmentRepository's CreateTreatmentInput.branchId comment.
  branchId?: string | null;
}

export type UpdateToothConditionInput = Partial<CreateToothConditionInput> & { isActive?: boolean };

export interface IToothConditionRepository
  extends IMasterDataRepository<ToothCondition, CreateToothConditionInput, UpdateToothConditionInput> {
  findByCode(conditionCode: string): Promise<ToothCondition | null>;
  findByCodeForBranch(conditionCode: string, branchId: string): Promise<ToothCondition | null>;
  existsForBranch(conditionCode: string, branchId: string | null): Promise<boolean>;
}
