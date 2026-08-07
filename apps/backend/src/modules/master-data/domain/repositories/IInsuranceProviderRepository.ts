import { InsuranceProvider } from '@prisma/client';
import { IMasterDataRepository } from './IMasterDataRepository';

// docs/06-tasks/task-332.md, docs/adr/ADR-001-insurance-coverage-model.md
export interface CreateInsuranceProviderInput {
  providerName: string;
}

export type UpdateInsuranceProviderInput = Partial<CreateInsuranceProviderInput> & { isActive?: boolean };

export interface IInsuranceProviderRepository
  extends IMasterDataRepository<InsuranceProvider, CreateInsuranceProviderInput, UpdateInsuranceProviderInput> {}
