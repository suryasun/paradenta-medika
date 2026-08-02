# task-062: Record Allergy (EMR-005)

**Phase:** Phase 2 - Core Clinical Operations  
**Epic:** L. Complete Digital Medical Record  
**Feature:** L1. Medical History & Allergy  
**Module:** EMR  
**Priority:** P0 - Blocking

---

## Business Goal

Allow the Doctor to record a patient's allergies with severity, which becomes a mandatory safety check before any Prescription is created -- a patient-safety-critical capability.

## Depends On

- Phase 1 task-048

## Required Documents

- **AI Contract:** docs/04-ai-contract/09-security-contract.md (sensitive clinical data)
- **PRD:** docs/01-prd/features/emr.md
- **SAD:** docs/03-sad/15-module-emr.md Section 19 (Allergy Management -- Types: Drug/Food/Latex/Material/Local Anesthetic/Other; Severity: Mild/Moderate/Severe; Business Rules: alert on Visit open, Prescription MUST be validated against Allergy, all changes audited)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

Phase 1 task-048, task-003 schema extension for an allergies table.

## Backend Scope

- RecordAllergyUseCase: persist allergy type + severity linked to Patient.
- Endpoint path not literally given in SAD; derive from convention, e.g. POST /api/v1/patients/{patientId}/allergies -- flagged as convention-derived.
- Expose a reusable AllergyCheckService that task-065 (Create Prescription) must call before persisting any prescription.

## Frontend Scope

- Allergy entry form within the Visit/EMR screen; a persistent Clinical Alert banner (Severe allergies especially prominent) shown when a visit opens.

## Database Impact

- New allergies table linked to Patient.

## API Impact

- Adds the Allergy endpoint(s) scoped under Patient.

## Workflow Impact

Hard safety gate for task-065 (Prescription) -- prescribing a medicine matching a recorded Drug Allergy must be blocked or require explicit override with justification.

## Security Impact

- Gated by emr.allergy.record permission (Doctor role).
- Audit Trail entry required for every change (per the explicit business rule).

## Testing Required

- Unit test: recorded allergy blocks/warns on a matching prescription attempt (integration with task-065).
- Unit test: Severe-severity allergy surfaces prominently on Visit open.

## Deliverables

- RecordAllergyUseCase, AllergyCheckService, controller, route, DTOs, tests, frontend form + alert.

## Acceptance Criteria

- Allergy persists with type and severity.
- AllergyCheckService correctly flags a matching medicine at prescription time.
- Clinical Alert surfaces on Visit open.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged; AllergyCheckService interface documented for task-065 to consume.

---

## Dependency Detail

- **Blocked By:** Phase 1 task-048.
- **Required Before:** task-065 (Create Prescription -- hard dependency, prescription cannot be safely implemented without this).
- **Can Run In Parallel With:** task-061.
