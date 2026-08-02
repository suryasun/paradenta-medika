# Epic L: Complete Digital Medical Record (Medical History & Allergy) — Documentation (task-061–062)

> Retroactive documentation, per the template in `phase-1-documentation/epic-j-foundational-infrastructure.md`'s header note.

---

## Documentation Reviewed

- `docs/06-tasks/task-061.md`, `task-062.md`
- `docs/03-sad/15-module-emr.md` Section 18 (Medical History categories, "Sistem menyimpan histori perubahan") and Section 19 (Allergy types/severity)

## Task List

| Task | Name |
|---|---|
| task-061 | Record Medical History (EMR-004), P1 |
| task-062 | Record Allergy (EMR-005), P0 — Blocking (Prescription's allergy check depends on this) |

## Implementation Plan

Both entities are **Patient-scoped, not Visit-scoped** (per each task's own convention note), with an optional `visitId` to attribute the entry to the encounter it was recorded during. Medical History is append-only/versioned: recording a new entry in an existing category deactivates the prior active entry in that category (`deactivateByCategory`), rather than allowing an update-in-place, per Section 18's "Sistem menyimpan histori perubahan." Allergy has no such versioning — every entry is permanent and additive (Section 19 has no equivalent "history" rule).

## Files Created

`apps/backend/src/modules/emr/`:
- `domain/repositories/IMedicalHistoryRepository.ts`, `IAllergyRepository.ts`
- `application/dtos/RecordMedicalHistoryRequestDto.ts`, `RecordAllergyRequestDto.ts`, `MedicalHistoryResponseDto.ts`, `AllergyResponseDto.ts`
- `application/mappers/MedicalHistoryMapper.ts`, `AllergyMapper.ts`
- `application/use-cases/RecordMedicalHistoryUseCase.ts` + `.test.ts`, `GetMedicalHistoryUseCase.ts`, `RecordAllergyUseCase.ts` + `.test.ts`, `GetAllergiesUseCase.ts`
- `infrastructure/repositories/MedicalHistoryRepository.ts`, `AllergyRepository.ts`
- `presentation/controllers/MedicalHistoryController.ts`, `AllergyController.ts`

Frontend: `features/emr/components/MedicalHistorySection.tsx` + `.test.tsx`, `AllergySection.tsx` + `.test.tsx`, `ClinicalAlertBanner.tsx` (prominent banner on Visit open when the patient has a `SEVERE` allergy on record), `hooks/usePatientClinicalData.ts`.

## Files Modified

- `apps/backend/prisma/schema.prisma` (added `MedicalHistoryCategory`/`AllergyType`/`AllergySeverity` enums + `MedicalHistory`/`Allergy` models)
- `apps/backend/src/modules/emr/presentation/routes/emr.routes.ts` (wired both controllers)
- `apps/frontend/features/emr/components/VisitWorkspace.tsx` (added Medical History / Allergy tabs + the Clinical Alert banner)

## Database Changes

Migration `20260802073300_add_medical_history_and_allergy`: `medical_histories`, `allergies` tables.

## API Changes

| Endpoint | Permission |
|---|---|
| `POST /patients/:patientId/medical-history` | `emr.medical-history.record` |
| `GET /patients/:patientId/medical-history` | `emr.visit.read` (reused; neither task names a dedicated read code) |
| `POST /patients/:patientId/allergies` | `emr.allergy.record` |
| `GET /patients/:patientId/allergies` | `emr.visit.read` |

## Frontend Changes

Two new tabs in `VisitWorkspace`, plus a `ClinicalAlertBanner` that surfaces automatically at Visit open whenever the patient has a `SEVERE` allergy on record — verified with a dedicated test asserting the banner shows/hides correctly.

## Security Validation

- Write endpoints gated by their own dedicated permission codes; reads reuse the broader `emr.visit.read` (a deliberate, documented choice, not an oversight).
- `AllergyCheckService` (built here, consumed by Epic N's Prescription flow) reads directly through `IAllergyRepository` — this is the seam Prescription's hard-block allergy validation depends on.

## Architecture Validation

- Medical History's category-versioning (`deactivateByCategory` + create) is transactional at the use-case level, not a database trigger, keeping the business rule visible in application code per Clean Architecture layering.
- Both repositories expose `findByPatientId`/`findActiveByPatientId` (Medical History) used later by Epic U's `GetPatientTimelineSummaryUseCase` for the "active alerts" summary field — built once here, reused without duplication.
