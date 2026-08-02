import { VisitTreatment } from '@prisma/client';

export interface CreateVisitTreatmentInput {
  visitId: string;
  treatmentId: string;
  toothReference?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
  createdBy: string;
}

export interface IVisitTreatmentRepository {
  create(input: CreateVisitTreatmentInput): Promise<VisitTreatment>;
  findByVisitId(visitId: string): Promise<VisitTreatment[]>;
  countByVisitId(visitId: string): Promise<number>;
}
