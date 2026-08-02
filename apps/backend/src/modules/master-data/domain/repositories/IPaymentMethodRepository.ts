import { PaymentMethod } from '@prisma/client';
import { IMasterDataRepository } from './IMasterDataRepository';

export interface CreatePaymentMethodInput {
  methodCode: string;
  methodName: string;
  isCash?: boolean;
}

export type UpdatePaymentMethodInput = Partial<CreatePaymentMethodInput> & { isActive?: boolean };

export interface IPaymentMethodRepository
  extends IMasterDataRepository<PaymentMethod, CreatePaymentMethodInput, UpdatePaymentMethodInput> {
  findByCode(methodCode: string): Promise<PaymentMethod | null>;
}
