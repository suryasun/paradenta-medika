/**
 * docs/03-sad/02-system-architecture.md Section 24.1 Event Catalog:
 * "EMRFinished | EMR | Billing" -- task-054 (Generate Invoice) subscribes.
 */
export const EMR_FINISHED_EVENT = 'EMRFinished';

export interface EmrFinishedPayload {
  event: typeof EMR_FINISHED_EVENT;
  visitId: string;
  visitNo: string;
  patientId: string;
  doctorId: string;
  branchId: string;
  occurredAt: string;
}

/**
 * docs/03-sad/18-module-warehouse.md Section 7.2 documents this event's
 * literal payload shape (`visitId`, `treatmentId`, `warehouseId`,
 * `materials[]`) as an illustrative example under Warehouse's "Incoming
 * Events" table -- it omits `visitTreatmentId` since the example assumes
 * one treatment per visit. This implementation adds `visitTreatmentId`
 * (needed to disambiguate a visit that records the same catalog Treatment
 * more than once, and to give ConsumeMaterialUseCase a stable idempotency
 * key) as a documented extension, not a contradiction, of that schema.
 * Published once per VisitTreatment that recorded materials, from
 * CloseVisitUseCase (task-136, Epic Z).
 */
export const TREATMENT_MATERIAL_FINALIZED_EVENT = 'emr.treatment-material-finalized.v1';

export interface TreatmentMaterialFinalizedPayload {
  event: typeof TREATMENT_MATERIAL_FINALIZED_EVENT;
  visitId: string;
  treatmentId: string;
  visitTreatmentId: string;
  branchId: string;
  warehouseId: string;
  materials: Array<{ itemId: string; quantity: number }>;
  occurredAt: string;
}
