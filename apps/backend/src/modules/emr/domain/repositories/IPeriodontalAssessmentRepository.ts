import { PeriodontalAssessment } from '@prisma/client';

export interface CreatePeriodontalAssessmentInput {
  visitId: string;
  patientId: string;
  doctorId: string;
  createdBy: string;
}

export interface IPeriodontalAssessmentRepository {
  create(input: CreatePeriodontalAssessmentInput): Promise<PeriodontalAssessment>;
  findById(id: string): Promise<PeriodontalAssessment | null>;
  findByPatientId(patientId: string): Promise<PeriodontalAssessment[]>;
  lock(id: string, lockedBy: string): Promise<PeriodontalAssessment>;
}
