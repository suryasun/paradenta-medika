import { TreatmentCategory } from '@prisma/client';
import { IMasterDataRepository } from './IMasterDataRepository';

export interface CreateTreatmentCategoryInput {
  categoryCode: string;
  categoryName: string;
}

export type UpdateTreatmentCategoryInput = Partial<CreateTreatmentCategoryInput> & { isActive?: boolean };

export interface ITreatmentCategoryRepository
  extends IMasterDataRepository<TreatmentCategory, CreateTreatmentCategoryInput, UpdateTreatmentCategoryInput> {
  findByCode(categoryCode: string): Promise<TreatmentCategory | null>;
}
