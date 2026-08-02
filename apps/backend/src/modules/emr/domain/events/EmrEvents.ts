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
