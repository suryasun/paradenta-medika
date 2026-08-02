import { ConsentTemplate, ConsentCategory } from '@prisma/client';
import { IMasterDataRepository } from '../../../master-data/domain/repositories/IMasterDataRepository';

export interface CreateConsentTemplateInput {
  category: ConsentCategory;
  title: string;
  body: string;
}

export type UpdateConsentTemplateInput = Partial<CreateConsentTemplateInput> & { isActive?: boolean };

export interface IConsentTemplateRepository
  extends IMasterDataRepository<ConsentTemplate, CreateConsentTemplateInput, UpdateConsentTemplateInput> {}
