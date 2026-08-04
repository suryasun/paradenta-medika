# task-289: Quick Add Patient (from Reservation Booking Screen)

**Phase:** Patient Module Enhancement (post-roadmap addendum)
**Epic:** PE. Patient Module Enhancement
**Feature:** PE6. Quick Registration
**Module:** Patient / Reservation
**Priority:** P1 - High

---

## Business Goal

Let registration staff create a minimal, valid patient record — name, address (free text), phone number, identity number only — directly from the Reservation booking screen's patient-search step, when the patient searched for isn't found, instead of leaving the booking flow to complete the full Patient registration form. Realizes the "Register Patient" step already named (but never elaborated as a reduced-field flow) in `docs/03-sad/13-module-reservation.md`'s Reservation Workflow (§10) and Walk-in flow.

## Depends On

- task-001 (Create Patient)
- task-002 (Reservation Booking) — the booking screen this feature is launched from

## Required Documents

- **AI Contract:** `docs/04-ai-contract/04-api-contract.md`, `docs/04-ai-contract/10-code-generation-rules.md`
- **PRD:** `docs/01-prd/features/patient.md` (UC-PAT-014), `docs/01-prd/features/reservation.md` (RSV-013), `docs/01-prd/business-rules.md` §2.5 (Quick Add Patient Rules)
- **SAD:** `docs/03-sad/12-module-patient.md` §8.2 (FR-PAT-020), §9.2 (UC-PAT-014), §17.1 (`QuickAddPatientUseCase`, explicitly distinct from `CreatePatientUseCase`), §20.2 (`POST /patients/quick-add`), §21.1a (`QuickAddPatientRequest`); `docs/03-sad/13-module-reservation.md` (Reservation Workflow §10, Walk-in flow — the "Register Patient" step this feature fills in)
- **Design:** `docs/02-design/pages/overview.md`'s Patient Module Enhancement addendum (flags that Reservation's own hi-fi booking-screen UI is still an open gap; this task's field-level contract does not depend on that UI work being finished first) — follow `CLAUDE.md` frontend rules until Reservation gets a page-level spec.

## Required Existing Code

task-001 (`CreatePatientUseCase`, for MRN generation — `QuickAddPatientUseCase` reuses the same MRN generator, not a separate numbering scheme), task-002 (Reservation booking flow, whichever screen currently handles patient search).

## Backend Scope

- New `QuickAddPatientUseCase`, deliberately **not** a thin wrapper around `CreatePatientUseCase` with optional fields defaulted — a distinct use case with its own request contract (`fullName`, `address: string`, `phoneNumber`, `identityNumber` only; no gender/dateOfBirth/email/etc.), per `docs/03-sad/12-module-patient.md` §17.1's explicit framing.
- Still performs the same duplicate-check pass as full registration (§5.3/§16.3: name + identity number + phone combination) — a quick-add patient is not exempt from duplicate prevention just because the form is shorter.
- Generates a real MRN via the existing generator (same sequence as `CreatePatientUseCase`, not a separate quick-add number range) and sets `status: Registered`.
- The resulting patient is a fully real, completable record — `UpdatePatientUseCase` (task-029) can be used afterward to fill in the rest of the profile with no special-casing required on the update side.

## Frontend Scope

A small modal/panel on the Reservation booking screen, surfaced when Search Patient returns no results: the 4 fields above, a "Create & Continue Booking" action that creates the patient and immediately resumes the booking flow with that patient selected. Exact placement/visual treatment is deferred to whichever task specs Reservation's booking screen in full (documented gap, see `docs/02-design/pages/overview.md`) — this task's scope is the field contract and the use case, not the final pixel-level UI.

## Database Impact

None — writes to the existing `patients` table via the same insert path as full registration; no new columns or tables.

## API Impact

Adds `POST /patients/quick-add`.

## Workflow Impact

Fills in the previously-unelaborated "Register Patient" step of the Reservation booking flow (`docs/03-sad/13-module-reservation.md` §10) with a concrete, reduced-field mechanism, so a walk-in or phone-booked patient no longer requires the full registration form before a reservation can proceed.

## Security Impact

Gated by the existing `patient.create` permission — no new permission code, since this is a reduced-field variant of the same create capability, not a separate administrative action.

## Testing Required

- Unit test: `QuickAddPatientUseCase` succeeds with exactly the 4 required fields; rejects a request missing any of them.
- Unit test: duplicate-check logic fires the same way it does for full `CreatePatientUseCase` (reusing the same duplicate-detection service, not a separate/weaker check).
- Integration test: `POST /patients/quick-add` returns a patient with a real MRN and `Registered` status, and that patient is immediately usable as the `patientId` on a subsequent `POST /reservations` call.

## Deliverables

- `QuickAddPatientUseCase` + `QuickAddPatientRequestDto`/response
- `POST /patients/quick-add` route + controller
- Tests
- Reservation booking-screen modal (frontend), scoped to the field contract only per Frontend Scope above

## Acceptance Criteria

Per `docs/01-prd/acceptance-criteria/patient.md` ("New in This Pass"):

- Only `fullName`, `address` (free text), `phoneNumber`, `identityNumber` are required — no other field may be required by this endpoint.
- A quick-added patient receives a real MRN and `Registered` status, not a placeholder/temporary record.
- The same patient can be completed later via the normal Update Patient flow with no special-casing.
- Only reachable from the Reservation booking screen's patient-search step — not exposed as a general-purpose alternate registration endpoint elsewhere in the product.

## Definition of Done

`QuickAddPatientUseCase` implemented and tested (including duplicate-check parity with full registration), `POST /patients/quick-add` live, Reservation booking-screen entry point wired, and a created quick-add patient verified end-to-end as immediately bookable.

---

## Dependency Detail

- **Blocked By:** task-001, task-002
- **Required Before:** None
- **Can Run In Parallel With:** task-284, task-285, task-286, task-287, task-288
