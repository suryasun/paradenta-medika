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

/**
 * docs/03-sad/02-system-architecture.md Section 24.1 Event Catalog: this is
 * the implementation of the already-documented "TreatmentSaved | EMR |
 * Billing" row, which existed in the catalog but had never actually been
 * built (docs/06-tasks/task-320.md) -- the same kind of documented-but-
 * unimplemented gap as UC-BIL-004 in the Billing SAD.
 *
 * Fixes the gap where a Treatment recorded after Invoice generation
 * (task-316/task-317 relaxed EMR's write-gate so this is now possible while
 * the Invoice is UNPAID/PARTIALLY_PAID) was silently excluded from the
 * Invoice -- GenerateInvoiceUseCase only snapshots VisitTreatment once, at
 * EMRFinished time. Published by RecordTreatmentUseCase after every
 * successful Treatment entry creation (not only ones recorded post-
 * Invoice); Billing's subscriber (task-320.md, SyncTreatmentToInvoiceUseCase)
 * no-ops when no Invoice exists yet for the visit -- the normal case, where
 * GenerateInvoiceUseCase will pick this row up itself at Close Visit time
 * -- and only acts when one already does.
 */
export const TREATMENT_RECORDED_EVENT = 'emr.treatment-recorded.v1';

export interface TreatmentRecordedPayload {
  event: typeof TREATMENT_RECORDED_EVENT;
  visitId: string;
  visitTreatmentId: string;
  treatmentId: string;
  treatmentName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  occurredAt: string;
}

/**
 * docs/06-tasks/task-321.md: Edit/Remove Treatment (before Invoice PAID).
 * Published by UpdateTreatmentUseCase/RemoveTreatmentUseCase; Billing's
 * subscribers (SyncTreatmentUpdateToInvoiceUseCase/
 * SyncTreatmentRemovalToInvoiceUseCase) keep the matching InvoiceItem (found
 * via the new InvoiceItem.visitTreatmentId FK) in sync the same way
 * emr.treatment-recorded.v1 keeps a newly-added one in sync.
 */
export const TREATMENT_UPDATED_EVENT = 'emr.treatment-updated.v1';

export interface TreatmentUpdatedPayload {
  event: typeof TREATMENT_UPDATED_EVENT;
  visitId: string;
  visitTreatmentId: string;
  treatmentId: string;
  treatmentName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  occurredAt: string;
}

export const TREATMENT_REMOVED_EVENT = 'emr.treatment-removed.v1';

export interface TreatmentRemovedPayload {
  event: typeof TREATMENT_REMOVED_EVENT;
  visitId: string;
  visitTreatmentId: string;
  occurredAt: string;
}
