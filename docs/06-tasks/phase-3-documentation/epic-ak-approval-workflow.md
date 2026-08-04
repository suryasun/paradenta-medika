# Epic AK: Approval Workflow — Documentation (task-200–206)

---

## Documentation Reviewed

- `docs/06-tasks/task-200.md`–`task-206.md`
- `docs/03-sad/21-module-system.md` UC-SYS-003 (§4.4), UC-SYS-004 (§4.5), §3.2, §5.3, §6.2
- `docs/06-tasks/phase-3-plan.md` Ambiguity #7 (Approval Workflow permission codes inferred, not literal)

## Task List

| Task | Name |
|---|---|
| task-200 (P1) | System Parameter (Entity/Migration, `GET/POST /system/parameters`) |
| task-201 (P2) | Parameter Versions (`GET /system/parameters/{parameterKey}/versions`) |
| task-202 (P0) | Configuration Change Request (`POST /system/parameters/{parameterKey}/change-requests`) |
| task-203 (P0) | Approve Change Request (`POST /system/configuration-change-requests/{requestId}/approve`) |
| task-204 (P2) | Rollback Parameter (`POST /system/parameters/{parameterKey}/rollback`) |
| task-205 (P2) | Feature Flag (Entity/Migration/CRUD) |
| task-206 (P2) | Menu (Entity/Migration/CRUD + permission mapping) |

## Implementation Plan

