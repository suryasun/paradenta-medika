# task-050: Record SOAP Note (EMR-003)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** G. EMR Basic  
**Feature:** G2. Basic Clinical Documentation  
**Module:** EMR  
**Priority:** P0 - Blocking

---

## Business Goal

Allow the Doctor to document the standard SOAP (Subjective, Objective, Assessment, Plan) note for the visit, the core clinical documentation artifact.

## Depends On

- task-048

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md
- **PRD:** docs/01-prd/features/emr.md
- **SAD:** docs/03-sad/15-module-emr.md Section 14 (EMR-003), Section 16 (SOAP Note -- Subjective/Objective/Assessment/Plan fields)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-048, task-049 (Vital Sign feeds into the Objective section).

## Backend Scope

- RecordSoapNoteUseCase: persist Subjective, Objective, Assessment, Plan text/structured fields against the open Visit, per docs/03-sad/15-module-emr.md Section 16.

## Frontend Scope

- SOAP Note entry form (four sections: Subjective, Objective, Assessment, Plan) within the Visit/EMR screen.

## Database Impact

- Inserts/updates a soap_notes record (or fields) linked to the Visit.

## API Impact

- Adds the SOAP Note endpoint scoped under the Visit resource.

## Workflow Impact

Third step of the Clinical Workflow.

## Security Impact

- Gated by emr.soap.record permission (Doctor role).
- Audit Trail entry required.

## Testing Required

- Unit test: SOAP note can only be recorded against an open Visit.

## Deliverables

- RecordSoapNoteUseCase, controller, route, DTOs, tests.

## Acceptance Criteria

- All four SOAP sections persist and are retrievable against the correct Visit.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** task-048.
- **Required Before:** None blocking.
- **Can Run In Parallel With:** task-049, task-051.
