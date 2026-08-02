# task-029: Update Patient (PUT /patients/{id})

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** D. Patient Management  
**Feature:** D1. Patient Registration & Profile  
**Module:** Patient  
**Priority:** P1 - High

---

## Business Goal

Allow Registration Staff to correct or update a patient's profile information after registration.

## Depends On

- task-001
- task-013
- task-014
- task-006

## Required Documents

- **AI Contract:** docs/04-ai-contract/06-database-contract.md
- **PRD:** docs/01-prd/business-rules.md Section 2, docs/01-prd/features/patient.md
- **SAD:** docs/03-sad/12-module-patient.md Section 20.2 (PUT /patients/{id})
- **Design:** docs/02-design/pages/patient.md

## Required Existing Code

task-001, task-006.

## Backend Scope

- UpdatePatientUseCase re-validating the same fields CreatePatientUseCase validates.
- PUT /patients/{id} controller.
- Must not allow changing the Medical Record Number (immutable identity per business rule).

## Frontend Scope

- Patient Edit form (List Action 'Edit' per docs/02-design/pages/patient.md Section 12.3).

## Database Impact

- Updates patients row.

## API Impact

- Adds PUT /patients/{id}.

## Workflow Impact

Keeps patient records accurate for downstream Reservation/EMR/Billing workflows.

## Security Impact

- Gated by patient.update permission.
- Audit Trail must record old/new values.

## Testing Required

- Unit test: valid update succeeds; attempt to change Medical Record Number is rejected.
- Integration test: 404 for non-existent patient.

## Deliverables

- UpdatePatientUseCase, controller, route, DTOs, tests, frontend Edit form.

## Acceptance Criteria

- Valid updates persist and are reflected in GET /patients/{id}.
- Medical Record Number cannot be changed.
- Audit Trail entry recorded.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** task-001, task-006.
- **Required Before:** None blocking.
- **Can Run In Parallel With:** task-027, task-028, task-030.
