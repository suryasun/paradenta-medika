# task-290: Patient Type Categorization (New/Old)

**Phase:** Reservation Module Enhancement (post-roadmap addendum)
**Epic:** RE. Reservation Module Enhancement
**Feature:** RE1. Patient Type Categorization
**Module:** Reservation / Patient
**Priority:** P1 - High

---

## Business Goal

Let front-desk staff and reports distinguish a patient's first-ever visit from a returning one at a glance — a colored badge on every reservation card, in the Patients list, and as a filter on the Calendar and reservation list screens — without staff having to manually check reservation history. Foundational: task-291 (New Patient Report), task-292 (Quick New Patient Call), and task-294 (Reservation History) all depend on the `patientType`/`patientTypeAtBooking` values this task introduces.

## Depends On

- task-001 (Create Patient)
- task-002 (Reservation Booking)

## Required Documents

- **AI Contract:** `docs/04-ai-contract/02-architecture-contract.md` (MOD-003 module boundary — cross-module writes are events only), `docs/04-ai-contract/06-database-contract.md` (DB-010 denormalization justification, DB-042/043 audit columns)
- **PRD:** `docs/01-prd/business-rules.md` §7.5 (Reservation Module Enhancement Rules), `docs/01-prd/features/reservation.md` RSV-014/RSV-015
- **SAD:** `docs/03-sad/13-module-reservation.md` §39.2 (Data Model Changes), §39.7 item 2 (pre-existing data-dictionary conflict, not resolved here); `docs/03-sad/12-module-patient.md` §26.4 (new `patient_type`/`first_reservation_at` columns)
- **Design:** `docs/02-design/pages/reservation.md` §8.1

## Required Existing Code

`RESERVATION_CREATED_EVENT` (already implemented, `apps/backend/src/modules/reservation/domain/events/ReservationEvents.ts`) and its existing subscription pattern (`PATIENT_CHECKED_IN_EVENT` → `CreateQueueUseCase`, `tests/integration/checkInToQueue.test.ts`) — this task's cross-module update follows that identical shape. `CreateReservationUseCase` (task-002) is where the synchronous half of this task's logic runs.

## Backend Scope

- Add `patient_type_at_booking` (`ENUM('NEW','OLD')`, not null) to `Reservation`. Computed synchronously inside `CreateReservationUseCase` (and, once built, task-292's Quick New Patient Call use case): query `IReservationRepository` for any prior reservation belonging to this `patientId` with `status NOT IN (CANCELLED, NO_SHOW)`; none found → `NEW`, else `OLD`. This value is a permanent snapshot — never recomputed or overwritten after creation.
- Add `patient_type` (`ENUM('NEW','OLD')`, default `NEW`) and `first_reservation_at` (nullable `DATETIME`) to `Patient`. These are owned exclusively by the Patient module and must **not** be written directly by Reservation (MOD-003) — Reservation publishes the existing `RESERVATION_CREATED_EVENT` (payload already includes `patientId`); a new Patient-module event subscriber updates these two columns in response, following the `CreateQueueUseCase` subscription precedent exactly. `first_reservation_at` is set only the first time a patient's `patient_type` flips from `NEW` to `OLD` (i.e., on their second real reservation) — it records *when they stopped being new*, not their first reservation's timestamp, since it exists purely to support the flip itself being idempotent (subscriber checks `patient_type = NEW` before writing, not `first_reservation_at IS NULL`, to stay correct under event redelivery).
- Extend `GET /api/v1/reservations` (existing endpoint, `ListReservationsUseCase`) with a new `patientType` (`NEW`|`OLD`) query filter, applied against the stored `patient_type_at_booking` column — added to the documented filter set alongside the existing `keyword/doctorId/status/reservationType/reservationSource/dateFrom/dateTo` params (closing the API-066 "undocumented filter" gap proactively).
- Extend `GET /api/v1/patients` (existing endpoint) with the same `patientType` filter, applied against `Patient.patient_type`.

## Frontend Scope

- Reservation List (`/reservations`) and Patients List (`/patients`): add a `patientType` Badge column (`NEW` → info tone, `OLD` → neutral tone) and a filter chip (`All`/`New`/`Old`) alongside each screen's existing filter bar.
- Reservation Detail: add a read-only `patientType` field to the existing definition list.

## Database Impact

Adds `patient_type_at_booking` (not null) to `reservations`. Adds `patient_type` (not null, default `NEW`) and `first_reservation_at` (nullable) to `patients`.

## API Impact

Extends `GET /reservations` and `GET /patients` with a new `patientType` query filter. No new endpoints.

## Workflow Impact

None of the existing Create/Update/Cancel/Reschedule/Check-in reservation flows change shape — `patient_type_at_booking` is computed as an additional, non-blocking step inside the existing Create flow.

## Security Impact

No new permission code — `patientType` is exposed on the same response objects already gated by `reservation.read`/`patient.read`.

## Testing Required

- Unit test: first reservation for a patient (no prior non-cancelled/non-no-show reservation) → `patient_type_at_booking = NEW`.
- Unit test: second reservation for the same patient → `patient_type_at_booking = OLD`, even though a first, later-cancelled reservation exists in between (a cancelled reservation must not count as "prior").
- Unit test: Patient's `patient_type`/`first_reservation_at` update correctly in response to `RESERVATION_CREATED_EVENT`, verified via a fake event bus + fake Patient repository (matching `checkInToQueue.test.ts`'s cross-module test shape).
- Integration test: `GET /reservations?patientType=NEW` and `GET /patients?patientType=OLD` return correctly filtered results.

## Deliverables

- `patient_type_at_booking` column + computation logic in `CreateReservationUseCase`.
- New Patient-module event subscriber for `RESERVATION_CREATED_EVENT` updating `patient_type`/`first_reservation_at`.
- `patientType` filter on both list endpoints.
- Frontend badge + filter on Reservation List, Patients List, Reservation Detail.

## Acceptance Criteria

- A reservation for a phone number/identity not previously in the system is tagged `NEW`.
- A second reservation for the same patient is tagged `OLD`, while the patient's first reservation retains its original `NEW` snapshot value permanently (verified by re-fetching it after the second booking).
- Only reservations with status outside `CANCELLED`/`NO_SHOW` count toward the New/Old determination.
- The determination is made server-side; no client-supplied `patientType` value is ever accepted on create.

## Definition of Done

`patient_type_at_booking` computed correctly and immutably on every new reservation, `Patient.patient_type`/`first_reservation_at` kept in sync via the existing event-bus pattern (no direct cross-module writes), both new filters live and tested, frontend badge/filter shipped on all three touched screens.

---

## Dependency Detail

- **Blocked By:** task-001, task-002
- **Required Before:** task-291, task-292, task-294 (all filter or tag by Patient Type)
- **Can Run In Parallel With:** task-293
