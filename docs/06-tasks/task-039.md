# task-039: Queue Detail (GET /api/v1/queues/{id})

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** F. Queue Management  
**Feature:** F1. Queue Lifecycle  
**Module:** Queue  
**Priority:** P1 - High

---

## Business Goal

Allow staff to view full detail of a single queue entry.

## Depends On

- task-037

## Required Documents

- **AI Contract:** docs/04-ai-contract/08-workflow-contract.md
- **PRD:** docs/01-prd/features/queue.md, docs/01-prd/business-rules.md Section 4
- **SAD:** docs/03-sad/14-module-queue.md Section 56 (REST API Specification), Section 56 (Get Queue Detail)
- **Design:** No page-level spec exists yet (documented gap) -- this is primarily a real-time operational screen (Queue board) rather than a traditional CRUD page.

## Required Existing Code

task-037 (Queue entity/repository) unless this task IS task-037.

## Backend Scope

- GetQueueDetailUseCase.
- GET /api/v1/queues/{id} controller + DTOs.

## Frontend Scope

- Queue board/list UI reflecting the current queue state for the relevant action.

## Database Impact

- Reads/updates the queues table (status field and related timestamps).

## API Impact

- Adds GET /api/v1/queues/{id}.

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

- Existing id returns full detail; non-existent id returns 404.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** task-037
- **Required Before:** None blocking.
- **Can Run In Parallel With:** task-038, task-040 through task-047.
