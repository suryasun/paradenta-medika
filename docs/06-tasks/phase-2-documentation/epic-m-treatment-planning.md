# Epic M: Treatment Planning — Documentation (task-063–064)

> Retroactive documentation, per the template in `phase-1-documentation/epic-j-foundational-infrastructure.md`'s header note.

---

## Documentation Reviewed

- `docs/06-tasks/task-063.md`, `task-064.md`
- `docs/03-sad/15-module-emr.md` (Treatment Planning fields — priority, estimated cost/duration)
- Phase 1 `CreateReservationUseCase` (task-002/031) — reused, not duplicated, for task-064's conversion flow

## Task List

| Task | Name |
|---|---|
| task-063 | Create Treatment Plan (multi-visit), P1 |
| task-064 | Convert Treatment Plan Item to Reservation, P2 |

## Implementation Plan

`TreatmentPlanItem` is a multi-entry, Visit-scoped plan (created in bulk via `createMany`) with per-item `treatmentId`/`toothNumber`/`surface`/`priority`/`estimatedCost`/`estimatedDurationMinute`. Converting a single item to a Reservation delegates to the existing Phase 1 `CreateReservationUseCase` (pre-filled with the item's patient + a `treatmentPlanItemId` FK) rather than re-implementing scheduling/doctor-availability validation — the same module-independence pattern used elsewhere in this phase.

## Files Created

`apps/backend/src/modules/emr/`:
- `domain/repositories/ITreatmentPlanRepository.ts`
- `application/dtos/CreateTreatmentPlanRequestDto.ts`, `ConvertTreatmentPlanToReservationRequestDto.ts`, `TreatmentPlanItemResponseDto.ts`
- `application/mappers/TreatmentPlanMapper.ts`
- `application/use-cases/CreateTreatmentPlanUseCase.ts` + `.test.ts`, `GetTreatmentPlanUseCase.ts`, `ConvertTreatmentPlanToReservationUseCase.ts` + `.test.ts`
- `infrastructure/repositories/TreatmentPlanRepository.ts`
- `presentation/controllers/TreatmentPlanController.ts`

Frontend: `features/emr/components/TreatmentPlanSection.tsx` + `.test.tsx`, `hooks/useTreatmentPlan.ts`.

## Files Modified

- `apps/backend/prisma/schema.prisma` (added `TreatmentPlanPriority` enum + `TreatmentPlanItem` model, with a `reservations Reservation[]` back-relation used later by Epic U to determine "open" items)
- `apps/backend/src/modules/emr/presentation/routes/emr.routes.ts` (wired `treatmentPlanController`, instantiated `CreateReservationUseCase` for reuse)
- `apps/frontend/features/emr/components/VisitWorkspace.tsx` (added Treatment Plan tab)

## Database Changes

Migration `20260802081503_add_treatment_planning`: `treatment_plan_items` table.

## API Changes

| Endpoint | Permission |
|---|---|
| `POST /emr/visits/:id/treatment-plan` | `emr.treatment-plan.create` |
| `GET /emr/visits/:id/treatment-plan` | `emr.treatment-plan.read` |
| `POST /emr/treatment-plan/:itemId/convert-to-reservation` | `emr.treatment-plan.read` **and** `reservation.create` (task-064's Security Impact literally names both; chained middleware enforces both) |

## Frontend Changes

`TreatmentPlanSection` — multi-item entry form + list, with a "Convert to Reservation" action per item.

## Security Validation

Dual-permission chain on the conversion endpoint (`emr.treatment-plan.read` + `reservation.create`) rather than inventing a single combined code, since the task's own Security Impact section named both literally.

## Architecture Validation

- `ConvertTreatmentPlanToReservationUseCase` composes `CreateReservationUseCase` in-process (constructor injection, not an HTTP call) — verified end-to-end by `ConvertTreatmentPlanToReservationUseCase.test.ts`, which asserts the resulting Reservation carries the `treatmentPlanItemId` FK.
- The `reservations` back-relation on `TreatmentPlanItem` (added for this epic) has no consumer yet within Epic M itself — it exists purely so Epic U's summary panel can later distinguish "open" (not yet converted) items without inventing a separate status field. This is called out explicitly in the schema so the relation's purpose is not orphaned/mysterious to a future reader.
- Per-entry array validation (`items[]`) uses plain `@IsArray()`/`@ArrayMinSize(1)` plus manual per-entry checks in the use case, not `@ValidateNested()`/`@Type()` — same `reflect-metadata`-avoidance reason documented in Phase 1's `epic-g-emr-basic.md`.
