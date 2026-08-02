# task-047: Queue Dashboard (GET /api/v1/queues/dashboard)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** F. Queue Management  
**Feature:** F2. Queue Dashboard  
**Module:** Queue  
**Priority:** P1 - High

---

## Business Goal

Give front-desk and management a real-time operational view of queue length, average wait, and doctor status -- the queue-specific dashboard distinct from the Phase-1 'Dashboard sederhana' epic (Epic I), which is a broader operations summary.

## Depends On

- task-037
- task-013
- task-014

## Required Documents

- **AI Contract:** docs/04-ai-contract/04-api-contract.md
- **PRD:** docs/01-prd/features/queue.md
- **SAD:** docs/03-sad/14-module-queue.md Section 56 (GET /api/v1/queues/dashboard), Section 26 (Queue Performance Metrics), Section 27 (Queue Dashboard Metrics)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-037 through task-046 (dashboard aggregates data these tasks produce).

## Backend Scope

- QueueDashboardUseCase computing the metrics defined in docs/03-sad/14-module-queue.md Section 27 (Queue Dashboard Metrics) from current queue state.
- GET /api/v1/queues/dashboard controller.

## Frontend Scope

- Queue Dashboard screen, likely displayed on a waiting-room monitor as well as the front-desk workstation.

## Database Impact

- Read-only aggregate query over queues.

## API Impact

- Adds GET /api/v1/queues/dashboard.

## Workflow Impact

Operational visibility; does not itself change any workflow state.

## Security Impact

- Gated by queue.dashboard.read permission.

## Testing Required

- Unit test: dashboard metrics compute correctly against a seeded set of queue entries in various states.

## Deliverables

- QueueDashboardUseCase, controller, route, DTOs, tests, frontend dashboard screen.

## Acceptance Criteria

- Dashboard reflects real-time counts per status and matches the metrics defined in docs/03-sad/14-module-queue.md Section 27.

## Definition of Done

- Implemented, tested, permission-gated.

---

## Dependency Detail

- **Blocked By:** task-037.
- **Required Before:** None blocking.
- **Can Run In Parallel With:** Any other Epic F task.
