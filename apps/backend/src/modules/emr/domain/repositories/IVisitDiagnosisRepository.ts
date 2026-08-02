import { VisitDiagnosis } from '@prisma/client';

export interface CreateVisitDiagnosisInput {
  visitId: string;
  diagnosisType: 'PRIMARY' | 'SECONDARY' | 'DIFFERENTIAL';
  diagnosisName: string;
  notes?: string;
  createdBy: string;
}

export interface IVisitDiagnosisRepository {
  createMany(inputs: CreateVisitDiagnosisInput[]): Promise<VisitDiagnosis[]>;
  findByVisitId(visitId: string): Promise<VisitDiagnosis[]>;
}
