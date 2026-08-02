import { TreatmentPlanItem, TreatmentPlanPriority } from '@prisma/client';

export interface CreateTreatmentPlanItemInput {
  visitId: string;
  patientId: string;
  treatmentId: string;
  toothNumber?: number;
  surface?: string;
  priority?: TreatmentPlanPriority;
  estimatedCost: number;
  estimatedDurationMinute?: number;
  createdBy: string;
}

export interface ITreatmentPlanRepository {
  createMany(inputs: CreateTreatmentPlanItemInput[]): Promise<TreatmentPlanItem[]>;
  findById(id: string): Promise<TreatmentPlanItem | null>;
  findByVisitId(visitId: string): Promise<TreatmentPlanItem[]>;
  /** docs/06-tasks/task-092.md "open treatment plan items": not yet converted to a Reservation (no linked Reservation via task-064's convert flow). */
  findOpenByPatientId(patientId: string): Promise<TreatmentPlanItem[]>;
}
