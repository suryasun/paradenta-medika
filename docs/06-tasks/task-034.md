# task-034: Cancel Reservation (PATCH .../{id}/cancel)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** E. Reservation Management  
**Feature:** E1. Booking  
**Module:** Reservation  
**Priority:** P1 - High

---

## Business Goal

Allow staff or the system to cancel a reservation that will not proceed, transitioning it to the CANCELLED terminal state.

## Depends On

- task-002
- task-006

## Required Documents

- **AI Contract:** docs/04-ai-contract/08-workflow-contract.md
- **PRD:** docs/01-prd/business-rules.md Section 3
- **SAD:** docs/03-sad/13-module-reservation.md Section 20.1 (PATCH .../{id}/cancel); status lifecycle in docs/03-sad/01-system-overview.md Section 21.2 (BOOKED/WAITING -> CANCELLED)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-002.

## Backend Scope

- CancelReservationUseCase: transition status to CANCELLED; must not be allowed from IN_SERVICE or COMPLETED (state machine integrity per docs/01-prd/business-rules.md Cross-Cutting Rules: 'State transitions ... must not be skipped or reordered').
- PATCH /api/v1/reservations/{id}/cancel controller.

## Frontend Scope

- Cancel action with confirmation dialog (destructive-action pattern, per docs/02-design/ui-guidelines.md's note on confirmation for destructive actions).

## Database Impact

- Updates reservations.status; appends a timeline entry.

## API Impact

- Adds PATCH /api/v1/reservations/{id}/cancel.

## Workflow Impact

Terminal alternate path of the Reservation status lifecycle.

## Security Impact

- Gated by reservation.cancel permission.
- Audit Trail entry required.

## Testing Required

- Unit test: cancel from BOOKED/WAITING succeeds.
- Unit test: cancel from IN_SERVICE/COMPLETED is rejected.

## Deliverables

- CancelReservationUseCase, controller, route, DTOs, tests, frontend action.

## Acceptance Criteria

- Reservation transitions to CANCELLED only from a valid prior state.
- Timeline and Audit Trail record the cancellation.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** task-002, task-006.
- **Required Before:** None blocking.
- **Can Run In Parallel With:** task-031, task-032, task-033.
