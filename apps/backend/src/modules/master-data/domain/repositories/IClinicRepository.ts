import { Clinic } from '@prisma/client';
import { IMasterDataRepository } from './IMasterDataRepository';

export interface CreateClinicInput {
  clinicCode: string;
  clinicName: string;
  legalName: string;
  taxNumber: string;
  ownerName?: string;
  phone: string;
  email: string;
  address: string;
}

export type UpdateClinicInput = Partial<CreateClinicInput> & { isActive?: boolean };

export interface IClinicRepository extends IMasterDataRepository<Clinic, CreateClinicInput, UpdateClinicInput> {
  findByCode(clinicCode: string): Promise<Clinic | null>;
}
