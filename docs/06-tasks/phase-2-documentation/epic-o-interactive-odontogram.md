# Epic O: Interactive Odontogram — Documentation (task-067–070)

> Retroactive documentation, per the template in `phase-1-documentation/epic-j-foundational-infrastructure.md`'s header note.

---

## Documentation Reviewed

- `docs/06-tasks/task-067.md`–`task-070.md`
- `docs/03-sad/15-module-emr.md` Part 3.1B (Sections 12–14, FDI tooth numbering — permanent quadrants 1–4, primary quadrants 5–8) and Part 3.1C Section 21.2 (`ToothConditionCategory` enum)

## Task List

| Task | Name |
|---|---|
| task-067 | Tooth Condition Reference Data (CRUD), P0 — Blocking |
| task-068 | Record / Update Tooth Condition (Odontogram Entry), P0 — Blocking |
| task-069 | Get Current Odontogram State, P1 |
| task-070 | Odontogram History (Per-Tooth Timeline), P2 |

## Implementation Plan

`ToothCondition` is master-data catalog (CRUD, built first per the plan's stated dependency order). `OdontogramEntry` is an **append-only log** keyed by `patientId` + `toothNumber` (+ optional `surface`): task-069's "current state" is derived as the latest entry per tooth, and task-070's "history" is every entry for one tooth in chronological order — no update/delete on individual entries, matching "setiap perubahan ... akan langsung memperbarui ... histori" (SAD line 2879).

## Files Created

`apps/backend/src/modules/master-data/` (task-067):
- `domain/repositories/IToothConditionRepository.ts`
- `application/dtos/ToothConditionRequestDto.ts`
- `infrastructure/repositories/ToothConditionRepository.ts`
- (CRUD use cases/controller built via the existing `crudUseCaseFactory`/`crudControllerFactory` shared factories — no new files needed for the use-case/controller layer itself)

`apps/backend/src/modules/emr/` (task-068–070):
- `domain/repositories/IOdontogramRepository.ts`
- `domain/services/fdiToothNumbers.ts`
- `application/dtos/RecordToothConditionRequestDto.ts`, `OdontogramEntryResponseDto.ts`
- `application/mappers/OdontogramMapper.ts`
- `application/use-cases/RecordToothConditionUseCase.ts` + `.test.ts`, `GetCurrentOdontogramUseCase.ts` + `.test.ts`, `GetToothHistoryUseCase.ts` + `.test.ts`
- `infrastructure/repositories/OdontogramRepository.ts`
- `presentation/controllers/OdontogramController.ts`

Frontend: `features/master-data/components/ToothConditionsAdminPage.tsx`, `hooks/useToothConditions.ts`, `services/toothCondition.service.ts`; `features/emr/components/OdontogramSection.tsx` + `.test.tsx`.

## Files Modified

- `apps/backend/prisma/schema.prisma` (added `ToothConditionCategory` enum + `ToothCondition`, `OdontogramEntry` models)
- `apps/backend/src/modules/master-data/presentation/routes/master-data.routes.ts` (wired `/tooth-conditions` CRUD)
- `apps/backend/src/modules/emr/presentation/routes/emr.routes.ts` (wired `odontogramController`)
- `apps/frontend/features/emr/components/VisitWorkspace.tsx` (added Odontogram tab)
- `apps/frontend/app/(dashboard)/master-data/tooth-conditions/page.tsx` (new admin screen)

## Database Changes

Migration `20260802075215_add_odontogram`: `tooth_conditions`, `odontogram_entries` tables.

## API Changes

| Endpoint | Permission |
|---|---|
| `GET /tooth-conditions` | `masterdata.tooth-condition.read` |
| `POST /tooth-conditions` | `masterdata.tooth-condition.manage` |
| `GET /tooth-conditions/:id` | `masterdata.tooth-condition.read` |
| `PUT /tooth-conditions/:id` | `masterdata.tooth-condition.manage` |
| `POST /emr/visits/:id/odontogram` | `emr.odontogram.record` |
| `GET /patients/:patientId/odontogram` | `emr.odontogram.read` |
| `GET /patients/:patientId/odontogram/:toothNumber/history` | `emr.odontogram.read` |

## Frontend Changes

`OdontogramSection` — a clickable tooth-chart UI (FDI numbering, permanent + primary dentition) with per-tooth condition recording and a history drill-down; `ToothConditionsAdminPage` for catalog management.

## Security Validation

- `InvalidToothNumberException`/`InvalidSurfaceCombinationException` enforce FDI validity and non-repeating M/D/B/L/O/I surface sets server-side, not just client-side.
- `ToothConditionNotActiveException` blocks recording against a deactivated catalog entry (mirrors Phase 1's `TreatmentNotActiveException` pattern).

## Architecture Validation

- `fdiToothNumbers.ts` centralizes the permanent (11–48) + primary (51–85) tooth-number generation used by both the validation logic and the frontend chart, avoiding two independently-maintained copies of the FDI numbering rule.
- The write path is Visit-scoped (needs an open Visit to attribute the entry to) while the two read paths are Patient-scoped — a split-scoping shape also seen (with a different write-side rule) in Epic L's Medical History/Allergy, each documented independently since the two epics' write-side scoping differs (Odontogram requires an open Visit to write; Medical History/Allergy write directly against the Patient with only an optional `visitId`).
