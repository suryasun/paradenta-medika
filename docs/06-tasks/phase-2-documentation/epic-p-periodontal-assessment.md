# Epic P: Periodontal Assessment — Documentation (task-071–077)

> Retroactive documentation, per the template in `phase-1-documentation/epic-j-foundational-infrastructure.md`'s header note.

---

## Documentation Reviewed

- `docs/06-tasks/task-071.md`–`task-077.md`
- `docs/03-sad/15-module-emr.md` Part 3.2B (Sections 14, 18, 21 — measurement ranges, furcation applicability, CAL auto-computation) and Part 3.2D Section 39 (literal OpenAPI spec — one of only three Phase 2 sub-features with literal REST paths per the plan's Ambiguity #4)

## Task List

| Task | Name |
|---|---|
| task-071 | Create Periodontal Assessment, P1 |
| task-072 | Add Periodontal Measurement, P1 |
| task-073 | Update Periodontal Measurement, P2 |
| task-074 | Delete Periodontal Measurement, P2 |
| task-075 | Get Periodontal Assessment, P1 |
| task-076 | Get Periodontal Assessment History, P2 |
| task-077 | Lock Periodontal Assessment, P1 |

## Implementation Plan

An Assessment (one per Visit) owns many Measurements (one per tooth × measurement point, 6 points per tooth: MB/B/DB/ML/L/DL). Pocket Depth (0–15mm) and Gingival Margin (−10–10mm) are captured directly; **CAL (Clinical Attachment Level) is auto-computed server-side**, never accepted from the client, per Section 14's "CAL dihitung otomatis." Furcation grade is only accepted for molars (`FURCATION_APPLICABLE_TEETH`), rejected elsewhere via `FurcationNotApplicableException`. Locking an assessment makes it immutable — every measurement mutation checks `PeriodontalAssessmentLockedException` first.

**Scope-narrowing decision:** the SAD's fuller Part 3.2D design describes a much larger nested aggregate (ToothAssessment/ClinicalNote/Attachment/Version sub-entities). This was deliberately scoped to the literal task text (Assessment → Measurement, two levels) rather than the SAD's fuller enterprise shape, per this session's established document-priority discipline (Task Spec > SAD) — documented inline in the Prisma schema comment above `PeriodontalAssessment`.

## Files Created

`apps/backend/src/modules/emr/`:
- `domain/repositories/IPeriodontalAssessmentRepository.ts`, `IPeriodontalMeasurementRepository.ts`
- `domain/services/periodontalValidation.ts` (furcation-applicability check)
- `application/dtos/CreatePeriodontalAssessmentRequestDto.ts`, `SaveMeasurementRequestDto.ts`, `UpdateMeasurementRequestDto.ts`, `PeriodontalResponseDto.ts`
- `application/mappers/PeriodontalMapper.ts`
- `application/use-cases/CreatePeriodontalAssessmentUseCase.ts` + `.test.ts`, `AddPeriodontalMeasurementUseCase.ts` + `.test.ts`, `UpdatePeriodontalMeasurementUseCase.ts` + `.test.ts`, `DeletePeriodontalMeasurementUseCase.ts` + `.test.ts`, `GetPeriodontalAssessmentUseCase.ts` + `.test.ts`, `GetPeriodontalAssessmentHistoryUseCase.ts` + `.test.ts`, `LockPeriodontalAssessmentUseCase.ts` + `.test.ts`
- `infrastructure/repositories/PeriodontalAssessmentRepository.ts`, `PeriodontalMeasurementRepository.ts`
- `presentation/controllers/PeriodontalAssessmentController.ts`

Frontend: `features/emr/components/PeriodontalAssessmentSection.tsx` + `.test.tsx`, `hooks/usePeriodontalAssessment.ts`.

## Files Modified

- `apps/backend/prisma/schema.prisma` (added `PeriodontalAssessmentStatus` enum + `PeriodontalAssessment`, `PeriodontalMeasurement` models)
- `apps/backend/src/modules/emr/domain/exceptions/EmrExceptions.ts` (added `PeriodontalAssessmentNotFoundException`, `PeriodontalAssessmentLockedException`, `PeriodontalMeasurementNotFoundException`, `FurcationNotApplicableException`)
- `apps/backend/src/modules/emr/presentation/routes/emr.routes.ts` (wired `periodontalAssessmentController`)
- `apps/frontend/features/emr/components/VisitWorkspace.tsx` (added Periodontal tab)

## Database Changes

Migration `20260802083220_add_periodontal_assessment`: `periodontal_assessments`, `periodontal_measurements` tables.

## API Changes

Literal paths per SAD Part 3.2D Section 39:

| Endpoint | Permission |
|---|---|
| `POST /emr/periodontal-assessments` | `emr.periodontal.create` |
| `POST /emr/periodontal-assessments/:assessmentId/measurements` | `emr.periodontal.measurement.record` |
| `PUT /emr/periodontal-assessments/:assessmentId/measurements/:id` | `emr.periodontal.measurement.update` |
| `DELETE /emr/periodontal-assessments/:assessmentId/measurements/:id` | `emr.periodontal.measurement.delete` |
| `GET /emr/periodontal-assessments/:assessmentId` | `emr.periodontal.read` |
| `GET /emr/periodontal-assessments/:assessmentId/history` | `emr.periodontal.read` |
| `POST /emr/periodontal-assessments/:assessmentId/lock` | `emr.periodontal.lock` |

## Frontend Changes

`PeriodontalAssessmentSection` — a periodontal chart entry form per tooth/point, with a Lock action once complete.

## Security Validation

- `PeriodontalAssessmentLockedException` blocks every measurement mutation (add/update/delete) once locked — verified by dedicated tests for each use case.
- CAL is never a client-writable field on any DTO, closing off client tampering with a value meant to be system-derived.

## Architecture Validation

- Section 40 of the SAD names a literal `ASSESSMENT_NOT_FOUND` error code, but `PeriodontalAssessmentNotFoundException`'s `code` is kept as the codebase-wide `NOT_FOUND` for consistency with every other `*NotFoundException` in the codebase (documented on the exception class itself) — a deliberate convention override, not an oversight.
- This is the epic with the most literal SAD-documented endpoint paths of any Phase 2 feature (7 of 7), reducing convention-derivation risk relative to most of the rest of Phase 2 (per Ambiguity #4).
