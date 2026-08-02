# task-036: Doctor Availability & Time Slots

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** E. Reservation Management  
**Feature:** E2. Check-In & Availability  
**Module:** Reservation  
**Priority:** P0 - Blocking

---

## Business Goal

Allow the booking flow (task-002) to show only valid, non-conflicting time slots for a chosen doctor, preventing double-booking at the point of entry rather than only rejecting it after submission.

## Depends On

- task-023 (Doctor)
- task-013
- task-014

## Required Documents

- **AI Contract:** docs/04-ai-contract/04-api-contract.md
- **PRD:** docs/01-prd/features/reservation.md, docs/01-prd/business-rules.md Section 3 (Doctor Schedule Validation)
- **SAD:** docs/03-sad/13-module-reservation.md Section 20.2 (GET /api/v1/doctors/{id}/availability, GET /api/v1/doctors/{id}/time-slots), Section 15 (Doctor Schedule Validation), Section 16 (Time Slot Management)
- **Design:** No page-level spec exists yet (documented gap) -- used within the Reservation booking form.

## Required Existing Code

task-023 (Doctor entity). Note: Phase 1 roadmap does not separately list a 'Doctor Schedule' master data management task; this task assumes a minimal doctor working-hours definition exists on the Doctor entity (task-023) or a simple doctor_schedules table introduced here if docs/03-sad/13-module-reservation.md Section 15/16 requires a distinct schedule entity -- verify against Section 15/16 exact structure before implementation; do not invent schedule fields beyond what those sections define.

## Backend Scope

- GetDoctorAvailabilityUseCase, GetDoctorTimeSlotsUseCase implementing the slot-generation and conflict-checking logic in docs/03-sad/13-module-reservation.md Sections 15-16.
- GET /api/v1/doctors/{id}/availability, GET /api/v1/doctors/{id}/time-slots controllers.

## Frontend Scope

- Time slot picker component used within the Reservation booking form.

## Database Impact

- Read-only, cross-referencing doctor schedule data and existing reservations for conflict detection.

## API Impact

- Adds GET /api/v1/doctors/{id}/availability, GET /api/v1/doctors/{id}/time-slots.

## Workflow Impact

Feeds directly into task-002's Doctor Schedule Validation, preventing invalid bookings before submission rather than only rejecting them.

## Security Impact

- Gated by reservation.read (or doctor-availability-specific) permission.

## Testing Required

- Unit test: a fully-booked slot is excluded from returned availability.
- Unit test: an inactive doctor returns no availability.

## Deliverables

- Both Use Cases, controllers, routes, DTOs, tests, frontend slot picker.

## Acceptance Criteria

- Returned slots never include a slot that would fail task-002's validation (full slot, inactive doctor, past date).
- Response performance acceptable for interactive use in the booking form.

## Definition of Done

- Implemented, tested, permission-gated.

---

## Dependency Detail

- **Blocked By:** task-023, task-013, task-014.
- **Required Before:** task-002 (already implemented -- this task should be cross-checked against it so the booking form and validation stay consistent).
- **Can Run In Parallel With:** task-031 through task-034.
