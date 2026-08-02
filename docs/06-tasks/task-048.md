# task-048: Open Visit (EMR-001)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** G. EMR Basic  
**Feature:** G1. Visit Lifecycle  
**Module:** EMR  
**Priority:** P0 - Blocking

---

## Business Goal

Create the Visit record that becomes the container for a patient's clinical documentation during a single encounter -- the entry point of the EMR module.

## Depends On

- task-040 (Call Queue)
- task-013
- task-014
- task-006

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md
- **PRD:** docs/01-prd/features/emr.md
- **SAD:** docs/03-sad/15-module-emr.md Section 14 (Use Case Matrix, EMR-001), Section 15 (Visit Management -- Business Rules: Visit only from Queue status Called; one Queue has at most one Visit; Visit requires Doctor+Patient+Branch; can be saved as Draft)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-003 (visits table), task-040 (queue must be CALLED), task-023 (Doctor), task-006.

## Backend Scope

- OpenVisitUseCase: validate the source Queue is in CALLED status and has no existing Visit; create Visit in Draft/Waiting Examination status with doctorId, patientId, branchId, reservationId, queueId.
- POST /api/v1/visits (or /emr/visits, matching whichever base path docs/03-sad/15-module-emr.md's OpenAPI section (39) specifies -- verify exact path before implementation) controller.

## Frontend Scope

- 'Open Visit' action available to the Doctor when a patient reaches CALLED/IN_SERVICE in the Queue view.

## Database Impact

- Inserts into visits table.

## API Impact

- Adds the Open Visit endpoint (exact path per docs/03-sad/15-module-emr.md Section 39).

## Workflow Impact

First step of the Clinical Workflow (docs/03-sad/01-system-overview.md Section 22): Open Visit -> Vital Sign -> SOAP -> ... -> Save EMR -> Generate Invoice.

## Security Impact

- Gated by emr.visit.create permission (Doctor role primarily, per docs/03-sad/15-module-emr.md Use Case Matrix Primary Actor).
- Audit Trail entry required.

## Testing Required

- Unit test: opening a visit from a non-CALLED queue is rejected.
- Unit test: a queue that already has a Visit cannot have a second one opened (one Queue = one Visit rule).

## Deliverables

- OpenVisitUseCase, controller, route, DTOs, tests.

## Acceptance Criteria

- Visit can only be opened from a CALLED queue.
- One Queue produces at most one Visit.
- Visit correctly links Doctor, Patient, Branch, Queue, Reservation.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** task-040, task-013, task-014, task-006.
- **Required Before:** task-049 through task-053 (all require an open Visit to attach to).
- **Can Run In Parallel With:** None within Epic G (this is the entry point); can run parallel to Epic H tasks once task-054's dependency chain is otherwise ready.
