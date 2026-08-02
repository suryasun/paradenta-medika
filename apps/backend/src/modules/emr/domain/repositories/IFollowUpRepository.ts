import { FollowUp, TreatmentPlanPriority } from '@prisma/client';

export interface CreateFollowUpInput {
  visitId: string;
  patientId: string;
  followUpDate: Date;
  note?: string;
  priority?: TreatmentPlanPriority;
  reservationId?: string;
  createdBy: string;
}

export interface IFollowUpRepository {
  create(input: CreateFollowUpInput): Promise<FollowUp>;
  findByVisitId(visitId: string): Promise<FollowUp[]>;
}
