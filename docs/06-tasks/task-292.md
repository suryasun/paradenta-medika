# task-292: Quick New Patient Call

**Phase:** Reservation Module Enhancement (post-roadmap addendum)
**Epic:** RE. Reservation Module Enhancement
**Feature:** RE3. Quick New Patient Call
**Module:** Reservation / Patient
**Priority:** P1 - High

---

## Business Goal

Let a phone-in caller who isn't yet in the system be registered *and* booked in a single form/submit, instead of two separate steps — reducing call-handling time for the most common new-patient intake path (a phone call asking to book an appointment). Distinct from task-289's Quick Add Patient: that flow creates only the patient record and hands control back to a separate booking step; this flow creates the patient and the reservation together, atomically, in one transaction.

## Depends On

- task-001 (Create Patient)
- task-002 (Reservation Booking)
- task-289 (Quick Add Patient — this task reuses its patient-field contract and duplicate-check logic, does not duplicate it)
- task-290 (Patient Type Categorization — every reservation created this way is `NEW` by construction, but still routes through the same determination logic for consistency)

## Required Documents

- **AI Contract:** `docs/04-ai-contract/10-code-generation-rules.md` (no partial/half-finished transactions), `docs/04-ai-contract/06-database-contract.md` (transaction integrity)
- **PRD:** `docs/01-prd/business-rules.md` §7.5, `docs/01-prd/features/reservation.md` RSV-016
- **SAD:** `docs/03-sad/13-module-reservation.md` §39.3 (RSV-016), §39.4 (`POST /api/v1/reservations/quick-call`), §39.7 item 1 (open UX question: two similar "no results" actions)
- **Design:** `docs/02-design/pages/reservation.md` §8.2

## Required Existing Code

`QuickAddPatientUseCase` and `QuickAddPatientRequestDto` (task-289, `apps/backend/src/modules/patient/application/use-cases/QuickAddPatientUseCase.ts`) — this task's patient-creation half reuses the same duplicate-identity check (`findByIdentityNumber`) and the same placeholder-gender/birthDate convention documented there, not a reimplementation. `CreateReservationUseCase` (task-002) and `DoctorScheduleValidator` (task-036) — this task's reservation-creation half reuses both directly.

## Backend Scope

- New `QuickNewPatientCallUseCase`, composing (not duplicating) `QuickAddPatientUseCase`'s patient-creation logic and `CreateReservationUseCase`'s reservation-creation logic inside a single database transaction: create-or-reject-duplicate patient → create reservation (tagged `patient_type_at_booking = NEW`, per task-290's rule, since this path is by definition a not-previously-registered caller) → on any failure at either step, the whole transaction rolls back — no orphaned patient without a reservation, and no orphaned reservation without a patient.
- New `QuickNewPatientCallRequestDto`: the same 4 fields as `QuickAddPatientRequestDto` (`fullName`, `address`, `phoneNumber`, `identityNumber`) plus `doctorId`, `reservationDate`, `startTime` (required, matching `CreateReservationRequestDto`'s existing field names/types) and `complaint` (optional).
- New `POST /api/v1/reservations/quick-call` route. Response: the existing `ReservationResponseDto` shape, with `patientId` populated from the newly created (or duplicate-matched — see below) patient.
- Duplicate handling: if the submitted `identityNumber` already belongs to an existing patient (same check as task-289), this task does **not** silently create a second patient — it returns the existing `DUPLICATE_IDENTITY` business error (422), same as Quick Add Patient, rather than falling back to booking for the existing patient without staff confirmation. (This mirrors task-289's own behavior exactly and keeps the "quick call is for genuinely new callers" framing honest — a caller who turns out to already exist should be routed to the normal Search Patient flow instead.)

## Frontend Scope

New "Quick Call: Create & Book Now" modal, offered on the Reservation booking screen's `PatientPicker` alongside the existing "Quick Add Patient" action (task-289) when Search Patient returns no results — both remain available; which is visually primary is an open product decision (SAD §39.7 item 1, not resolved by this task). Fields: the 4 Quick Add Patient fields + Doctor (Select) + Date + Time Slot (reusing the existing `TimeSlotPicker`) + optional Complaint. Single submit → on success, navigate directly to the new Reservation's Detail page (skipping the intermediate "patient selected, now finish booking" step Quick Add Patient still requires).

## Database Impact

None beyond task-290's `patient_type_at_booking` column. Writes to the existing `patients` and `reservations` tables via the same insert paths as full registration/booking — no new tables.

## API Impact

Adds `POST /api/v1/reservations/quick-call`.

## Workflow Impact

Adds a second entry point into the "caller not found → register + book" moment of the Reservation booking flow (SAD §10), alongside task-289's existing Quick Add Patient entry point. No change to the existing Create/Update/Cancel/Reschedule/Check-in flows themselves.

## Security Impact

Gated by both `patient.create` and `reservation.create` (the same two permissions already required to do each step separately) — no new permission code, since this is a combined-transaction variant of two existing capabilities, not a new administrative action.

## Testing Required

- Unit test: successful call creates exactly one patient and one reservation, tagged `patient_type_at_booking = NEW`.
- Unit test: a failure during reservation creation (e.g. slot no longer available) rolls back the patient creation too — no orphaned patient record left behind. Verified against a fake repository that can be made to throw mid-transaction.
- Unit test: submitting an `identityNumber` that already exists returns `DUPLICATE_IDENTITY` (422) and creates neither a new patient nor a reservation.
- Integration test: `POST /reservations/quick-call` returns a full `ReservationResponseDto` with a real MRN-backed `patientId`, and that patient/reservation pair is immediately visible via `GET /patients/{id}` and `GET /reservations/{id}`.

## Deliverables

- `QuickNewPatientCallUseCase` + `QuickNewPatientCallRequestDto`.
- `POST /reservations/quick-call` route + controller.
- Frontend modal on the Reservation booking screen.
- Tests.

## Acceptance Criteria

- One form submit creates both records, or neither — verified by a forced mid-transaction failure test.
- The resulting reservation is tagged `patient_type_at_booking = NEW` automatically.
- A duplicate `identityNumber` is rejected with the same `DUPLICATE_IDENTITY` error task-289 already uses, not a new/different error code.
- Only reachable from the Reservation booking screen's patient-search step, same constraint as task-289's Quick Add Patient.

## Definition of Done

`QuickNewPatientCallUseCase` implemented and tested (including the atomic-transaction rollback case), `POST /reservations/quick-call` live, Reservation booking-screen modal wired alongside the existing Quick Add Patient action, and a call created through this flow verified end-to-end as both a real patient and a real, immediately checkable-in reservation.

---

## Dependency Detail

- **Blocked By:** task-001, task-002, task-289, task-290
- **Required Before:** None
- **Can Run In Parallel With:** task-291, task-293, task-294
