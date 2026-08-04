# Epic AL: Background Job Operations — Documentation (task-207–209, plus task-194 completed here)

---

## Documentation Reviewed

- `docs/06-tasks/task-207.md`–`task-209.md`, `docs/06-tasks/task-194.md`
- `docs/03-sad/21-module-system.md` UC-SYS-007 (§4.8), §5.4, §6.3, §6.4

## Task List

| Task | Name |
|---|---|
| task-207 (P1) | Background Job Registry (Entity/Migration, `GET /system/jobs`, `GET /system/jobs/{jobId}`) |
| task-208 (P1) | Retry (`POST /system/jobs/{jobId}/retry`) |
| task-209 (P2) | Cancel (`POST /system/jobs/{jobId}/cancel`) |
| task-194 (Epic AI, completed here as a bonus) | Operations Health Dashboard (`GET /system/health/operations`) |

## Implementation Plan

All shipped in commit `9fb2771`, which the commit message itself labels as "completes Phase 3." This commit also completed the previously-deferred task-194 (see `epic-ai-audit-dashboard.md`) since it required this exact registry to exist first — `GetOperationsHealthUseCase` aggregates `queueDepth` (queued+running+retrying), full status breakdown, and the 20 most recent failures with only safe `lastError`/`traceId` fields.

## Files Created

- `apps/backend/src/modules/system/application/dtos/BackgroundJobQueryDto.ts`
- `apps/backend/src/modules/system/application/use-cases/CancelBackgroundJobUseCase.ts`, `GetBackgroundJobUseCase.ts`, `GetOperationsHealthUseCase.ts`, `ListBackgroundJobsUseCase.ts`, `RetryBackgroundJobUseCase.ts`
- `apps/backend/src/modules/system/application/use-cases/BackgroundJobOperations.test.ts` (10 tests)
- `apps/backend/src/modules/system/domain/repositories/IBackgroundJobRepository.ts`
- `apps/backend/src/modules/system/infrastructure/repositories/BackgroundJobRepository.ts`
- `apps/backend/src/modules/system/presentation/controllers/BackgroundJobController.ts`

## Files Modified

- `openapi.yaml`, `schema.prisma`, `seed.ts`, `SystemExceptions.ts`, `system.routes.ts`

## Database Changes

`BackgroundJob` → `system_background_jobs`: `id, jobType, status (enum QUEUED/RUNNING/SUCCEEDED/RETRYING/FAILED/CANCELLED/DEAD_LETTER), payloadRef, idempotencyKey (unique), priority, attempts, maxAttempts (default 3), isRetryable (default true), scheduledAt, lockedAt, lockedBy, lastError, traceId, correlationId, createdAt, updatedAt`. `payloadRef` is deliberately a reference, never the raw payload, per §8.4's data-minimisation principle.

**Important documented gap** (schema comment, lines ~3220–3229): task-207's own text says this registry is "expected" to be used by every Phase 3 async worker (Report Jobs/Epic AH, Notification delivery/Epic AJ, Automatic Stock/Billing consumers), but **retrofitting `CreateReportJobUseCase` or `SendNotificationUseCase` to actually write rows here was not done** — out of those two tasks' literal Backend Scope (each only asked for the registry entity/migration plus List/Get/Retry/Cancel). At the time of this commit, a real `FAILED` job was seeded directly via Prisma for live verification purposes, since "no producer wires into this registry yet, a documented and correct state."

## API Changes

| Method | Path | Permission |
|---|---|---|
| GET | `/system/jobs` | `system.job.read` |
| GET | `/system/jobs/{jobId}` | `system.job.read` |
| POST | `/system/jobs/{jobId}/retry` | `system.job.manage` |
| POST | `/system/jobs/{jobId}/cancel` | `system.job.manage` |
| GET | `/system/health/operations` | `system.health.read` |

Route comment: *"No literal Section 6.4-style permission table exists for these endpoints — extrapolated `system.job.*`/`system.health.read` names,"* the same honest-extrapolation framing used across the System module's other epics (see Epic AK's Ambiguity #7 note). All 5 confirmed in `openapi.yaml`.

## Frontend Changes

None — backend-only.

## Security Validation

- `SYS_JOB_NOT_RETRYABLE` (409, literal Section 6.4 code, `SystemExceptions.ts` line 219): thrown when the job type isn't retryable, isn't in `FAILED`/`DEAD_LETTER` status, or has exhausted `maxAttempts`.
- Retry is a status transition on the same row — `idempotencyKey` is never touched, satisfying "no duplicate side effects" by construction rather than by a secondary check. Verified: attempts incremented, `idempotencyKey` unchanged, `FAILED → QUEUED`.
- `SYS_JOB_ALREADY_SUCCEEDED` (extrapolated, line 226): Cancel is explicitly rejected for `SUCCEEDED` jobs (already committed an external side effect) rather than silently no-op'd — directly satisfies task-209's AC ("does not silently lose the compensation requirement"). Already-terminal jobs (`CANCELLED`/`FAILED`/`DEAD_LETTER`) cancel idempotently as a no-op; `QUEUED`/`RUNNING`/`RETRYING` transition to `CANCELLED`.
- Permissions seeded: `system.job.read/manage`, `system.health.read` — Administrator-only.

## Architecture Validation

Clean layering maintained; the job registry is correctly modeled as its own domain concept rather than coupled to Report/Notification modules' internals. Test coverage: `BackgroundJobOperations.test.ts` — 10 tests (not-found, retry preserving idempotency key, non-retryable job type, exhausted max-attempts, wrong-status retry, successful cancel, already-`SUCCEEDED` cancel rejection, idempotent no-op on an already-cancelled job, status-filtered listing, operations-health aggregation).

## Phase 3 completion note

The commit body of `9fb2771` states this "completes Phase 3 (task-095–209) except for two permanently-documented, genuinely-blocked deferrals" — task-136 (Epic Z) and task-162 (Epic AE), both of which are since resolved in the current source tree per their own epic documents' timeline notes. Full test suite state recorded in that commit's own body: **116/116 suites, 439/439 tests passing** — see `../phase-3-implementation-report.md` for how this reconciles against the current working tree's numbers.