All 7 shipped together in commit `2c66129`. Deviation from the SAD reading: rather than a separate `system_parameter_versions` table (marked "recommended, not mandatory" per the SAD's own asterisk), `SystemParameter` is append-only per `(key, scopeType, scopeId)` — the highest version *is* both the active value and the version history, mirroring `NotificationTemplate`'s pattern from Epic AJ.

## Files Created

- DTOs: `SystemParameterRequestDto.ts`, `ApprovalWorkflowQueryDto.ts`, `ConfigurationChangeRequestDto.ts`, `FeatureFlagRequestDto.ts`, `MenuRequestDto.ts`
- Service: `SystemParameterValueValidator.ts` (typed-schema validation per `valueType`, shared by Create and change-request proposal)
- Use cases: `CreateParameterUseCase.ts`, `ListParametersUseCase.ts`, `ListParameterVersionsUseCase.ts`, `CreateConfigurationChangeRequestUseCase.ts`, `ApproveConfigurationChangeRequestUseCase.ts`, `RollbackParameterUseCase.ts`, `CreateFeatureFlagUseCase.ts`, `ListFeatureFlagsUseCase.ts`, `UpdateFeatureFlagUseCase.ts`, `CreateMenuUseCase.ts`, `ListMenusUseCase.ts`, `UpdateMenuPermissionsUseCase.ts`
- `ApprovalWorkflow.test.ts` (16 tests)
- Domain repositories: `ISystemParameterRepository.ts`, `IConfigurationChangeRequestRepository.ts`, `IFeatureFlagRepository.ts`, `IMenuRepository.ts` (+ Prisma implementations)
- `ApprovalWorkflowController.ts`

## Files Modified

- `openapi.yaml`, `schema.prisma`, `seed.ts`, `app.ts`, `SystemExceptions.ts`, `system.routes.ts`

## Database Changes

- `SystemParameter` → `system_parameters`: `id, key, scopeType (default GLOBAL), scopeId, valueType (enum STRING/INTEGER/DECIMAL/BOOLEAN/ENUM/DATE/DURATION/JSON/SECRET_REF), value, version, isHighRisk, effectiveFrom, changeReason, createdAt, createdBy`. `@@unique([key, scopeType, scopeId, version])` — append-only, immutable rows.
- `ConfigurationChangeRequest` → `system_configuration_change_requests`: `id, parameterKey, scopeType, scopeId, proposedValueType, proposedValue, reason, isRollback, rollbackFromVersion, status (enum PENDING/APPROVED/REJECTED), requestedBy, approvedBy, approvedAt, rejectedBy, rejectedAt, rejectionReason, resultingVersion, createdAt`.
- `FeatureFlag` → `system_feature_flags`: `id, flagKey (unique), ownerModule, targetScope, enabled, riskClass (default standard), effectiveFrom, effectiveUntil, reviewDate, description, createdAt/By, updatedAt/By`.
- `Menu` → `system_menus`: `id, menuKey (unique), label, route, parentId (self-relation), icon, order, isActive, createdAt/By`. `MenuPermission` → `system_menu_permissions`: `id, menuId, permissionId`, `@@unique([menuId, permissionId])`.

## API Changes

| Method | Path | Permission |
|---|---|---|
| GET | `/system/parameters` | `system.parameter.read` |
| POST | `/system/parameters` | `system.parameter.manage` |
| GET | `.../versions` | `system.parameter.read` |
| POST | `/system/parameters/{key}/change-requests` | `system.config-request.create` |
| POST | `/system/configuration-change-requests/{id}/approve` | `system.config-request.approve` |
| POST | `/system/parameters/{key}/rollback` | `system.config-request.create` |
| GET | `/system/feature-flags` | `system.feature-flag.read` |
| POST | `/system/feature-flags` | `system.feature-flag.manage` |
| PATCH | `/system/feature-flags/{flagKey}` | `system.feature-flag.manage` |
| GET | `/system/menus` | `system.menu.read` |
| POST | `/system/menus` | `system.menu.manage` |
| PATCH | `/system/menus/{menuId}/permissions` | `system.menu.manage` |

All 12 confirmed present in both `system.routes.ts` and `openapi.yaml`.

## Frontend Changes

None — backend-only.

## Security Validation

- `SYS_SECRET_VALUE_FORBIDDEN` (422, literal Section 6.4 code): raw `SECRET_REF` values are rejected unless they start with a recognized reference scheme (`ref:`/`vault:`) — `SystemExceptions.ts` line 119.
- `SYS_CONFIG_VERSION_CONFLICT` (409, literal code): duplicate pending proposal for the same parameter/scope is rejected — line 139.
- `SYS_CONFIG_APPROVAL_REQUIRED` (403, literal code): `ApproveConfigurationChangeRequestUseCase` throws it when `requester === approver` (line 158) — no self-approval, enforced and covered by test.
- On approval, `system.configuration.changed.v1` is published exactly once (verified by test — event count === 1).
- `RollbackParameterUseCase` does **not** bypass the approval gate — it creates a new `PENDING` change request (`isRollback=true`) rather than activating directly; a missing/empty reason is rejected before request creation.
- `SYS_FLAG_AUTH_BYPASS_FORBIDDEN` (422, literal code, line 171): enforced via a best-effort keyword screen on `targetScope`/`description` text (no concrete detection algorithm is specified anywhere in the SAD) — documented as not the sole enforcement mechanism; the real guarantee is architectural (no code path lets a flag substitute for a permission check).
- `SYS_FLAG_REVIEW_DATE_REQUIRED` (extrapolated, line 177): critical-risk flags require a `reviewDate` at both create and update.
- Permissions seeded: `system.parameter.read/manage`, `system.config-request.create/approve`, `system.feature-flag.read/manage`, `system.menu.read/manage` — all Administrator-only via blanket grant.

## Ambiguity #7 cross-check (permission codes inferred, not literal)

**Resolved with concrete, enforced permission-code strings, but explicitly flagged in code as an extrapolation.** `system.routes.ts` (lines 303–306) carries the comment: *"No literal Section 6.4-style permission table exists for these endpoints (unlike Finance/Warehouse/Reporting's own Section 8.1 tables) — extrapolated `system.parameter.*`/`system.config-request.*` names."* So Ambiguity #7 is resolved functionally (codes exist and every endpoint is enforced), but the codebase itself does not claim these codes are literally sourced from the SAD — matching `phase-3-plan.md`'s own framing that literal codes for the System module remain to be defined authoritatively.

## Architecture Validation

Clean layering maintained; `SystemParameterValueValidator` shared correctly between Create and change-request paths to avoid divergence. Test coverage: `ApprovalWorkflow.test.ts` — 16 tests (secret-reference enforcement, typed-schema validation, version incrementing, duplicate-pending-proposal conflict, self-approval rejection, successful approval + single event publish, rollback reason requirement, auth-bypass keyword screen, critical-flag review-date requirement, duplicate flag/menu keys, menu-permission validation against the live catalog).
