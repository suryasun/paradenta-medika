import { VisitTreatment, VisitTreatmentMaterial } from '@prisma/client';

export interface CreateVisitTreatmentMaterialInput {
  itemId: string;
  quantity: number;
}

export interface CreateVisitTreatmentInput {
  visitId: string;
  treatmentId: string;
  toothReference?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
  createdBy: string;
  /** docs/03-sad/15-module-emr.md Section 23 "Material Used" (task-136, Epic Z): ad-hoc per-procedure materials. */
  materials?: CreateVisitTreatmentMaterialInput[];
}

export interface VisitTreatmentWithMaterials extends VisitTreatment {
  materials: VisitTreatmentMaterial[];
}

/** docs/06-tasks/task-321.md: Quantity/Tooth Reference/Unit Price/Notes are
 * all editable (unlike task-053's original create-time "price snapshot,
 * never recalculated" rule -- editing is an explicit, audited user action,
 * not an automatic catalog-price recalculation). */
export interface UpdateVisitTreatmentInput {
  toothReference?: string;
  quantity?: number;
  unitPrice?: number;
  subtotal?: number;
  notes?: string;
  updatedBy: string;
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
  /** docs/06-tasks/task-321.md: a single (non-deleted) entry, for Update/Remove to load before acting. */
  findById(id: string): Promise<VisitTreatment | null>;
  findByVisitId(visitId: string): Promise<VisitTreatment[]>;
  /** docs/06-tasks/task-136.md: used by CloseVisitUseCase to publish per-treatment material-consumption events. */
  findByVisitIdWithMaterials(visitId: string): Promise<VisitTreatmentWithMaterials[]>;
  countByVisitId(visitId: string): Promise<number>;
  /** docs/06-tasks/task-321.md: Quantity/Tooth Reference/Unit Price/Notes edit, before Invoice PAID. */
  update(id: string, input: UpdateVisitTreatmentInput): Promise<VisitTreatment>;
  /** docs/06-tasks/task-321.md: soft delete only (EMR-wide policy) -- never a physical DELETE. */
  softDelete(id: string, deletedBy: string): Promise<void>;
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
