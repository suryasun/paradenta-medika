# task-049: Record Vital Sign (EMR-002)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** G. EMR Basic  
**Feature:** G2. Basic Clinical Documentation  
**Module:** EMR  
**Priority:** P1 - High

---

## Business Goal

Allow the Nurse to record the patient's vital signs at the start of an examination, as documented in the Objective section of the SOAP note.

## Depends On

- task-048

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md
- **PRD:** docs/01-prd/features/emr.md
- **SAD:** docs/03-sad/15-module-emr.md Section 14 (EMR-002, Primary Actor: Nurse), Section 17 (Vital Sign)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-048.

## Backend Scope

- RecordVitalSignUseCase: attach vital sign data (per the fields in docs/03-sad/15-module-emr.md Section 17) to the open Visit.

## Frontend Scope

- Vital Sign entry form within the Visit/EMR screen.

## Database Impact

- Inserts/updates a vital_signs record linked to the Visit (or a JSON field on visits, per whatever docs/03-sad/15-module-emr.md Section 17's data model specifies -- verify against source before implementation).

## API Impact

- Adds the Vital Sign endpoint scoped under the Visit resource.

## Workflow Impact

Second step of the Clinical Workflow.

## Security Impact

- Gated by emr.vital.record permission (Nurse role).
- Audit Trail entry required.

## Testing Required

- Unit test: vital sign can only be recorded against an open (non-Completed/Locked) Visit.

## Deliverables

- RecordVitalSignUseCase, controller, route, DTOs, tests.

## Acceptance Criteria

- Vital sign data persists against the correct Visit and is retrievable in Visit detail.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** task-048.
- **Required Before:** None blocking.
- **Can Run In Parallel With:** task-050, task-051.
