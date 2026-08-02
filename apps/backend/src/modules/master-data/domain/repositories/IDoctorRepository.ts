import { Doctor } from '@prisma/client';
import { IMasterDataRepository } from './IMasterDataRepository';

export interface CreateDoctorInput {
  doctorCode: string;
  userId: string;
  branchId: string;
  fullName: string;
  sipNumber?: string;
  strNumber?: string;
  specialization?: string;
  consultationFee?: number;
  joinDate?: string;
  phone?: string;
  email?: string;
}

export type UpdateDoctorInput = Partial<CreateDoctorInput> & { isActive?: boolean };

export interface IDoctorRepository extends IMasterDataRepository<Doctor, CreateDoctorInput, UpdateDoctorInput> {
  findByCode(doctorCode: string): Promise<Doctor | null>;
  findByUserId(userId: string): Promise<Doctor | null>;
}
