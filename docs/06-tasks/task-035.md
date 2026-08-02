# task-035: Check-In Patient (PATCH .../{id}/check-in)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** E. Reservation Management  
**Feature:** E2. Check-In & Availability  
**Module:** Reservation  
**Priority:** P0 - Blocking

---

## Business Goal

Record that a patient with a reservation has physically arrived, transitioning the reservation to CHECK_IN and generating the corresponding Queue entry -- the critical link between Reservation and Queue modules.

## Depends On

- task-002
- task-031
- task-037 (Create Queue)

## Required Documents

- **AI Contract:** docs/04-ai-contract/08-workflow-contract.md
- **PRD:** docs/01-prd/business-rules.md Section 3, docs/01-prd/business-rules.md Section 4 (Queue)
- **SAD:** docs/03-sad/13-module-reservation.md Section 20.1 (PATCH .../{id}/check-in); test scenario 'Check-in -> Queue berhasil dibuat' (docs/03-sad/13-module-reservation.md Section 36.1); docs/03-sad/01-system-overview.md Section 21.2 (CHECK_IN status)
- **Design:** No page-level spec exists yet (documented gap).

## Required Existing Code

task-002, task-037 (Queue creation logic this task must invoke).

## Backend Scope

- CheckInPatientUseCase: transition reservation status BOOKED -> CHECK_IN, then create the corresponding Queue entry (delegating to the Queue module's CreateQueueUseCase from task-037, or publishing a PatientCheckedIn event the Queue module subscribes to, per docs/03-sad/02-system-architecture.md Section 24.1 Event Catalog: 'PatientCheckedIn | Reservation | Queue').
- PATCH /api/v1/reservations/{id}/check-in controller.

## Frontend Scope

- Check-In action on the Reservation List/Detail (front-desk primary daily action).

## Database Impact

- Updates reservations.status; inserts a queues row.

## API Impact

- Adds PATCH /api/v1/reservations/{id}/check-in.

## Workflow Impact

This is the exact seam between the Reservation and Queue epics in the critical Patient Journey flow (docs/03-sad/01-system-overview.md Section 21.1): Reservation -> CheckIn -> Queue.

## Security Impact

- Gated by reservation.check-in permission.
- Audit Trail entry required; must also produce the PatientCheckedIn domain event for cross-module consistency.

## Testing Required

- Unit test: check-in from BOOKED succeeds and creates exactly one Queue entry.
- Unit test: check-in from an invalid prior status is rejected.
- Integration test verifying the Queue entry's fields (patientId, doctorId, reservationId) match the source reservation.

## Deliverables

- CheckInPatientUseCase, controller, route, DTOs, tests, frontend action.

## Acceptance Criteria

- Reservation transitions to CHECK_IN.
- Exactly one Queue entry is created, correctly linked to the reservation.
- Performance target < 2 seconds per docs/03-sad/13-module-reservation.md Section 36.4.

## Definition of Done

- Implemented, tested, permission-gated, audit-logged, cross-module event verified.

---

## Dependency Detail

- **Blocked By:** task-002, task-031, task-037.
- **Required Before:** Epic F (Queue) tasks that assume a queue entry already exists in the system for manual/QA testing.
- **Can Run In Parallel With:** None -- this is a synchronization point between Epic E and Epic F.
