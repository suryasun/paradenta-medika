# task-064: Convert Treatment Plan Item to Reservation

**Phase:** Phase 2 - Core Clinical Operations  
**Epic:** M. Treatment Planning  
**Feature:** M1. Treatment Planning  
**Module:** EMR / Reservation  
**Priority:** P2 - Medium

---

## Business Goal

Let staff turn a planned future treatment directly into a booked Reservation without re-entering patient/doctor/treatment details, per the documented business rule 'Treatment Plan dapat menghasilkan Reservation baru'.

## Depends On

- task-063
- Phase 1 task-002 (Create Reservation)

## Required Documents

- **AI Contract:** docs/04-ai-contract/08-workflow-contract.md
- **PRD:** docs/01-prd/features/emr.md, docs/01-prd/features/reservation.md
- **SAD:** docs/03-sad/15-module-emr.md Section 22 (Business Rules: 'Treatment Plan dapat menghasilkan Reservation baru')
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-063, Phase 1 task-002's CreateReservationUseCase (this task should invoke/reuse it rather than duplicate reservation-creation logic).

## Backend Scope

- ConvertTreatmentPlanToReservationUseCase: given a treatment_plan_item id and a chosen doctor/date-time (via Phase 1's Doctor Availability task-036), invoke CreateReservationUseCase pre-filled with the patient and planned treatment.
- Endpoint path convention-derived, e.g. POST /api/v1/emr/treatment-plan/{itemId}/convert-to-reservation.

## Frontend Scope

- 'Schedule This' action on each Treatment Plan item, opening the booking flow pre-filled.

## Database Impact

- Inserts a reservations row (reusing Phase 1 schema); may link back to treatment_plan_items via a new FK column.

## API Impact

- Adds the conversion endpoint.

## Workflow Impact

Bridges EMR Treatment Planning and Reservation Booking (Phase 1 module), demonstrating the intended cross-module reuse pattern (Application Service call, not duplicated logic, per docs/03-sad/03-clean-architecture.md module independence rules).

## Security Impact

- Gated by both emr.treatment-plan.read and reservation.create permissions.
- Audit Trail entry required.

## Testing Required

- Unit test: conversion produces a Reservation matching the plan item's treatment and patient.
- Integration test: converted reservation goes through the same Doctor Schedule Validation as any Phase 1 reservation.

## Deliverables

- ConvertTreatmentPlanToReservationUseCase, controller, route, DTOs, tests, frontend action.

## Acceptance Criteria

- Resulting Reservation correctly references the patient and planned treatment.
- All Phase 1 Reservation validation rules still apply (no bypass).

## Definition of Done

- Implemented, tested, permission-gated, audit-logged.

---

## Dependency Detail

- **Blocked By:** task-063, Phase 1 task-002.
- **Required Before:** None blocking.
- **Can Run In Parallel With:** task-065 through task-070.
