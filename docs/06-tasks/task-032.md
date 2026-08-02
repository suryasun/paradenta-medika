# task-032: Update Reservation (PUT /api/v1/reservations/{id})

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** E. Reservation Management  
**Feature:** E1. Booking  
**Module:** Reservation  
**Priority:** P1 - High

---

## Business Goal

Allow staff to correct reservation details (e.g. wrong treatment type selected) before the appointment occurs.

## Depends On

- task-002
- task-006

## Required Documents

- **AI Contract:** docs/04-ai-contract/06-database-contract.md
- **PRD:** docs/01-prd/business-rules.md Section 3
- **SAD:** docs/03-sad/13-module-reservation.md Section 20.1 (PUT /api/v1/reservations/{id}), Section 13 (Update Reservation)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-002.

## Backend Scope

- UpdateReservationUseCase re-applying the same Doctor Schedule Validation as Create (task-002) when doctor/time is changed.
- PUT /api/v1/reservations/{id} controller.
- Must not allow updates to a reservation already in IN_SERVICE, COMPLETED, or CANCELLED status.

## Frontend Scope

- Reservation Edit form.

## Database Impact

- Updates reservations row.

## API Impact

- Adds PUT /api/v1/reservations/{id}.

## Workflow Impact

Part of the Reservation Booking sub-flow (docs/03-sad/01-system-overview.md Section 21.2), applicable only in BOOKED/WAITING states.

## Security Impact

- Gated by reservation.update permission.
- Audit Trail entry required.

## Testing Required

- Unit test: valid update succeeds; update attempt on a completed/cancelled reservation is rejected.
- Unit test: changing doctor/time re-validates schedule availability.

## Deliverables

- UpdateReservationUseCase, controller, route, DTOs, tests, frontend Edit form.

## Acceptance Criteria

- Valid update persists.
- Update on a terminal-status reservation is rejected with a clear business error.
- Audit Trail entry recorded.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** task-002, task-006.
- **Required Before:** None blocking.
- **Can Run In Parallel With:** task-031, task-033, task-034.
