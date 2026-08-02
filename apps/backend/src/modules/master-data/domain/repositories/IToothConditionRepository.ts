import { ToothCondition, ToothConditionCategory } from '@prisma/client';
import { IMasterDataRepository } from './IMasterDataRepository';

export interface CreateToothConditionInput {
  conditionCode: string;
  conditionName: string;
  category: ToothConditionCategory;
  colorCode?: string;
}

export type UpdateToothConditionInput = Partial<CreateToothConditionInput> & { isActive?: boolean };

export interface IToothConditionRepository
  extends IMasterDataRepository<ToothCondition, CreateToothConditionInput, UpdateToothConditionInput> {
  findByCode(conditionCode: string): Promise<ToothCondition | null>;
}
