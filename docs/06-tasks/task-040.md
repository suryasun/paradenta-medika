# task-040: Call Queue (PATCH .../{id}/call)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** F. Queue Management  
**Feature:** F1. Queue Lifecycle  
**Module:** Queue  
**Priority:** P0 - Blocking

---

## Business Goal

Allow a doctor/nurse station to call the next waiting patient, transitioning the queue entry to CALLED and notifying the queue display.

## Depends On

- task-037

## Required Documents

- **AI Contract:** docs/04-ai-contract/08-workflow-contract.md
- **PRD:** docs/01-prd/features/queue.md, docs/01-prd/business-rules.md Section 4
- **SAD:** docs/03-sad/14-module-queue.md Section 56 (REST API Specification), Section 56 (Call Queue), Section 11 (Queue Lifecycle)
- **Design:** No page-level spec exists yet (documented gap) -- this is primarily a real-time operational screen (Queue board) rather than a traditional CRUD page.

## Required Existing Code

task-037 (Queue entity/repository) unless this task IS task-037.

## Backend Scope

- CallQueueUseCase: transition WAITING -> CALLED; must publish/trigger the doctor-called event consumed by Epic G (Visit can only be opened from a CALLED queue per docs/03-sad/15-module-emr.md Section 15 Business Rules: 'Visit hanya dapat dibuat dari Queue berstatus Called').
- PATCH /api/v1/queues/{id}/call controller + DTOs.

## Frontend Scope

- Queue board/list UI reflecting the current queue state for the relevant action.

## Database Impact

- Reads/updates the queues table (status field and related timestamps).

## API Impact

- Adds PATCH /api/v1/queues/{id}/call.

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

- Transition only allowed from WAITING.
- CALLED queue entry is what task-048 (Open Visit) requires to exist.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** task-037
- **Required Before:** task-048 (Open Visit) depends on a queue reaching CALLED status.
- **Can Run In Parallel With:** task-041 through task-047.
