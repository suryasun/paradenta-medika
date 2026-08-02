# task-093: Timeline Events (Filtered)

**Phase:** Phase 2 - Core Clinical Operations  
**Epic:** U. Clinical Timeline  
**Feature:** U1. Longitudinal Patient Record  
**Module:** EMR  
**Priority:** P2 - Medium

---

## Business Goal

Allow the Doctor to filter the clinical timeline by event type (e.g. only Prescriptions, only Odontogram changes) for targeted review.

## Depends On

- task-091

## Required Documents

- **AI Contract:** docs/04-ai-contract/04-api-contract.md
- **PRD:** docs/01-prd/features/emr.md
- **SAD:** GET /api/v1/emr/timeline/{patientId}/events (grep-verified, line 10181)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-091.

## Backend Scope

- GetPatientTimelineEventsUseCase supporting an event-type filter parameter over the same aggregated data as task-091.

## Frontend Scope

- Event-type filter control on the Clinical Timeline view (task-091).

## Database Impact

- Read-only, filtered query.

## API Impact

- Adds GET /api/v1/emr/timeline/{patientId}/events.

## Workflow Impact

Supporting refinement of task-091.

## Security Impact

- Gated by emr.timeline.read permission.

## Testing Required

- Unit test: filtering by event type returns only matching events.

## Deliverables

- GetPatientTimelineEventsUseCase, controller, route, DTOs, tests, frontend filter control.

## Acceptance Criteria

- Filtered results correctly narrow to the requested event type(s).

## Definition of Done

- Implemented, tested, permission-gated.

---

## Dependency Detail

- **Blocked By:** task-091.
- **Required Before:** None blocking.
- **Can Run In Parallel With:** task-092, task-094.
