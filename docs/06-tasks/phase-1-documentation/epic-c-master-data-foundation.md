# Epic C: Master Data Foundation — Documentation (task-021–026)

> Retroactive documentation, per the template in `epic-j-foundational-infrastructure.md`'s header note.

---

## Documentation Reviewed

- `docs/06-tasks/task-021.md`–`task-026.md`
- `docs/03-sad/11-module-master-data.md` Section 8 (20 catalog entities documented; only 6 in Phase 1 scope)
- `docs/04-ai-contract/04-api-contract.md` (URL/pagination/sorting convention — applied since Master Data has no literal endpoint paths in the SAD; flagged as Ambiguity #1 in `phase-1-plan.md`)

## Task List

| Task | Name |
|---|---|
| task-021 | Clinic Entity (CRUD) |
| task-022 | Branch Entity (CRUD) |
| task-023 | Doctor Entity (CRUD) |
| task-024 | Treatment Category Entity (CRUD) |
| task-025 | Treatment Entity (CRUD) |
| task-026 | Payment Method Entity (CRUD) |

## Implementation Plan

Six independent catalog entities (Clinic, Branch, Doctor, Treatment Category, Treatment, Payment Method), each following an identical list/create/detail/update shape. A shared `crudUseCaseFactory` was introduced to avoid duplicating five near-identical CRUD use-case bodies six times — the one deliberate abstraction in this epic, justified because the six entities are structurally identical (not a premature abstraction over dissimilar things).

## Files Created

`apps/backend/src/modules/master-data/`: `application/dtos/{Branch,Clinic,Doctor,PaymentMethod,TreatmentCategory,Treatment}RequestDto.ts`, `application/shared/crudUseCaseFactory.ts` (+ test), `domain/exceptions/MasterDataExceptions.ts`, `domain/repositories/{IBranch,IClinic,IDoctor,IMasterData,IPaymentMethod,ITreatmentCategory,ITreatment}Repository.ts`, `infrastructure/repositories/*Repository.ts` (6), `presentation/controllers/crudControllerFactory.ts`, `presentation/routes/master-data.routes.ts`.

## Files Modified

`apps/backend/src/app.ts` (mounted `buildMasterDataModule`).

## Database Changes

None beyond Epic J's initial migration (`Clinic`, `Branch`, `Doctor`, `DoctorSchedule`, `TreatmentCategory`, `Treatment`, `PaymentMethod` already scaffolded there).

## API Changes

Six resource families, each: `GET /<resource>` (list, paginated), `POST /<resource>` (create), `GET /<resource>/:id` (detail), `PUT /<resource>/:id` (update). Permission codes: `masterdata.<entity>.read` / `masterdata.<entity>.manage`.

## Frontend Changes

None. Master Data administration screens are not built.

## Security Validation

- Every write endpoint gated by `masterdata.<entity>.manage`, distinct from `.read`, per least-privilege (RBAC-002).
- No entity allows hard delete — only soft-delete (`deletedAt`) via the shared repository base, matching `docs/04-ai-contract/06-database-contract.md`'s soft-delete policy.

## Architecture Validation

- `crudUseCaseFactory` and `crudControllerFactory` live in `application/shared/` and `presentation/controllers/` respectively, scoped to this module only — not promoted to the global `shared/` folder, since they're specific to Master Data's six-entity shape, not reusable business-agnostic code (correctly avoids `docs/04-ai-contract/03-project-structure-contract.md` STRUCT-008's "shared must not contain business logic" by keeping it module-local).
- Each of the six entities still has its own repository interface/implementation and DTOs — the factory only removes duplication in use-case orchestration, not in domain typing.
