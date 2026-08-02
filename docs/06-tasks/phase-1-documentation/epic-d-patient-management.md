# Epic D: Patient Management — Documentation (task-001, 027–030)

> Retroactive documentation, per the template in `epic-j-foundational-infrastructure.md`'s header note.

---

## Documentation Reviewed

- `docs/06-tasks/task-001.md`, `task-027.md`–`task-030.md`
- `docs/03-sad/12-module-patient.md` (Golden Reference module — Section 41 of `03-clean-architecture.md` cites this module as the canonical Clean Architecture example)
- `docs/01-prd/business-rules.md` Section 2, `docs/01-prd/acceptance-criteria/` (Patient)
- `docs/02-design/pages/patient.md` (the one module with an actual page-level frontend spec)

## Task List

| Task | Name |
|---|---|
| task-001 | Create Patient (re-implemented from scratch — see below) |
| task-027 | Patient List & Search (GET /patients) |
| task-028 | Patient Detail (GET /patients/{id}) |
| task-029 | Update Patient (PUT /patients/{id}) |
| task-030 | Archive / Restore Patient |

task-001 was marked "already implemented" in `phase-1-plan.md`, but no corresponding source code existed in the repository at the start of this build. Per explicit user decision at the start of the session, it was treated as not implemented and built from scratch alongside task-027–030.

## Implementation Plan

Patient is the Golden Reference module — its structure (a proper `PatientEntity` domain object, not just a Prisma-typed row, plus `PatientEvents` for cross-module notification) was used as the template every subsequent module's Clean Architecture layering copied. Sequential Medical Record Number generation follows the count-candidate-retry pattern reused by every later module's number generator (Reservation, Queue, Visit, Invoice).

## Files Created

`apps/backend/src/modules/patient/`: `application/{dtos,mappers,services,use-cases}/*`, `domain/{entities,events,exceptions,repositories}/*`, `infrastructure/repositories/PatientRepository.ts`, `presentation/{controllers,routes}/*`.

## Files Modified

`apps/backend/src/app.ts` (mounted `buildPatientModule`, passed the shared `eventBus`).

## Database Changes

None beyond Epic J's initial migration.

## API Changes

| Endpoint | Permission |
|---|---|
| `GET /patients` | `patient.read` |
| `POST /patients` | `patient.create` |
| `GET /patients/:id` | `patient.read` |
| `PUT /patients/:id` | `patient.update` |
| `PATCH /patients/:id/archive` | `patient.archive` |
| `PATCH /patients/:id/restore` | `patient.archive` |

## Frontend Changes

None yet, despite `docs/02-design/pages/patient.md` being the one module with a real page spec — Patient frontend was not reached before the session's frontend scope was paused after the Auth/Dashboard vertical slice. Candidate for the next frontend increment.

## Security Validation

- `patient.archive` gates both archive and restore (single permission for the reversible pair, per task-030's own scope).
- Archived patients remain retrievable via direct detail lookup (a self-caught fix during implementation: `archive()` originally set both `active:false` and `deletedAt`, which would have broken `findById()`'s `deletedAt:null` filter and violated task-030's AC — corrected to toggle only `active`).

## Architecture Validation

- `PatientEntity` (`domain/entities/PatientEntity.ts`) is a genuine domain object distinct from the Prisma `Patient` type, per the Golden Reference pattern — mapped at the repository boundary.
- Publishes `PatientRegistered`/`Updated`/`Archived`/`Restored` domain events via the shared `EventBus`, consumed nowhere yet in Phase 1 but available for Phase 2+ (e.g., Reporting/Notification).
