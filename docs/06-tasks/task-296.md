# task-296: Referral Source on Quick New Patient Call

**Phase:** Reservation Module Addendum #2 (post-roadmap)
**Epic:** RE. Reservation Module Enhancement
**Feature:** RE7. Referral Source on Quick New Patient Call
**Module:** Reservation / Patient
**Priority:** P2 - Medium

---

## Business Goal

Let front-desk staff capture marketing/lead-source attribution (`docs/03-sad/12-module-patient.md` §14.5, task-287) for a caller booked through Quick New Patient Call, the same way it's already captured for a fully-registered patient — closing a gap where callers booked through the fast path had no referral-source attribution at all.

## Depends On

- task-292 (Quick New Patient Call)
- task-287 (Patient Referral Source, Epic PE4)

## Required Documents

- **AI Contract:** `docs/04-ai-contract/07-module-contract.md` (module boundary — read-only cross-module validation via `IReferralSourceRepository`, same precedent `CreatePatientUseCase`/`UpdatePatientUseCase` already use)
- **PRD:** `docs/01-prd/features/reservation.md` RSV-016 (updated)
- **SAD:** `docs/03-sad/13-module-reservation.md` §40.2/§40.3, `docs/03-sad/12-module-patient.md` §14.5/§21.1
- **Design:** `docs/02-design/pages/patient.md` §14 (existing Referral Source field pattern, reused not reinvented)

## Required Existing Code

`CreatePatientUseCase.ts`'s referral-source validation block (constructor-injected `IReferralSourceRepository`, `findById` + `isActive` check, throws `PatientReferralSourceInvalidException`) — this task's backend half is a direct copy of that pattern into `QuickNewPatientCallUseCase`. `PatientForm.tsx`'s referral-source `<Select>` + conditional staff-picker block — this task's frontend half extracts that into a shared component rather than duplicating it.

## Backend Scope

- `QuickNewPatientCallRequestDto` gains optional `referralSourceId`/`referredByUserId` (same `@IsUUID('4')` validation as `CreatePatientRequestDto`).
- `QuickNewPatientCallUseCase` takes a new `IReferralSourceRepository` constructor param, validates a submitted `referralSourceId` the same way `CreatePatientUseCase` does, and passes both fields into `PatientEntity.create(...)`'s props (already supported since task-287).
- `reservation.routes.ts`'s composition root wires in `ReferralSourceRepository` (cross-module import, same pattern already used for `PatientRepository`/`DoctorRepository`).

## Frontend Scope

- New shared `ReferralSourceFields` component (`features/patient/components/`), extracted from `PatientForm.tsx`'s inline referral-source block: owns the `useReferralSources()` fetch, the `requiresReferrer` lookup, and the conditional "Staf yang merujuk" picker. Takes `referralSourceId`/`referredByUserId`/`onReferralSourceChange`/`onReferredByUserChange` props.
- `PatientForm.tsx` is refactored to use the extracted component (no behavior change).
- `QuickNewPatientCallModal.tsx` adds the same component, with its own local `referralSourceId`/`referredByUserId` state included in the submit payload.

## Database Impact

None — reuses the existing `patient.referral_source_id`/`referred_by_user_id` columns (task-287).

## API Impact

`POST /reservations/quick-call` request body gains optional `referralSourceId`/`referredByUserId`. No new endpoint.

## Workflow Impact

None — an additional optional field on an existing creation flow.

## Security Impact

None — no new permission code; validated the same way the existing `patient.create`-gated flows already validate it.

## Testing Required

- Unit test: a valid `referralSourceId` is passed through to the created patient.
- Unit test: an inactive/unknown `referralSourceId` is rejected, creating neither a patient nor a reservation (same atomicity guarantee task-292 already established).
- Frontend component test: selecting a referral source in the Quick Call modal includes it in the submitted payload.

## Deliverables

- `QuickNewPatientCallRequestDto`/`QuickNewPatientCallUseCase` changes.
- `ReferralSourceFields` shared component, used by both `PatientForm.tsx` and `QuickNewPatientCallModal.tsx`.
- Tests.

## Acceptance Criteria

- A Quick Call submission with a valid `referralSourceId` results in a patient record with that referral source attributed, identically to full registration.
- An invalid `referralSourceId` rejects the whole submission (422), same error code as full registration's own validation.
- The "Staf yang merujuk" picker only appears when the selected source has `requiresReferrer: true`, matching Patient Registration's existing behavior exactly.

## Definition of Done

Referral Source (+ conditional staff picker) live on the Quick Call modal, backend validation matching Patient Registration's, `PatientForm.tsx` refactored onto the same shared component with no behavior change, tests passing.

---

## Dependency Detail

- **Blocked By:** task-292, task-287
- **Required Before:** None
- **Can Run In Parallel With:** task-295, task-297, task-298, task-299
