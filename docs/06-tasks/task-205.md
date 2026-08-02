# task-205: Feature Flag (Entity, Migration & CRUD)

**Phase:** Phase 3 - Operational Excellence
**Epic:** AK. Approval Workflow
**Feature:** AK3. Feature Flag
**Module:** System
**Priority:** P2 - Medium

---

## Business Goal

Create the `FeatureFlag` entity/migration and `GET/POST /system/feature-flags`, `PATCH /system/feature-flags/{flagKey}` per docs/03-sad/21-module-system.md UC-SYS-004 Manage Feature Flag.

## Depends On

- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md, docs/04-ai-contract/05-auth-contract.md
- **PRD:** docs/01-prd/features/system.md, docs/01-prd/business-rules.md § 10
- **SAD:** docs/03-sad/21-module-system.md (Section 4.5 UC-SYS-004 Manage Feature Flag, Section 6.2 API)
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-013, task-014, task-006.

## Backend Scope

- Domain layer: `FeatureFlag` entity (key, ownerModule, targetScope/audience, defaultSafeState, effectivePeriod, rollbackPlan, expiry/review date for critical flags) per UC-SYS-004.
- Infrastructure layer: Prisma migration for `system_feature_flags`.
- Application layer: `CreateFeatureFlagUseCase`, `ListFeatureFlagsUseCase`, `UpdateFeatureFlagUseCase`.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates system_feature_flags table.

## API Impact

Adds GET/POST /system/feature-flags, PATCH /system/feature-flags/{flagKey}.

## Workflow Impact

Realizes UC-SYS-004 Manage Feature Flag.

## Security Impact

`SYS_FLAG_AUTH_BYPASS_FORBIDDEN` (422) rejects any flag definition that attempts to replace authorization — enabling a flag only exposes a capability to users who already pass its API/domain permission.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `FeatureFlag` entity, migration, repository
- Create/List/Update use cases, routes, controllers, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/system.md (sourced from docs/03-sad/21-module-system.md):

- `SYS_FLAG_AUTH_BYPASS_FORBIDDEN` enforced at creation/update.
- Critical flags require an expiry/review date.

## Definition of Done

Entity, migration, and CRUD endpoints implemented and tested.

---

## Dependency Detail

- **Blocked By:** task-013, task-014, task-006
- **Required Before:** See phase-3-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
