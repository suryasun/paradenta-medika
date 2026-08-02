import { MedicalHistory, MedicalHistoryCategory } from '@prisma/client';

export interface CreateMedicalHistoryInput {
  patientId: string;
  visitId?: string;
  category: MedicalHistoryCategory;
  description: string;
  createdBy: string;
}

export interface IMedicalHistoryRepository {
  create(input: CreateMedicalHistoryInput): Promise<MedicalHistory>;
  deactivateByCategory(patientId: string, category: MedicalHistoryCategory): Promise<void>;
  findActiveByPatientId(patientId: string): Promise<MedicalHistory[]>;
  findAllByPatientId(patientId: string): Promise<MedicalHistory[]>;
}
