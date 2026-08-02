# task-033: Reschedule Reservation (PATCH .../{id}/reschedule)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** E. Reservation Management  
**Feature:** E1. Booking  
**Module:** Reservation  
**Priority:** P1 - High

---

## Business Goal

Allow staff to move a reservation to a new date/time without cancelling and recreating it, preserving its history and timeline.

## Depends On

- task-002
- task-006

## Required Documents

- **AI Contract:** docs/04-ai-contract/06-database-contract.md
- **PRD:** docs/01-prd/business-rules.md Section 3, docs/01-prd/acceptance-criteria/reservation.md
- **SAD:** docs/03-sad/13-module-reservation.md Section 20.1 (PATCH .../{id}/reschedule); test scenario 'Reschedule -> Jadwal berhasil diperbarui' per docs/03-sad/13-module-reservation.md Section 36.1
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-002.

## Backend Scope

- RescheduleReservationUseCase: re-runs Doctor Schedule Validation (slot full, doctor inactive, past date, double booking -- same rejection rules as Create) against the new date/time.
- PATCH /api/v1/reservations/{id}/reschedule controller.
- Must append a Reservation Timeline entry (per docs/03-sad/01-system-overview.md Section 21.3) recording the reschedule event.

## Frontend Scope

- Reschedule action/dialog on the Reservation Detail/List.

## Database Impact

- Updates reservations row (new datetime) and reservation_timeline (or equivalent audit/history) rows.

## API Impact

- Adds PATCH /api/v1/reservations/{id}/reschedule.

## Workflow Impact

Alternate path within the Reservation Booking sub-flow.

## Security Impact

- Gated by reservation.reschedule permission.
- Audit Trail entry required.

## Testing Required

- Unit test: valid reschedule succeeds and creates a timeline entry.
- Unit test: reschedule to a full/invalid slot is rejected using the same validation as task-002.

## Deliverables

- RescheduleReservationUseCase, controller, route, DTOs, tests, frontend action.

## Acceptance Criteria

- Reservation successfully moves to the new valid slot.
- Reschedule to an invalid slot (per the Validation Test scenarios in docs/01-prd/acceptance-criteria/reservation.md) is rejected.
- Timeline records the reschedule.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** task-002, task-006.
- **Required Before:** None blocking.
- **Can Run In Parallel With:** task-031, task-032, task-034.
