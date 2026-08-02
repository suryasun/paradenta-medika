# Epic N: Prescription Management — Documentation (task-065–066)

> Retroactive documentation, per the template in `phase-1-documentation/epic-j-foundational-infrastructure.md`'s header note.

---

## Documentation Reviewed

- `docs/06-tasks/task-065.md`, `task-066.md`
- `docs/03-sad/15-module-emr.md` Section 24 ("Prescription harus divalidasi terhadap Allergy")
- `docs/06-tasks/phase-2-plan.md` Ambiguities #5 (block vs. override on allergy conflict) and #6 (Medicine master data is out of both Phase 1 and Phase 2 scope, belongs to the Warehouse module)

## Task List

| Task | Name |
|---|---|
| task-065 | Create Prescription (with Allergy Validation), P0 — Blocking |
| task-066 | Prescription History & Print, P2 |

## Implementation Plan

Epic N was **started, deliberately deferred once mid-session** ("skip Epic N for now, continue with Epic P" — an explicit user instruction, not a technical blocker) so Epic P could proceed first, then resumed and completed later in the same session. Two decisions were escalated via `AskUserQuestion` before implementation, since the plan itself flagged both as unresolved:

1. **Allergy-conflict enforcement (Ambiguity #5): Hard block (user-selected, recommended option).** `PrescriptionAllergyConflictException` is thrown and the prescription is rejected outright — no override path exists. Reasoning recorded on the exception: patient-safety/legal-risk item, no SAD text specifies an override flow, so the safer reading was chosen and confirmed with the user rather than assumed.
2. **Medicine master data (Ambiguity #6): Free-text medicine name (user-selected, recommended option).** No Medicine catalog was invented; `PrescriptionItem.medicineName` is a plain string, matching the `Prescription.medicineName` free-text precedent already noted in this plan's cross-phase gap.

## Files Created

`apps/backend/src/modules/emr/`:
- `domain/repositories/IPrescriptionRepository.ts`
- `application/services/AllergyCheckService.ts` + `.test.ts` (reads `IAllergyRepository`, built in Epic L)
- `application/dtos/CreatePrescriptionRequestDto.ts`, `PrescriptionResponseDto.ts`
- `application/mappers/PrescriptionMapper.ts`
- `application/use-cases/CreatePrescriptionUseCase.ts` + `.test.ts`, `GetPrescriptionHistoryUseCase.ts` + `.test.ts`, `PrintPrescriptionUseCase.ts` + `.test.ts`
- `infrastructure/repositories/PrescriptionRepository.ts`
- `presentation/controllers/PrescriptionController.ts`

Frontend: `features/emr/components/PrescriptionSection.tsx` + `.test.tsx`, `hooks/usePrescription.ts`.

## Files Modified

- `apps/backend/prisma/schema.prisma` (added `Prescription`/`PrescriptionItem` models)
- `apps/backend/src/modules/emr/domain/exceptions/EmrExceptions.ts` (added `PrescriptionAllergyConflictException`, `PrescriptionNotFoundException`)
- `apps/backend/src/modules/emr/presentation/routes/emr.routes.ts` (wired `prescriptionController`, instantiated `AllergyCheckService`)
- `apps/frontend/features/emr/components/VisitWorkspace.tsx` (added Prescription tab)

## Database Changes

Migration `20260802101315_add_prescription`: `prescriptions`, `prescription_items` tables.

## API Changes

| Endpoint | Permission |
|---|---|
| `POST /emr/visits/:id/prescriptions` | `emr.prescription.create` |
| `GET /patients/:patientId/prescriptions` | `emr.prescription.read` |
| `GET /emr/prescriptions/:id/print` | `emr.prescription.read` |

`POST` returns `422 PRESCRIPTION_ALLERGY_CONFLICT` when any item's medicine name conflicts with a recorded `DRUG` allergy.

## Frontend Changes

`PrescriptionSection` — multi-item prescription entry, permanent history list, print view.

## Security Validation

`CreatePrescriptionUseCase` calls `AllergyCheckService` for every item before persisting; the hard block cannot be bypassed by the API (no override parameter exists anywhere in the DTO), per the explicit user sign-off.

## Architecture Validation

- `AllergyCheckService` is a genuinely shared application service (not duplicated) — built once in Epic L's directory, imported by Epic N without re-implementing the allergy lookup.
- Per-entry array validation (`items[]`) uses the same plain `@IsArray()`/`@ArrayMinSize(1)` + manual use-case-level validation pattern as Epic M's Treatment Plan, for the same `reflect-metadata` reason.
- Both AskUserQuestion decisions are recorded inline as code comments on the relevant exception/DTO, not only in this retroactive doc, so they remain auditable from the source alone.
