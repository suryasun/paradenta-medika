# task-061: Record Medical History (EMR-004)

**Phase:** Phase 2 - Core Clinical Operations  
**Epic:** L. Complete Digital Medical Record  
**Feature:** L1. Medical History & Allergy  
**Module:** EMR  
**Priority:** P1 - High

---

## Business Goal

Allow the Doctor to record and update a patient's systemic medical history, used as a Clinical Alert during future visits -- part of the 'Digital Medical Record lengkap' capability deferred from Phase 1's basic EMR.

## Depends On

- Phase 1 task-048 (Open Visit)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md
- **PRD:** docs/01-prd/features/emr.md
- **SAD:** docs/03-sad/15-module-emr.md Section 18 (Medical History -- Categories: Penyakit Sistemik, Penyakit Jantung, Diabetes, Hipertensi, Hepatitis, HIV, Gangguan Pembekuan Darah, Riwayat Operasi, Kehamilan, Riwayat Rawat Inap; Business Rules: updatable every visit, history of changes retained, used as Clinical Alert)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

Phase 1 task-048 (open Visit to attach history to), task-003 schema extension needed for a medical_history table.

## Backend Scope

- RecordMedicalHistoryUseCase: persist/update history entries per the documented categories, retaining a change history (not overwriting prior values) per the business rule 'Sistem menyimpan histori perubahan'.
- Endpoint path not literally given in SAD; derive from convention, e.g. POST/PATCH /api/v1/patients/{patientId}/medical-history -- flagged as convention-derived.

## Frontend Scope

- Medical History form within the Visit/EMR screen, and a Clinical Alert banner shown when a visit opens for a patient with recorded history.

## Database Impact

- New medical_history table (or versioned rows) linked to Patient (not just Visit, since history persists across visits).

## API Impact

- Adds the Medical History endpoint(s) scoped under Patient.

## Workflow Impact

Surfaces as a Clinical Alert whenever any subsequent Visit is opened for the patient.

## Security Impact

- Gated by emr.medical-history.record permission (Doctor role).
- Audit Trail entry required -- clinically sensitive data.

## Testing Required

- Unit test: updating history preserves the prior version rather than overwriting it.
- Unit test: recorded history triggers a Clinical Alert on the next Visit open.

## Deliverables

- RecordMedicalHistoryUseCase, controller, route, DTOs, tests, frontend form + alert banner.

## Acceptance Criteria

- History persists per category with full change history retained.
- Clinical Alert surfaces on subsequent visit open.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** Phase 1 task-048.
- **Required Before:** task-065 (Prescription -- history may inform prescribing decisions, though the hard validation dependency is Allergy, task-062).
- **Can Run In Parallel With:** task-062.
