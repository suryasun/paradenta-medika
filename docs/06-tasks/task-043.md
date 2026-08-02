# task-043: Start Service (PATCH .../{id}/start)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** F. Queue Management  
**Feature:** F1. Queue Lifecycle  
**Module:** Queue  
**Priority:** P0 - Blocking

---

## Business Goal

Record that the doctor has begun seeing the patient, transitioning the queue entry to IN_SERVICE.

## Depends On

- task-040

## Required Documents

- **AI Contract:** docs/04-ai-contract/08-workflow-contract.md
- **PRD:** docs/01-prd/features/queue.md, docs/01-prd/business-rules.md Section 4
- **SAD:** docs/03-sad/14-module-queue.md Section 56 (REST API Specification), Section 56 (Start Service)
- **Design:** No page-level spec exists yet (documented gap) -- this is primarily a real-time operational screen (Queue board) rather than a traditional CRUD page.

## Required Existing Code

task-037 (Queue entity/repository) unless this task IS task-037.

## Backend Scope

- StartServiceUseCase: transition CALLED -> IN_SERVICE.
- PATCH /api/v1/queues/{id}/start controller + DTOs.

## Frontend Scope

- Queue board/list UI reflecting the current queue state for the relevant action.

## Database Impact

- Reads/updates the queues table (status field and related timestamps).

## API Impact

- Adds PATCH /api/v1/queues/{id}/start.

## Workflow Impact

Part of the Queue Lifecycle (docs/03-sad/14-module-queue.md Section 11) within the critical Patient Journey (Reservation -> CheckIn -> Queue -> Doctor -> EMR).

## Security Impact

- Gated by the corresponding queue.* permission.
- Audit Trail entry required for state-changing actions.

## Testing Required

- Unit test: valid state transition succeeds.
- Unit test: invalid state transition (e.g. completing a queue that was never started) is rejected.

## Deliverables

- Use Case, controller, route, DTOs, tests.

## Acceptance Criteria

- Transition only allowed from CALLED.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** task-040
- **Required Before:** Should align with task-048 (Open Visit) -- both represent 'doctor begins seeing patient' and their exact sequencing/triggering relationship must be confirmed against docs/03-sad/14-module-queue.md and docs/03-sad/15-module-emr.md Section 15 rather than assumed.
- **Can Run In Parallel With:** task-041, task-042, task-044 through task-047.
