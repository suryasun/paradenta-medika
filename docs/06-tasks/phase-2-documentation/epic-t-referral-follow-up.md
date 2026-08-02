# Epic T: Referral & Follow Up — Documentation (task-089–090)

> Retroactive documentation, per the template in `phase-1-documentation/epic-j-foundational-infrastructure.md`'s header note.

---

## Documentation Reviewed

- `docs/06-tasks/task-089.md`, `task-090.md`
- `docs/03-sad/15-module-emr.md` Section 26 (Referral & Follow Up)
- `docs/06-tasks/phase-2-plan.md` Ambiguities #2 ("Laboratory Request" has no dedicated module — Referral is the mechanism) and #3 ("Radiology Request" maps to the Attachment module, not a dedicated DICOM/PACS system)

## Task List

| Task | Name |
|---|---|
| task-089 | Create Referral (incl. Laboratory / Radiology Referral), P1 |
| task-090 | Create Follow Up (with Auto-Reservation), P2 |

## Implementation Plan

`Referral` doubles as the Laboratory/Radiology referral mechanism per the plan's own Ambiguities #2/#3 resolution — `targetType` includes `LABORATORY` and `RADIOLOGY` alongside `SPECIALIST`/`HOSPITAL`; no dedicated lab-integration or DICOM/PACS module was built, since neither exists anywhere in the SAD. `FollowUp` carries an `autoSchedule` toggle: when true, it composes the Phase 1 `CreateReservationUseCase` in-process (same reuse pattern as Epic M's Treatment Plan conversion) to book the follow-up visit immediately.

## Files Created

`apps/backend/src/modules/emr/`:
- `domain/repositories/IReferralRepository.ts`, `IFollowUpRepository.ts`
- `application/dtos/CreateReferralRequestDto.ts`, `CreateFollowUpRequestDto.ts`, `ReferralResponseDto.ts`, `FollowUpResponseDto.ts`
- `application/mappers/ReferralMapper.ts`, `FollowUpMapper.ts`
- `application/use-cases/CreateReferralUseCase.ts` + `.test.ts`, `GetReferralsUseCase.ts`, `CreateFollowUpUseCase.ts` + `.test.ts`, `GetFollowUpsUseCase.ts`
- `infrastructure/repositories/ReferralRepository.ts`, `FollowUpRepository.ts`
- `presentation/controllers/ReferralController.ts`, `FollowUpController.ts`

Frontend: `features/emr/components/ReferralSection.tsx` + `.test.tsx`, `FollowUpSection.tsx` + `.test.tsx`, `hooks/useReferralAndFollowUp.ts`.

## Files Modified

- `apps/backend/prisma/schema.prisma` (added `ReferralTargetType`/`FollowUpPriority` enums + `Referral`, `FollowUp` models)
- `apps/backend/src/modules/emr/presentation/routes/emr.routes.ts` (wired `referralController`, `followUpController`; reused the already-instantiated `CreateReservationUseCase`)
- `apps/frontend/features/emr/components/VisitWorkspace.tsx` (added Referral / Follow Up tabs)

## Database Changes

Migration `20260802090428_add_referral_and_follow_up`: `referrals`, `follow_ups` tables.

## API Changes

| Endpoint | Permission |
|---|---|
| `POST /emr/visits/:id/referrals` | `emr.referral.create` |
| `GET /emr/visits/:id/referrals` | `emr.visit.read` |
| `POST /emr/visits/:id/follow-ups` | `emr.followup.create` |
| `GET /emr/visits/:id/follow-ups` | `emr.visit.read` |

## Frontend Changes

`ReferralSection` — target type + reason entry. `FollowUpSection` — date/priority entry with an "auto-book" toggle that reveals doctor/time/type/source fields only when enabled.

## Security Validation

Standard `emr.referral.create`/`emr.followup.create` gates; no additional business-rule exception was needed beyond the shared `VisitNotOpenException`/`VisitNotFoundException` checks already established in Phase 1.

## Architecture Validation

- `CreateFollowUpUseCase` composing `CreateReservationUseCase` is the third instance of this same in-process-reuse pattern in Phase 2 (after Epic M's Treatment Plan conversion and Epic R's Consent/Attachment reuse) — deliberately not re-implemented a third time from scratch, keeping scheduling/doctor-availability validation in exactly one place.
- Conditional-required fields on `autoSchedule` (doctorId/startTime/reservationType/source only required when true) are validated in `CreateFollowUpUseCase`, not via class-validator's `@ValidateIf`, to avoid pulling in additional decorator semantics beyond what the rest of the codebase already uses.
