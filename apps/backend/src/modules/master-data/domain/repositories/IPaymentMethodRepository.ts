import { PaymentMethod } from '@prisma/client';
import { IMasterDataRepository } from './IMasterDataRepository';

export interface CreatePaymentMethodInput {
  methodCode: string;
  methodName: string;
  isCash?: boolean;
  // Phase 4 hardening: see ITreatmentRepository's CreateTreatmentInput.branchId comment.
  branchId?: string | null;
}

export type UpdatePaymentMethodInput = Partial<CreatePaymentMethodInput> & { isActive?: boolean };

export interface IPaymentMethodRepository
  extends IMasterDataRepository<PaymentMethod, CreatePaymentMethodInput, UpdatePaymentMethodInput> {
  findByCode(methodCode: string): Promise<PaymentMethod | null>;
  findByCodeForBranch(methodCode: string, branchId: string): Promise<PaymentMethod | null>;
  existsForBranch(methodCode: string, branchId: string | null): Promise<boolean>;
}
