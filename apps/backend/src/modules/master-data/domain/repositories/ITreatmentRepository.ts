import { Treatment } from '@prisma/client';
import { IMasterDataRepository } from './IMasterDataRepository';

export interface CreateTreatmentInput {
  treatmentCode: string;
  treatmentName: string;
  treatmentCategoryId: string;
  durationMinute?: number;
  defaultPrice: number;
  doctorFee?: number;
}

export type UpdateTreatmentInput = Partial<CreateTreatmentInput> & { isActive?: boolean };

export interface ITreatmentRepository extends IMasterDataRepository<Treatment, CreateTreatmentInput, UpdateTreatmentInput> {
  findByCode(treatmentCode: string): Promise<Treatment | null>;
}
