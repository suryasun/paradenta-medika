import { MasterDataTemplate } from '@prisma/client';
import { IMasterDataRepository } from './IMasterDataRepository';

export interface CreateMasterDataTemplateInput {
  entityType: string;
  templatePayload: Record<string, unknown>;
  ownerClinicId: string;
}

export interface UpdateMasterDataTemplateInput {
  templatePayload?: Record<string, unknown>;
}

export type IMasterDataTemplateRepository = IMasterDataRepository<
  MasterDataTemplate,
  CreateMasterDataTemplateInput,
  UpdateMasterDataTemplateInput
>;
