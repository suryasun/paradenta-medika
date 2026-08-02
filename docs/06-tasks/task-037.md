# task-037: Create Queue (POST /api/v1/queues)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** F. Queue Management  
**Feature:** F1. Queue Lifecycle  
**Module:** Queue  
**Priority:** P0 - Blocking

---

## Business Goal

Generate a queue entry (with queue number) for a checked-in patient, the entry point of the Queue module.

## Depends On

- task-023 (Doctor)
- task-013
- task-014
- task-006

## Required Documents

- **AI Contract:** docs/04-ai-contract/08-workflow-contract.md
- **PRD:** docs/01-prd/features/queue.md, docs/01-prd/business-rules.md Section 4
- **SAD:** docs/03-sad/14-module-queue.md Section 56 (POST /api/v1/queues), Section 17 (Queue Numbering Strategy)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-003 (queues table), task-023 (Doctor), task-013, task-014, task-006.

## Backend Scope

- CreateQueueUseCase: accept patientId, doctorId, clinicId, reservationId (per the documented request body); generate a queue number per the Queue Numbering Strategy (docs/03-sad/14-module-queue.md Section 17); set initial status WAITING.
- POST /api/v1/queues controller + DTOs.

## Frontend Scope

- This endpoint is primarily invoked by task-035 (Check-In); a standalone 'walk-in queue' creation form may also call it directly for patients without a prior reservation.

## Database Impact

- Inserts into queues table.

## API Impact

- Adds POST /api/v1/queues.

## Workflow Impact

Called by task-035 (Check-In) as part of the Reservation -> Queue handoff; can also be called directly for walk-ins.

## Security Impact

- Gated by queue.create permission.
- Audit Trail entry required.

## Testing Required

- Unit test: queue number generation is unique and sequential per the documented strategy.
- Integration test: POST /api/v1/queues creates a retrievable queue entry.

## Deliverables

- CreateQueueUseCase, controller, route, DTOs, tests.

## Acceptance Criteria

- A new queue entry is created with a unique, correctly-formatted queue number and WAITING status.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** task-023, task-013, task-014, task-006.
- **Required Before:** task-035 (Check-In depends on this existing), and every other Epic F task.
- **Can Run In Parallel With:** task-021 through task-026 (Master Data, different module).
