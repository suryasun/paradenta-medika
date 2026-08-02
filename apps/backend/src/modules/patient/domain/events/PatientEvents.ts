/**
 * docs/03-sad/12-module-patient.md Section 19.2 Event Catalog / Section 19.4
 * Event Payload Example. Only PatientRegistered is published by Phase 1
 * (task-001); PatientUpdated/Archived/Restored follow the same shape and
 * are wired alongside their use cases (task-029/030) since those tasks
 * exist in this phase too, even though the SAD's catalog entry for them
 * primarily targets the Reporting module, which is not yet built.
 */
export const PATIENT_REGISTERED_EVENT = 'PatientRegistered';
export const PATIENT_UPDATED_EVENT = 'PatientUpdated';
export const PATIENT_ARCHIVED_EVENT = 'PatientArchived';
export const PATIENT_RESTORED_EVENT = 'PatientRestored';

export interface PatientRegisteredPayload {
  event: typeof PATIENT_REGISTERED_EVENT;
  patientId: string;
  medicalRecordNumber: string;
  fullName: string;
  registeredAt: string;
}

export interface PatientLifecyclePayload {
  event: string;
  patientId: string;
  medicalRecordNumber: string;
  occurredAt: string;
}
