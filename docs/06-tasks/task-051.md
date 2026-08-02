# task-051: Record Diagnosis (EMR-007)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** G. EMR Basic  
**Feature:** G2. Basic Clinical Documentation  
**Module:** EMR  
**Priority:** P0 - Blocking

---

## Business Goal

Allow the Doctor to record a formal diagnosis for the visit, which the Treatment entry (task-053) and eventual clinical reporting depend on.

## Depends On

- task-048
- task-050

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md
- **PRD:** docs/01-prd/features/emr.md
- **SAD:** docs/03-sad/15-module-emr.md Section 14 (EMR-007)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-048, task-050 (Assessment section of SOAP is closely related to Diagnosis -- confirm against source whether these are the same field or distinct entities before implementing separately).

## Backend Scope

- RecordDiagnosisUseCase: persist one or more diagnosis entries against the Visit, referencing the Diagnosis Reference master data (docs/03-sad/11-module-master-data.md Section 8.1 'Diagnosis Reference') -- note: a Diagnosis Reference CRUD task is not in this Phase 1 list (Master Data scope was limited to Clinic/Branch/Doctor/Treatment/PaymentMethod); if diagnosis coding against a reference catalog is required for Phase 1, that master data entity must be added as a task before this one can be fully implemented -- flagged as a scope gap rather than guessed at.

## Frontend Scope

- Diagnosis entry field(s) within the Visit/EMR screen.

## Database Impact

- Inserts a visit_diagnoses record linked to the Visit.

## API Impact

- Adds the Diagnosis endpoint scoped under the Visit resource.

## Workflow Impact

Feeds task-053 (Treatment Entry) and downstream clinical reporting (out of Phase 1 scope).

## Security Impact

- Gated by emr.diagnosis.record permission (Doctor role).
- Audit Trail entry required.

## Testing Required

- Unit test: diagnosis can only be recorded against an open Visit.

## Deliverables

- RecordDiagnosisUseCase, controller, route, DTOs, tests.

## Acceptance Criteria

- Diagnosis entries persist and are retrievable against the correct Visit.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.
- Scope gap (Diagnosis Reference master data) resolved or explicitly deferred with sign-off before this task is marked done.

---

## Dependency Detail

- **Blocked By:** task-048, task-050.
- **Required Before:** task-053.
- **Can Run In Parallel With:** task-049.
