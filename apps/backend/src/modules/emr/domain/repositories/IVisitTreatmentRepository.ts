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

export interface DoctorFeeSourceLine {
  visitTreatmentId: string;
  visitId: string;
  treatmentId: string;
  quantity: number;
  doctorFee: number;
  amount: number;
  visitDate: Date;
}

export interface IVisitTreatmentRepository {
  create(input: CreateVisitTreatmentInput): Promise<VisitTreatment>;
  findByVisitId(visitId: string): Promise<VisitTreatment[]>;
  countByVisitId(visitId: string): Promise<number>;
  /**
   * docs/06-tasks/task-166.md (Finance, Epic AE): unsettled doctor-fee
   * source lines for one doctor/branch/period -- treatments on
   * COMPLETED/LOCKED/ARCHIVED visits (finalized clinical work) whose
   * catalog `Treatment.doctorFee` is configured (>0) and whose
   * `visitTreatmentId` isn't in `excludeVisitTreatmentIds` (Finance's own
   * already-settled set, passed in rather than queried here to respect
   * the module boundary -- EMR doesn't know about Finance's settlement
   * table). Cross-module read via this repository's own interface, the
   * same pattern already used by the Reports module (task-based
   * precedent), not a raw cross-module Prisma join.
   */
  findUnsettledDoctorFeeSources(
    doctorId: string,
    branchId: string,
    periodStart: Date,
    periodEnd: Date,
    excludeVisitTreatmentIds: string[],
  ): Promise<DoctorFeeSourceLine[]>;
}
