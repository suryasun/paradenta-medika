# task-042: Skip Queue (PATCH .../{id}/skip)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** F. Queue Management  
**Feature:** F1. Queue Lifecycle  
**Module:** Queue  
**Priority:** P2 - Medium

---

## Business Goal

Allow staff to skip a patient who is not present when called, moving on to the next patient without cancelling the queue entry outright.

## Depends On

- task-040

## Required Documents

- **AI Contract:** docs/04-ai-contract/08-workflow-contract.md
- **PRD:** docs/01-prd/features/queue.md, docs/01-prd/business-rules.md Section 4
- **SAD:** docs/03-sad/14-module-queue.md Section 56 (REST API Specification), Section 56 (Skip Queue)
- **Design:** No page-level spec exists yet (documented gap) -- this is primarily a real-time operational screen (Queue board) rather than a traditional CRUD page.

## Required Existing Code

task-037 (Queue entity/repository) unless this task IS task-037.

## Backend Scope

- SkipQueueUseCase: transition CALLED -> SKIPPED (or back to WAITING at reduced priority, per the exact state machine in docs/03-sad/14-module-queue.md Section 23 Queue State Transition -- implementer must follow that section's exact transition table, not assume).
- PATCH /api/v1/queues/{id}/skip controller + DTOs.

## Frontend Scope

- Queue board/list UI reflecting the current queue state for the relevant action.

## Database Impact

- Reads/updates the queues table (status field and related timestamps).

## API Impact

- Adds PATCH /api/v1/queues/{id}/skip.

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

- Skip only allowed from CALLED.
- Skipped entries are excluded from the 'next to call' selection but remain visible in the queue list.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** task-040
- **Required Before:** None blocking.
- **Can Run In Parallel With:** task-041, task-043 through task-047.
