# Epic J: Foundational Infrastructure — Documentation (task-003–006)

> **Retroactive documentation.** Produced after implementation and testing were already complete, in response to the original build instruction's "OUTPUT FORMAT" requirement (Documentation Reviewed → Task List → Implementation Plan → Files → DB/API/Frontend Changes → Security/Architecture Validation, normally required *before* code). Structured per that template at Epic granularity rather than per-task or pre-code, per explicit user decision. See `docs/06-tasks/phase-1-implementation-report.md` for the full Phase 1 as-built report and ambiguity log this document is drawn from.

---

## Documentation Reviewed

- `docs/04-ai-contract/06-database-contract.md` (migration strategy, audit columns, soft-delete policy)
- `docs/04-ai-contract/02-architecture-contract.md`, `03-project-structure-contract.md` (Clean Architecture layering, module folder structure)
- `docs/03-sad/06-database-design.md`, `07-data-dictionary.md`, `08-erd.md` (schema source, conflicting in places — resolved via task-003.md priority)
- `docs/06-tasks/task-003.md` (Initial Schema Migration), `task-004.md` (Env/Secret Config), `task-005.md` (App Scaffold), `task-006.md` (Audit Trail Service)
- `docs/03-sad/02-system-architecture.md` Section 15.3 (middleware pipeline), Section 20.4 (Audit Trail)

## Task List

| Task | Name |
|---|---|
| task-003 | Initial Database Schema Migration (Phase 1 Entities) |
| task-004 | Environment & Secret Configuration |
| task-005 | Backend Application Scaffold (Express + Middleware Pipeline) |
| task-006 | Audit Trail Service (Cross-Cutting) |

## Implementation Plan

Established the repository's physical foundation before any business module could be built: the Prisma schema for every Phase 1 entity, environment-driven configuration (no hardcoded secrets), the Express composition root with its middleware pipeline (correlation ID → logging → CORS → security headers → module routers → 404 → centralized error handler), and a cross-cutting `AuditService` every later use case would call. Table plurality and users/role shape conflicts between `task-003.md` and the SAD were resolved in `task-003.md`'s favor per document priority.

## Files Created

- `apps/backend/prisma/schema.prisma`
- `apps/backend/src/shared/config/ConfigService.ts`, `config.types.ts`, `ConfigService.test.ts`
- `apps/backend/src/app.ts`, `apps/backend/src/server.ts` (bootstrap)
- `apps/backend/src/shared/logging/{correlationId,logger,requestLogger}.ts`
- `apps/backend/src/shared/http/{ApiResponse,errorHandler,healthRoutes,ListQueryDto,pagination,securityHeaders,validateBody,validateQuery}.ts`
- `apps/backend/src/shared/http/exceptions/{ApplicationException,index}.ts`
- `apps/backend/src/shared/infrastructure/prisma.ts`
- `apps/backend/src/shared/security/{durationParser,opaqueToken,rateLimiter}.ts`
- `apps/backend/src/shared/events/EventBus.ts`
- `apps/backend/src/modules/system/domain/services/IAuditService.ts`
- `apps/backend/src/modules/system/infrastructure/services/{AuditService,AuditService.test}.ts`
- `apps/backend/.env.example`

## Files Modified

None — this epic established the repository from an empty state.

## Database Changes

Initial migration covering every Phase 1 table (Auth/System, Master Data, Patient, Reservation, Queue, EMR, Billing scaffold, Audit Log). Every table: UUID `CHAR(36)` primary key, standard audit columns (`createdAt/By`, `updatedAt/By`, `deletedAt/By` where soft-delete applies per `docs/04-ai-contract/06-database-contract.md`).

## API Changes

None business-facing. `GET /health` (liveness) added by `healthRoutes.ts`.

## Frontend Changes

None — Phase 1 was implemented backend-only by explicit user decision (see `docs/06-tasks/phase-1-implementation-report.md` Section 7). The Next.js app scaffold itself (`apps/frontend/`) was created later, outside epic-by-epic scope, once the user asked to proceed with frontend.

## Security Validation

- No secrets hardcoded; all config sourced from environment variables via `ConfigService`, which fails fast if a required variable is missing.
- `helmet()` + a custom `permissionsPolicyMiddleware` applied globally in `app.ts`.
- CORS restricted to a configured origin, explicit allowed methods/headers.
- Centralized `errorHandlerMiddleware` ensures no stack trace or raw DB error ever reaches the client (matches AUTH-089's broader security-response principle, applied system-wide not just to auth).

## Architecture Validation

- Confirmed against `docs/03-sad/04-project-structure.md` Part 2 layout: `modules/*/{presentation,application,domain,infrastructure}`, `shared/`, `app.ts`/`server.ts` at `src/` root.
- `AuditService` placed under `modules/system` (not `shared/`) since it is itself a bounded-context service with a domain interface (`IAuditService`), consumed by every other module via dependency injection — not framework-level shared code.
- `EventBus` placed under `shared/events/` as the one deliberate cross-module coupling point, per `docs/04-ai-contract/07-module-contract.md`'s "cross-module communication is events only."
