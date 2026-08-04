# Epic AI: Audit Dashboard — Documentation (task-192–194)

---

## Documentation Reviewed

- `docs/06-tasks/task-192.md`–`task-194.md`
- `docs/03-sad/21-module-system.md` UC-SYS-006 (§4.7), UC-SYS-007 (§4.8), §5.4, §6.3
- `docs/04-ai-contract/04/06/07/09`; `phase-3-plan.md` Ambiguities

## Task List

| Task | Name | Status |
|---|---|---|
| task-192 (P1) | Audit Log Query (`GET /system/audit-logs`) — `QueryAuditLogsUseCase` | Done |
| task-193 (P2) | Activity Log Query (`GET /system/activity-logs`) — `QueryActivityLogsUseCase` | Done |
| task-194 (P2) | Operations Health Dashboard (`GET /system/health/operations`) — `GetOperationsHealthUseCase` | Deferred at this epic's own commit; completed later as part of Epic AL |

## Implementation Plan

task-192/193 shipped together in commit `aa5d62e` ("Epic AI — Audit Dashboard, task-192/193 (task-194 deferred)"). task-194 could not ship with the rest of Epic AI because its Backend Scope literally depends on the background job registry (task-207), which did not exist yet — the same class of blocked deferral applied elsewhere in Phase 3 (task-136, task-162). It shipped later in commit `9fb2771` alongside Epic AL, with that commit's body explicitly noting: *"Bonus: completes task-194 (Operations Health Dashboard, Epic AI), which was explicitly deferred pending this exact registry."* See `epic-al-background-job-operations.md` for task-194's actual implementation detail.

**Deviation from spec:** task-192's Backend Scope asks for filtering by "date, module, branch, actor, target, action, correlation id, outcome" — module/branch/outcome filters were dropped because the actual `audit_logs` table (written since Phase 1's task-006) has no such columns. This is a documented gap, not a silently retrofitted feature across every module's `auditService.record()` call site.

## Files Created

- `apps/backend/src/modules/system/application/dtos/AuditLogQueryDto.ts`, `ActivityLogQueryDto.ts`, `AuditLogResponseDto.ts`
- `apps/backend/src/modules/system/application/mappers/AuditLogMapper.ts`
- `apps/backend/src/modules/system/application/use-cases/QueryAuditLogsUseCase.ts`, `QueryActivityLogsUseCase.ts`
- `apps/backend/src/modules/system/application/use-cases/AuditAndActivityLogs.test.ts` (3 tests)
- `apps/backend/src/modules/system/domain/repositories/IAuditLogRepository.ts`, `IActivityLogRepository.ts`
- `apps/backend/src/modules/system/infrastructure/repositories/AuditLogRepository.ts`, `ActivityLogRepository.ts`
- `apps/backend/src/modules/system/presentation/controllers/AuditController.ts`
- `apps/backend/prisma/migrations/20260803064932_add_activity_logs/migration.sql`
- (task-194, shipped with Epic AL) `apps/backend/src/modules/system/application/use-cases/GetOperationsHealthUseCase.ts`

## Files Modified

- `apps/backend/openapi.yaml`, `apps/backend/prisma/schema.prisma` (`ActivityLog` model added), `apps/backend/prisma/seed.ts`, `apps/backend/src/modules/system/presentation/routes/system.routes.ts`

## Database Changes

- `AuditLog` (pre-existing from Phase 1's task-006, read-only for this epic): `audit_logs` — `id, entity, entityId, action, oldValue, newValue, userId, ipAddress, correlationId, createdAt`. No update/delete path exists anywhere.
- New `ActivityLog` → `activity_logs`: `id, actorUserId, module, action, target, branchId, message, createdAt`. Non-FK `actorUserId`/`branchId` columns. No producer writes to it yet — confirmed empty at runtime at the time of the epic's own commit.
- task-194 reads `system_background_jobs` (added later, task-207) — no new table of its own.

## API Changes

| Method | Path | Permission |
|---|---|---|
| GET | `/system/audit-logs` | `system.audit.read` |
| GET | `/system/activity-logs` | `system.activity.read` |
| GET | `/system/health/operations` | `system.health.read` (shipped with Epic AL) |

Filters actually supported on `/system/audit-logs`: date range, actor, entity (target), entityId, action, correlationId — module/branch/outcome filters are **not** supported (a documented gap, not an oversight). All confirmed present in `openapi.yaml` (paths at lines 510/528/913).

## Frontend Changes

None — no `task-192`–`194` citations found anywhere under `apps/frontend`.

## Security Validation

- **`SYS_AUDIT_IMMUTABLE` is enforced structurally, not via a checked exception class**: there is simply no update/delete route registered for `/system/audit-logs` anywhere in `system.routes.ts`. The route file carries an explicit comment: *"no update/delete route exists for audit_logs anywhere in this codebase, so SYS_AUDIT_IMMUTABLE is satisfied structurally."*
- The audit-log query itself writes a new `AuditLog` event (`entity=AuditLog, action=READ`) — self-audit-of-the-query is one of the 3 tests in `AuditAndActivityLogs.test.ts`.
- Sensitive-field redaction happens at `AuditService.record()` write time (Phase 1's task-006), not at read time in this epic.
- The SAD's §4.1 Actor Matrix "Clinic Manager limited view" for activity logs is **not implemented** — no Clinic Manager role exists in seeded RBAC (roles are Administrator/Doctor/Registration/Cashier/Warehouse\*/Finance\*); gated by permission only, a documented Phase 4/5 RBAC gap.
- New permissions seeded: `system.audit.read`, `system.activity.read` (both Administrator-only via the blanket grant).

## Architecture Validation

Clean layering respected (routes → controller → use case → repository interface → Prisma repo). No cross-module DB access. Read-only queries only in this epic (except the self-audit write, which reuses the existing `IAuditService`). Test coverage: `AuditAndActivityLogs.test.ts` (3 tests); task-194's health aggregation is covered inside `BackgroundJobOperations.test.ts` (Epic AL), not a separate test file.
