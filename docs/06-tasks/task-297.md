# task-297: Retire Quick Add Patient

**Phase:** Reservation Module Addendum #2 (post-roadmap)
**Epic:** RE. Reservation Module Enhancement
**Feature:** RE8. Retire Quick Add Patient
**Module:** Patient / Reservation
**Priority:** P2 - Medium

---

## Business Goal

Remove a duplicate feature. Quick New Patient Call (task-292) already covers everything Quick Add Patient (task-289) does — registering a not-yet-known caller from the booking screen — but does it in one atomic step (patient + reservation together) instead of two (patient, then a separate booking step). Keeping both left staff choosing between two similar "no results found" actions with no documented difference in when to use which (`docs/03-sad/13-module-reservation.md` §39.7 item 1, an open question this task resolves by removal rather than by picking a primary).

## Depends On

- task-292 (Quick New Patient Call) — must exist and be the sole remaining path before task-289's code is removed.

## Required Documents

- **AI Contract:** `docs/04-ai-contract/10-code-generation-rules.md` (no dead code left behind)
- **PRD:** `docs/01-prd/features/reservation.md` RSV-013 (marked retired)
- **SAD:** `docs/03-sad/13-module-reservation.md` §40.3, `docs/03-sad/12-module-patient.md` §21.1a (marked retired)

## Required Existing Code

Full call-site inventory (verified by code search, not assumed):
- Frontend: `PatientPicker.tsx` (`allowQuickAdd` prop, `showQuickAdd` state, the link, the `QuickAddPatientModal` import/render), `CreateReservationForm.tsx` (the only site passing `allowQuickAdd`), `QuickAddPatientModal.tsx` (the modal itself), `usePatientMutations.ts` (`useQuickAddPatient`), `patient.service.ts` (`quickAdd`), `patient.types.ts` (`QuickAddPatientInput`).
- Backend: `patient.routes.ts` (`POST /patients/quick-add` route + `QuickAddPatientUseCase` wiring), `PatientController.ts` (`quickAdd` handler), `QuickAddPatientUseCase.ts` (+ its test), `QuickAddPatientRequestDto.ts`.
- Tests referencing the feature: `CreateReservationForm.test.tsx`'s Quick Add test block, `tests/integration/patientRoutes.test.ts`'s `POST /patients/quick-add` describe block, `tests/integration/quickAddPatientToReservation.test.ts` (whole file, premise no longer exists).

`AddToQueueModal.tsx`'s own `PatientPicker` usage is unaffected — it never had `allowQuickAdd`.

## Backend Scope

- Remove `POST /patients/quick-add` route registration and `QuickAddPatientUseCase` wiring from `patient.routes.ts`.
- Delete `QuickAddPatientUseCase.ts` (+ `.test.ts`) and `QuickAddPatientRequestDto.ts`.
- Remove the `quickAdd` handler and `quickAddPatientUseCase` constructor param from `PatientController.ts`.
- Remove the retired-endpoint test coverage from `tests/integration/patientRoutes.test.ts`; delete `tests/integration/quickAddPatientToReservation.test.ts` entirely.

## Frontend Scope

- `PatientPicker.tsx`: remove `allowQuickAdd` prop, `showQuickAdd` state, the "Quick Add Patient" link/button, and the `QuickAddPatientModal` import/render. The no-results state becomes a plain message.
- `CreateReservationForm.tsx`: drop `allowQuickAdd` from its `<PatientPicker>` call (the standalone "Quick Call: Create & Book Now" button, already present since task-292, remains the caller's only fast-registration entry point).
- Delete `QuickAddPatientModal.tsx`.
- Remove `useQuickAddPatient` from `usePatientMutations.ts`, `quickAdd` from `patient.service.ts`, and the now-dead `QuickAddPatientInput` type.
- Update `CreateReservationForm.test.tsx`: replace the Quick Add test with one confirming the no-results state has no Quick Add affordance.

## Database Impact

None — no columns owned exclusively by Quick Add Patient; nothing to migrate or backfill.

## API Impact

Removes `POST /api/v1/patients/quick-add` from the API surface.

## Workflow Impact

The booking screen's "caller not in the system" moment now has exactly one entry point (Quick Call) instead of two.

## Security Impact

Removes the `patient.create`-gated route (no permission code becomes orphaned — Quick Call already used the same permission).

## Testing Required

- Frontend component test: Search Patient's no-results state shows a plain message, with no "Quick Add Patient" button present.
- Backend: confirm `npx tsc --noEmit` and the full Jest suite are clean after deletion (no dangling imports/references).

## Deliverables

- All frontend/backend Quick Add Patient code, tests, and route removed.
- `CreateReservationForm.test.tsx` updated to reflect the single-path no-results state.

## Acceptance Criteria

- `POST /patients/quick-add` returns 404 (route no longer exists).
- No UI surface anywhere in the app offers a "Quick Add Patient" action.
- Quick New Patient Call remains fully functional and is the only fast-registration path from the booking screen.
- No dead code (unused imports, orphaned types) remains referencing the retired feature.

## Definition of Done

Quick Add Patient fully removed (frontend + backend + tests + docs), Quick Call verified as the sole remaining fast-registration path, full test suite green.

---

## Dependency Detail

- **Blocked By:** task-292
- **Required Before:** None
- **Can Run In Parallel With:** task-295, task-296, task-298, task-299
